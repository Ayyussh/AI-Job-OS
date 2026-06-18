import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperFactory } from '../scraping/scrappers/scraper.factory'; 

@Injectable()
export class JobDiscoveryService {
  private readonly logger = new Logger(JobDiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scraperFactory: ScraperFactory,
  ) {}

  /**
   * Search for jobs that are NOT in the database
   * Uses AI to find relevant external jobs
   */
  async discoverJobs(query: string, userSkills: string[]): Promise<any[]> {
    this.logger.log(`Discovering jobs for: "${query}"`);

    try {
      // Step 1: Use AI to understand the query and find job boards
      const searchQuery = await this.analyzeQueryWithAI(query, userSkills);
      
      // Step 2: Search external sources (on-demand scraping)
      const jobs = await this.searchExternalSources(searchQuery);
      
      // Step 3: Filter out jobs already in database
      const filteredJobs = await this.filterExistingJobs(jobs);
      
      this.logger.log(`Found ${filteredJobs.length} new jobs not in database`);
      return filteredJobs;
    } catch (error: any) {
      this.logger.error(`Job discovery failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Use AI to analyze the user query
   */
  private async analyzeQueryWithAI(query: string, userSkills: string[]): Promise<any> {
    const prompt = `
You are a job search expert. Analyze this job search query and return structured search parameters.

User Query: "${query}"
User Skills: ${userSkills.join(', ')}

Return a JSON object with:
- "keywords": array of key terms (max 5)
- "locations": array of locations (max 3)
- "jobTypes": array of job types (remote, hybrid, onsite)
- "roles": array of roles (senior, junior, lead)

Example: {"keywords": ["react", "frontend"], "locations": ["remote"], "jobTypes": ["remote"], "roles": ["senior"]}

Return ONLY JSON, no other text.
`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2', // Fast model for search
          prompt: prompt,
          stream: false,
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.response);
      return parsed;
    } catch (error: any) {
      this.logger.error(`AI analysis failed: ${error.message}`);
      // Fallback: use the query directly
      return {
        keywords: query.split(' ').slice(0, 5),
        locations: ['remote'],
        jobTypes: ['remote'],
        roles: [],
      };
    }
  }

  /**
   * Search external sources using the search parameters
   */
  private async searchExternalSources(searchParams: any): Promise<any[]> {
    const jobs: any[] = [];
    const keywords = searchParams.keywords || [];
    const locations = searchParams.locations || ['remote'];

    const sources = await this.prisma.jobSource.findMany({
      where: { active: true },
    });

    for (const source of sources) {
      try {
        const scraper = this.scraperFactory.getScraper(source.kind);
        if (!scraper) continue;

        const sourceJobs = await scraper.scrape(source);
        
        const filtered = sourceJobs.filter(job => {
          const matchesKeywords = keywords.some(k => 
            job.title.toLowerCase().includes(k.toLowerCase()) ||
            job.description.toLowerCase().includes(k.toLowerCase())
          );
          const matchesLocation = locations.some(l => 
            job.location.toLowerCase().includes(l.toLowerCase())
          );
          return matchesKeywords && matchesLocation;
        });

        jobs.push(...filtered);
      } catch (error: any) {
        this.logger.error(`Failed to search ${source.name}: ${error.message}`);
      }
    }

    return jobs;
  }

  /**
   * Filter out jobs already in database
   */
  private async filterExistingJobs(jobs: any[]): Promise<any[]> {
    const filtered: any[] = [];

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
        _isNew: !existing,
        _reason: existing ? 'Already in database' : 'New job',
        _dbId: existing?.id || null,
      });
    }

    return filtered;
  }

  /**
   * Generate search URLs for external job boards
   */
  generateSearchUrls(query: string, location: string = 'remote'): string[] {
    const encodedQuery = encodeURIComponent(query);
    const encodedLocation = encodeURIComponent(location);
    
    return [
      `https://www.indeed.com/jobs?q=${encodedQuery}&l=${encodedLocation}`,
      `https://www.linkedin.com/jobs/search?keywords=${encodedQuery}&location=${encodedLocation}`,
      `https://remoteok.com/remote-jobs/${encodedQuery.toLowerCase().replace(/ /g, '-')}`,
      `https://wellfound.com/role/${encodedQuery.toLowerCase().replace(/ /g, '-')}`,
      `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedQuery}&locT=C&locId=...`,
      `https://www.naukri.com/${encodedQuery.replace(/ /g, '-')}-jobs`,
    ];
  }
}