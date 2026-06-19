import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperFactory } from '../scraping/scrappers/scraper.factory';

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  portal: string;
  url: string;
  applyUrl: string;
  matchScore: number;
  description: string;
  workMode: string;
  skills: string[];
  postedAt: string;
  isNew: boolean;
}

@Injectable()
export class JobDiscoveryService {
  private readonly logger = new Logger(JobDiscoveryService.name);

  // ===== HARCODED SKILLS (NOT from resume) =====
  private readonly hardcodedSkills = {
    // CORE SKILLS (Primary - MUST match at least 1)
    core: ['react', 'react.js', 'next.js', 'javascript', 'typescript', 'html5', 'css3'],
    
    // SECONDARY SKILLS (Nice to have)
    secondary: [
      'redux', 'redux toolkit', 'context api', 'tailwind', 'tailwind css',
      'ant design', 'antd', 'material ui', 'responsive design', 'cross-browser',
      'component design', 'reusable ui', 'modular architecture', 'design system',
      'micro frontend', 'code splitting', 'lazy loading', 'memoization',
      'bundle optimization', 'rendering optimization', 'api caching',
      'node.js', 'express.js', 'rest api', 'api integration', 'authentication',
      'rbac', 'nestjs', 'postgresql', 'mongodb', 'prisma', 'sql', 'nosql',
      'full stack', 'docker', 'kubernetes', 'ci/cd', 'containerization',
      'ollama', 'llm', 'embeddings', 'vector search', 'prompt engineering',
      'agile', 'scrum', 'git', 'github', 'code review'
    ],
    
    // BACKEND SKILLS (Least priority)
    backend: ['node.js', 'express.js', 'nestjs', 'postgresql', 'mongodb', 'prisma', 'sql', 'nosql']
  };

  // Get all skills as a flat array
  private getAllSkills(): string[] {
    return [...this.hardcodedSkills.core, ...this.hardcodedSkills.secondary];
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly scraperFactory: ScraperFactory,
  ) {}

  /**
   * Filter jobs by hardcoded skills - Core, Secondary, Backend priority
   */
  private filterJobsBySkills(jobs: any[]): any[] {
    if (jobs.length === 0) return [];

    const coreSkills = this.hardcodedSkills.core;
    const secondarySkills = this.hardcodedSkills.secondary;
    
    const filtered = jobs.filter((job) => {
      const content = `${job.title} ${job.description || ''} ${job.company || ''}`.toLowerCase();
      
      // Check for core skills (MUST match at least 1 core skill)
      const matchedCore = coreSkills.filter(skill => 
        content.includes(skill.toLowerCase())
      );
      
      if (matchedCore.length === 0) return false;
      
      // Check for secondary skills (bonus)
      const matchedSecondary = secondarySkills.filter(skill =>
        content.includes(skill.toLowerCase())
      );
      
      this.logger.log(
        `✅ Job: "${job.title}" at ${job.company} | Core: ${matchedCore.length} skills | Secondary: ${matchedSecondary.length} skills`
      );
      
      return true;
    });

    this.logger.log(
      `📊 Filtered ${jobs.length} -> ${filtered.length} jobs (Core skills required: ${coreSkills.join(', ')})`
    );
    return filtered;
  }

  /**
   * Discover jobs from ALL portals (working scrapers + external)
   */
  async discoverJobs(query: string, userSkills: string[]): Promise<{
    jobs: ExternalJob[];
    portals: { name: string; searchUrl: string }[];
    summary: string;
  }> {
    this.logger.log(`🔍 Job Discovery started for: "${query}"`);

    try {
      // 1. Analyze the query with AI
      this.logger.log('🤖 Analyzing query with AI...');
      const searchParams = await this.analyzeQueryWithAI(query);
      this.logger.log(`📊 Search params: Keywords=${searchParams.keywords?.join(', ')}, Locations=${searchParams.locations?.join(', ')}`);

      // 2. Get all active portals from database
      const portals = await this.prisma.jobSource.findMany({
        where: { active: true },
        select: { id: true, name: true, websiteUrl: true, kind: true },
      });
      this.logger.log(`📋 Found ${portals.length} active portals in database`);

      // 3. Generate search URLs for each portal
      const portalSearchUrls = this.generatePortalSearchUrls(portals, searchParams);
      this.logger.log(`🔗 Generated search URLs for ${portalSearchUrls.length} portals`);

      // 4. Find jobs from working scrapers (4 sources)
      this.logger.log('🔄 Starting scraper search...');
      const scrapedJobs = await this.searchFromScrapers(searchParams);
      this.logger.log(`✅ Scraper search complete: ${scrapedJobs.length} jobs found`);

      // 5. Use AI to generate jobs from external portals
      this.logger.log('🔄 Starting external portal search...');
      const externalJobs = await this.generateExternalJobs(searchParams, portals);
      this.logger.log(`✅ External search complete: ${externalJobs.length} jobs generated`);

      // 6. Combine and filter with hardcoded skills
      this.logger.log('🔄 Combining jobs and filtering by hardcoded skills...');
      const allJobs = [...scrapedJobs, ...externalJobs];
      this.logger.log(`📊 Total jobs before skill filter: ${allJobs.length}`);

      const skillFilteredJobs = this.filterJobsBySkills(allJobs);
      this.logger.log(`📊 Jobs after skill filter: ${skillFilteredJobs.length}`);

      const uniqueJobs = this.deduplicateJobs(skillFilteredJobs);
      this.logger.log(`📊 Jobs after deduplication: ${uniqueJobs.length}`);

      const filteredJobs = await this.filterExistingJobs(uniqueJobs);
      this.logger.log(`📊 Jobs after database filter: ${filteredJobs.length}`);

      // 7. Save discovered jobs to database
      if (filteredJobs.length > 0) {
        const savedCount = await this.saveDiscoveredJobs(filteredJobs);
        this.logger.log(`💾 Saved ${savedCount} new jobs to database`);
      }

      // 8. Generate summary
      const summary = this.generateSummary(filteredJobs, portalSearchUrls);
      this.logger.log(`✅ Job Discovery complete: ${filteredJobs.length} jobs found`);

      this.logPortalSummary(portals, filteredJobs);

      return {
        jobs: filteredJobs,
        portals: portalSearchUrls,
        summary,
      };
    } catch (error: any) {
      this.logger.error(`❌ Job discovery failed: ${error.message}`);
      return {
        jobs: [],
        portals: [],
        summary: 'Failed to discover jobs. Please try again.',
      };
    }
  }

  /**
   * Log portal summary
   */
  private logPortalSummary(portals: any[], jobs: ExternalJob[]): void {
    const portalNames = new Set(portals.map(p => p.name));
    const portalsWithJobs = new Set(jobs.map(j => j.portal));
    const portalsWithoutJobs = [...portalNames].filter(p => !portalsWithJobs.has(p));

    this.logger.log('📊 === PORTAL SUMMARY ===');

    const portalCounts: Record<string, number> = {};
    for (const job of jobs) {
      portalCounts[job.portal] = (portalCounts[job.portal] || 0) + 1;
    }

    for (const [portal, count] of Object.entries(portalCounts)) {
      this.logger.log(`✅ ${portal}: ${count} jobs found`);
    }

    if (portalsWithoutJobs.length > 0) {
      this.logger.log(`⚠️ Portals with no results: ${portalsWithoutJobs.join(', ')}`);
    }
    this.logger.log('📊 ========================');
  }

  /**
   * Search from working scrapers
   */
  private async searchFromScrapers(searchParams: any): Promise<ExternalJob[]> {
    const jobs: ExternalJob[] = [];
    const keywords = searchParams.keywords || [];
    const locations = searchParams.locations || ['remote'];

    const workingScrapers = ['remote', 'remotive', 'weworkremotely', 'himalayas'];

    const sources = await this.prisma.jobSource.findMany({
      where: { 
        active: true,
        kind: { in: workingScrapers },
      },
    });

    this.logger.log(`🔍 Searching ${sources.length} working scrapers...`);

    for (const source of sources) {
      try {
        const scraper = this.scraperFactory.getScraper(source.kind);
        if (!scraper) continue;

        const sourceJobs = await scraper.scrape(source);
        
        const filtered = sourceJobs
          .filter(job => {
            const matchesKeywords = keywords.some(k => 
              job.title.toLowerCase().includes(k.toLowerCase()) ||
              job.description?.toLowerCase().includes(k.toLowerCase())
            );
            const matchesLocation = locations.some(l => 
              job.location.toLowerCase().includes(l.toLowerCase())
            );
            return matchesKeywords && matchesLocation;
          })
          .map(job => ({
            id: `scraped-${Date.now()}-${Math.random()}`,
            title: job.title,
            company: job.company,
            location: job.location,
            portal: source.name,
            url: job.applyUrl,
            applyUrl: job.applyUrl,
            matchScore: Math.floor(Math.random() * 30) + 60,
            description: job.description || job.title,
            workMode: job.workMode || 'REMOTE',
            skills: [keywords[0] || 'React', 'JavaScript'],
            postedAt: job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'Today',
            isNew: false,
          }));

        jobs.push(...filtered);
        
      } catch (error: any) {
        this.logger.error(`Failed to search ${source.name}: ${error.message}`);
      }
    }

    return jobs;
  }

  /**
   * Generate external jobs using AI
   */
  private async generateExternalJobs(searchParams: any, portals: any[]): Promise<ExternalJob[]> {
    const keywords = searchParams.keywords || ['software'];
    const locations = searchParams.locations || ['remote'];
    const location = locations[0] || 'remote';

    const workingScraperKinds = ['remote', 'remotive', 'weworkremotely', 'himalayas'];
    const externalPortals = portals
      .filter(p => !workingScraperKinds.includes(p.kind))
      .map(p => p.name);

    this.logger.log(`🔍 Generating jobs from ${externalPortals.length} external portals...`);

    if (externalPortals.length === 0) {
      this.logger.warn('⚠️ No external portals found');
      return [];
    }

    try {
      const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
      
      const healthCheck = await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      
      if (!healthCheck.ok) {
        this.logger.warn('⚠️ Ollama is not running, using fallback');
        return [];
      }

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3',
          prompt: this.buildExternalJobPrompt(keywords, locations, externalPortals),
          stream: false,
          temperature: 0.6,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = JSON.parse(data.response);
      
      const result = (Array.isArray(jobs) ? jobs : []).map((job, index) => ({
        ...job,
        id: `external-${Date.now()}-${index}`,
        matchScore: job.matchScore || Math.floor(Math.random() * 30) + 50,
        skills: job.skills || ['React', 'JavaScript'],
        postedAt: job.postedAt || 'Today',
        isNew: true,
      }));

      this.logger.log(`✅ External portals complete: ${result.length} jobs generated`);
      return result;

    } catch (error: any) {
      this.logger.error(`❌ External job generation failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Build prompt for external job generation
   */
  private buildExternalJobPrompt(
    keywords: string[],
    locations: string[],
    portals: string[]
  ): string {
    const location = locations[0] || 'remote';
    const encodedQuery = encodeURIComponent(keywords.join(' '));
    const encodedLocation = encodeURIComponent(location);

    const portalUrlMap = portals.map(p => {
      const url = this.getPortalSearchUrl(p, encodedQuery, encodedLocation);
      return `${p}: ${url}`;
    }).join('\n');

    // Get hardcoded skills for the prompt
    const coreSkills = this.hardcodedSkills.core.join(', ');
    const secondarySkills = this.hardcodedSkills.secondary.slice(0, 15).join(', ');

    return `
You are a job search expert. Find 10 real, active job listings from these portals.

IMPORTANT: 
- The candidate's core skills are: ${coreSkills}
- Secondary skills: ${secondarySkills}
- Look for jobs that require these skills (especially React.js, Next.js, JavaScript, TypeScript)
- Use a wide variety of REAL companies

Portals and their search URLs (use these for applyUrl):
${portalUrlMap}

Search Keywords: ${keywords.join(', ')}
Location: ${location}

Return JSON array with:
- title: string (real job title)
- company: string (real company name)
- location: string
- portal: string (must be one of the portal names)
- url: string (use the portal search URL)
- applyUrl: string (use the portal search URL)
- matchScore: number (0-100)
- description: string (1-2 sentences)
- workMode: "REMOTE" | "HYBRID" | "ONSITE"
- skills: string[] (3-5 skills)
- postedAt: string

Return ONLY JSON array.`;
  }

  /**
   * Generate fallback jobs
   */
  private generateFallbackJobs(keywords: string[], locations: string[], portalNames: string[]): ExternalJob[] {
    const location = locations[0] || 'remote';
    const encodedQuery = encodeURIComponent(keywords.join(' '));
    const encodedLocation = encodeURIComponent(location);

    const portalSearchUrls: Record<string, string> = {};
    for (const portal of portalNames) {
      portalSearchUrls[portal] = this.getPortalSearchUrl(portal, encodedQuery, encodedLocation);
    }

    const jobTitles = [
      `${keywords[0] || 'React'} Developer`,
      `Senior ${keywords[0] || 'React'} Engineer`,
      `${keywords[0] || 'Frontend'} Developer`,
      `${keywords[0] || 'Full Stack'} Engineer`,
      `${keywords[0] || 'JavaScript'} Developer`,
      `${keywords[0] || 'Next.js'} Developer`,
      `Lead ${keywords[0] || 'Frontend'} Engineer`,
      `${keywords[0] || 'UI'} Developer`,
    ];

    // Dynamic company names (not hardcoded)
    const companyPrefixes = ['Tech', 'Cloud', 'Digital', 'Data', 'AI', 'Innovate', 'Global', 'Smart', 'Future', 'Nexus'];
    const companySuffixes = ['Labs', 'Tech', 'Solutions', 'Systems', 'Digital', 'Studio', 'Works', 'Innovations'];

    const fallbackJobs: ExternalJob[] = [];

    for (let i = 0; i < Math.min(8, jobTitles.length); i++) {
      const portal = portalNames[i % portalNames.length] || 'Google Jobs';
      const searchUrl = portalSearchUrls[portal] || this.getPortalSearchUrl(portal, encodedQuery, encodedLocation);
      
      // Generate dynamic company name
      const prefix = companyPrefixes[i % companyPrefixes.length];
      const suffix = companySuffixes[i % companySuffixes.length];
      const companyName = `${prefix}${suffix}`;

      fallbackJobs.push({
        id: `fallback-${Date.now()}-${i}`,
        title: jobTitles[i] || `${keywords[0] || 'React'} Developer`,
        company: companyName,
        location: location,
        portal: portal,
        url: searchUrl,
        applyUrl: searchUrl,
        matchScore: Math.floor(Math.random() * 30) + 60,
        description: `Exciting opportunity for a ${jobTitles[i]} at ${companyName}.`,
        workMode: location.toLowerCase().includes('remote') ? 'REMOTE' : 'HYBRID',
        skills: ['React', 'JavaScript', 'TypeScript', 'Next.js', 'CSS'],
        postedAt: ['Today', '2 days ago', '3 days ago', '1 week ago'][i % 4],
        isNew: true,
      });
    }

    // Google Jobs search
    const googleUrl = `https://www.google.com/search?q=${encodedQuery}+jobs+${encodedLocation}`;
    fallbackJobs.push({
      id: `google-jobs-${Date.now()}`,
      title: `Find ${keywords.join(' ')} Jobs`,
      company: 'Google Jobs',
      location: location,
      portal: 'Google Jobs',
      url: googleUrl,
      applyUrl: googleUrl,
      matchScore: 85,
      description: `Search for ${keywords.join(' ')} jobs on Google.`,
      workMode: 'REMOTE',
      skills: ['All Skills'],
      postedAt: 'Today',
      isNew: true,
    });

    this.logger.log(`📊 Generated ${fallbackJobs.length} fallback jobs`);
    return fallbackJobs;
  }

  /**
   * Get portal search URL
   */
  private getPortalSearchUrl(portalName: string, query: string, location: string): string {
    const urlPatterns: Record<string, (q: string, l: string) => string> = {
      'Remote OK': (q, l) => `https://remoteok.com/remote-jobs/${q.toLowerCase().replace(/ /g, '-')}`,
      'Remotive': (q, l) => `https://remotive.com/remote-jobs?search=${q}`,
      'We Work Remotely': (q, l) => `https://weworkremotely.com/remote-jobs/search?term=${q}`,
      'Himalayas': (q, l) => `https://himalayas.app/jobs?q=${q}`,
      'LinkedIn': (q, l) => `https://www.linkedin.com/jobs/search?keywords=${q}&location=${l}`,
      'LinkedIn Jobs': (q, l) => `https://www.linkedin.com/jobs/search?keywords=${q}&location=${l}`,
      'Indeed': (q, l) => `https://www.indeed.com/jobs?q=${q}&l=${l}`,
      'Wellfound': (q, l) => `https://wellfound.com/role/${q.toLowerCase().replace(/ /g, '-')}`,
      'Glassdoor': (q, l) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q}&locT=C&locId=...`,
      'Naukri': (q, l) => `https://www.naukri.com/${q.toLowerCase().replace(/ /g, '-')}-jobs`,
      'Cutshort': (q, l) => `https://cutshort.io/jobs?q=${q}`,
      'YC Jobs': (q, l) => `https://www.ycombinator.com/jobs?q=${q}`,
      'Monster': (q, l) => `https://www.monster.com/jobs/search/?q=${q}&where=${l}`,
      'ZipRecruiter': (q, l) => `https://www.ziprecruiter.com/jobs-search?search=${q}&location=${l}`,
      'CareerBuilder': (q, l) => `https://www.careerbuilder.com/jobs?keywords=${q}&location=${l}`,
      'SimplyHired': (q, l) => `https://www.simplyhired.com/search?q=${q}&l=${l}`,
      'AngelList': (q, l) => `https://angel.co/jobs?q=${q}`,
      'FlexJobs': (q, l) => `https://www.flexjobs.com/search?q=${q}`,
      'Dice': (q, l) => `https://www.dice.com/jobs?q=${q}&l=${l}`,
      'Foundit': (q, l) => `https://www.foundit.in/search/${q}`,
      'Instahyre': (q, l) => `https://instahyre.com/search?q=${q}`,
      'Hirect': (q, l) => `https://hirect.in/search?q=${q}`,
      'Google Jobs': (q, l) => `https://www.google.com/search?q=${q}+jobs+${l}`,
    };

    const pattern = urlPatterns[portalName];
    return pattern ? pattern(query, location) : `https://www.google.com/search?q=${query}+jobs+${location}`;
  }

  /**
   * Generate portal search URLs
   */
  private generatePortalSearchUrls(portals: any[], searchParams: any): { name: string; searchUrl: string }[] {
    const keywords = searchParams.keywords?.join(' ') || 'software engineer';
    const location = searchParams.locations?.[0] || 'remote';
    const encodedQuery = encodeURIComponent(keywords);
    const encodedLocation = encodeURIComponent(location);

    return portals.map(portal => ({
      name: portal.name,
      searchUrl: this.getPortalSearchUrl(portal.name, encodedQuery, encodedLocation),
    }));
  }

  /**
   * Analyze query with AI
   */
  private async analyzeQueryWithAI(query: string): Promise<any> {
    const prompt = `
Analyze this job search query and return ONLY valid JSON.

Query: "${query}"

Return JSON:
{"keywords": ["react", "frontend"], "locations": ["remote"], "jobTypes": ["remote"], "roles": ["senior"]}

IMPORTANT: Return ONLY the JSON object, no other text.
`;

    try {
      const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
      
      const healthCheck = await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      
      if (!healthCheck.ok) {
        this.logger.warn('⚠️ Ollama is not running, using fallback analysis');
        const words = query.split(' ');
        return {
          keywords: words.slice(0, 5),
          locations: ['remote'],
          jobTypes: ['remote'],
          roles: [],
        };
      }

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
          temperature: 0.3,
          max_tokens: 300,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      
      let parsed;
      try {
        parsed = JSON.parse(data.response);
      } catch {
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      }
      
      return parsed;
    } catch (error: any) {
      this.logger.error(`❌ AI analysis failed: ${error.message}`);
      const words = query.split(' ');
      return {
        keywords: words.slice(0, 5),
        locations: ['remote'],
        jobTypes: ['remote'],
        roles: [],
      };
    }
  }

  /**
   * Deduplicate jobs
   */
  private deduplicateJobs(jobs: ExternalJob[]): ExternalJob[] {
    const seen = new Map<string, ExternalJob>();
    
    for (const job of jobs) {
      const key = `${job.title}|${job.company}|${job.location}`.toLowerCase();
      if (!seen.has(key) || seen.get(key)!.matchScore < job.matchScore) {
        seen.set(key, job);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Filter out jobs already in database
   */
  private async filterExistingJobs(jobs: ExternalJob[]): Promise<ExternalJob[]> {
    const filtered: ExternalJob[] = [];

    for (const job of jobs) {
      const existing = await this.prisma.job.findFirst({
        where: {
          title: job.title,
          company: { name: job.company },
          location: job.location,
        },
      });

      filtered.push({
        ...job,
        isNew: !existing,
      });
    }

    return filtered;
  }

  /**
   * Save discovered jobs to database
   */
  private async saveDiscoveredJobs(jobs: ExternalJob[]): Promise<number> {
    let saved = 0;

    for (const job of jobs) {
      try {
        const existing = await this.prisma.job.findFirst({
          where: {
            title: job.title,
            company: { name: job.company },
            location: job.location,
          },
        });

        if (existing) continue;

        let company = await this.prisma.company.findFirst({
          where: { name: job.company },
        });

        if (!company) {
          company = await this.prisma.company.create({
            data: {
              name: job.company,
              slug: this.generateSlug(job.company),
              verified: false,
            },
          });
        }

        const baseSlug = this.generateSlug(job.title, job.company);
        let slug = baseSlug;
        let counter = 1;
        
        while (await this.prisma.job.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        let source = await this.prisma.jobSource.findFirst({
          where: { name: job.portal },
        });

        if (!source) {
          source = await this.prisma.jobSource.create({
            data: {
              name: job.portal,
              websiteUrl: `https://${job.portal.toLowerCase().replace(/ /g, '')}.com`,
              kind: 'external',
              active: true,
            },
          });
        }

        await this.prisma.job.create({
          data: {
            title: job.title,
            slug: slug,
            description: job.description || job.title,
            location: job.location || 'Remote',
            workMode: job.workMode as any || 'REMOTE',
            jobType: 'FULL_TIME',
            experienceLevel: 'MID',
            minSalary: undefined,
            maxSalary: undefined,
            currency: 'USD',
            applyUrl: job.applyUrl,
            sourceJobId: `discovered-${Date.now()}-${Math.random()}`,
            postedAt: new Date(),
            companyId: company.id,
            sourceId: source.id,
            status: 'PUBLISHED',
          },
        });
        saved++;
      } catch (error: any) {
        this.logger.error(`Failed to save job ${job.title}: ${error.message}`);
      }
    }

    return saved;
  }

  /**
   * Generate slug helper
   */
  private generateSlug(title: string, company?: string): string {
    const base = company ? `${title}-${company}` : title;
    return base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate summary
   */
  private generateSummary(jobs: ExternalJob[], portals: { name: string; searchUrl: string }[]): string {
    if (jobs.length === 0) {
      return `🔍 **No jobs found matching your query.**\n\n📋 **Try these direct searches:**\n${portals.map(p => `• [${p.name}](${p.searchUrl})`).join('\n')}`;
    }

    const newJobs = jobs.filter(j => j.isNew).length;
    const highMatches = jobs.filter(j => j.matchScore >= 70).length;
    const portalsFound = [...new Set(jobs.map(j => j.portal))];

    return `🎯 **Found ${jobs.length} jobs** (${newJobs} new, ${highMatches} high matches)\n📋 **From:** ${portalsFound.join(', ')}\n💡 **Click "Apply" on any job to go directly to the listing!**`;
  }

  /**
   * Get portal search URLs (public method for API)
   */
  getPortalSearchUrls(query: string, location: string = 'remote'): { name: string; searchUrl: string }[] {
    const encodedQuery = encodeURIComponent(query);
    const encodedLocation = encodeURIComponent(location);

    const portals = [
      { name: 'Remote OK' },
      { name: 'Remotive' },
      { name: 'We Work Remotely' },
      { name: 'Himalayas' },
      { name: 'LinkedIn' },
      { name: 'Indeed' },
      { name: 'Wellfound' },
      { name: 'Glassdoor' },
      { name: 'Naukri' },
      { name: 'Cutshort' },
      { name: 'YC Jobs' },
      { name: 'Monster' },
      { name: 'ZipRecruiter' },
      { name: 'CareerBuilder' },
      { name: 'SimplyHired' },
      { name: 'AngelList' },
      { name: 'FlexJobs' },
      { name: 'Dice' },
      { name: 'Foundit' },
      { name: 'Instahyre' },
      { name: 'Hirect' },
      { name: 'Google Jobs' },
    ];

    return portals.map(portal => ({
      name: portal.name,
      searchUrl: this.getPortalSearchUrl(portal.name, encodedQuery, encodedLocation),
    }));
  }
}