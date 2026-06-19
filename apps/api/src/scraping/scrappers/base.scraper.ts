import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface JobData {
  title: string;
  company: string;
  description: string;
  location: string;
  city?: string;
  country?: string;
  workMode?: 'REMOTE' | 'HYBRID' | 'ONSITE';
  jobType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
  experienceLevel?: 'INTERN' | 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  salaryPeriod?: 'YEAR' | 'MONTH' | 'HOUR';
  applyUrl: string;
  sourceJobId: string;
  postedAt?: Date;
  // Deduplication fields
  _fingerprint?: string;
  _sourcePriority?: number;
}

export interface JobSource {
  id: string;
  name: string;
  websiteUrl: string;
  kind: string;
}

/**
 * Rate limiter for controlling request frequency
 */
class RateLimiter {
  private lastRequestTime: number = 0;
  private minInterval: number = 1000; // 1 second between requests

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest),
      );
    }
    this.lastRequestTime = Date.now();
  }

  setMinInterval(ms: number): void {
    this.minInterval = ms;
  }
}

/**
 * Proxy manager for rotating proxies
 */
class ProxyManager {
  private proxies: string[] = [];
  private currentIndex: number = 0;

  constructor(proxies: string[] = []) {
    this.proxies = proxies;
  }

  getNextProxy(): string | null {
    if (this.proxies.length === 0) return null;
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  addProxy(proxy: string): void {
    this.proxies.push(proxy);
  }

  hasProxies(): boolean {
    return this.proxies.length > 0;
  }
}

export abstract class BaseScraper {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly rateLimiter: RateLimiter;
  protected readonly proxyManager: ProxyManager;
  protected prisma: PrismaService | null = null;
  abstract kind: string;

  // ===== HARCODED SKILLS (NOT from resume) =====
  // CORE SKILLS (Primary - MUST match at least 1)
  private readonly coreSkills: string[] = [
    'react', 'react.js', 'reactjs',
    'next.js', 'nextjs',
    'javascript',
    'typescript',
    'html5', 'html',
    'css3', 'css',
  ];

  // SECONDARY SKILLS (Nice to have)
  private readonly secondarySkills: string[] = [
    // State Management
    'redux', 'redux toolkit', 'context api', 'zustand',
    // UI & Styling
    'tailwind', 'tailwind css', 'ant design', 'antd',
    'material ui', 'mui', 'responsive design', 'cross-browser',
    // Frontend Architecture
    'component design', 'reusable ui', 'modular architecture',
    'design system', 'micro frontend', 'code splitting',
    'lazy loading', 'memoization', 'bundle optimization',
    'rendering optimization', 'api caching',
    // Backend (Least priority)
    'node.js', 'express.js', 'nestjs',
    'rest api', 'api integration', 'authentication',
    'rbac', 'postgresql', 'mongodb', 'prisma', 'sql', 'nosql',
    // DevOps
    'docker', 'kubernetes', 'ci/cd', 'containerization',
    // AI
    'ollama', 'llm', 'embeddings', 'vector search', 'prompt engineering',
    // General
    'agile', 'scrum', 'git', 'github', 'code review',
    'full stack',
  ];

  // Combined skills for filtering
  protected getAllSkills(): string[] {
    return [...this.coreSkills, ...this.secondarySkills];
  }

  constructor(prisma?: PrismaService) {
    this.rateLimiter = new RateLimiter();
    this.proxyManager = new ProxyManager();
    if (prisma) {
      this.prisma = prisma;
    }
  }

  abstract scrape(source: JobSource): Promise<JobData[]>;

  /**
   * Get a random user agent
   */
  private getUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  /**
   * Fetch a page with rate limiting and retry logic
   */
  protected async fetchPage(url: string, retries: number = 3): Promise<string> {
    await this.rateLimiter.wait();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'User-Agent': this.getUserAgent(),
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        };

        const fetchOptions: RequestInit = {
          headers,
          signal: AbortSignal.timeout(30000), // 30 second timeout
        };

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        this.logger.debug(`Successfully fetched ${url} (${text.length} bytes)`);
        return text;
      } catch (error: any) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt}/${retries} failed for ${url}: ${error.message}`,
        );

        if (attempt < retries) {
          // Exponential backoff
          const delay = 1000 * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to fetch ${url} after ${retries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Fetch JSON data with rate limiting and retry logic
   */
  protected async fetchJSON(url: string, retries: number = 3): Promise<any> {
    await this.rateLimiter.wait();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.getUserAgent(),
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.logger.debug(`Successfully fetched JSON from ${url}`);
        return data;
      } catch (error: any) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt}/${retries} failed for ${url}: ${error.message}`,
        );

        if (attempt < retries) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to fetch JSON from ${url} after ${retries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * AI-powered job filtering - only keep jobs matching core skills
   */
  protected filterJobsBySkills(jobs: JobData[]): JobData[] {
    if (jobs.length === 0) return [];

    const coreSkills = this.coreSkills;
    const secondarySkills = this.secondarySkills;

    const filtered = jobs.filter((job) => {
      const content =
        `${job.title} ${job.description || ''} ${job.company || ''}`.toLowerCase();

      // Check for core skills (MUST match at least 1)
      const matchedCore = coreSkills.filter((skill) =>
        content.includes(skill.toLowerCase()),
      );

      if (matchedCore.length === 0) {
        return false;
      }

      // Check for secondary skills (bonus)
      const matchedSecondary = secondarySkills.filter((skill) =>
        content.includes(skill.toLowerCase()),
      );

      this.logger.log(
        `✅ Job: "${job.title}" at ${job.company} | Core: ${matchedCore.length} skills | Secondary: ${matchedSecondary.length} skills`,
      );

      return true;
    });

    this.logger.log(
      `📊 Filtered ${jobs.length} -> ${filtered.length} jobs (Core skills required: ${coreSkills.slice(0, 5).join(', ')}...)`,
    );
    return filtered;
  }

  /**
   * Extract salary information from text
   */
  protected extractSalary(text: string): {
    min?: number;
    max?: number;
    currency?: string;
  } {
    if (!text) return {};

    const patterns = [
      /(\$|USD|INR|EUR|GBP)\s*([\d,]+)\s*-\s*([\d,]+)/i,
      /([\d,]+)\s*-\s*([\d,]+)\s*(\$|USD|INR|EUR|GBP)/i,
      /₹\s*([\d,]+)\s*-\s*([\d,]+)/i,
      /INR\s*([\d,]+)\s*-\s*([\d,]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const currency = match[1] || match[3] || 'USD';
        const min = parseInt(match[2]?.replace(/,/g, '') || '0');
        const max = parseInt(match[3]?.replace(/,/g, '') || '0');
        return { min, max, currency };
      }
    }

    return {};
  }

  /**
   * Generate a unique fingerprint for a job - PUBLIC for service access
   */
  public generateFingerprint(job: Partial<JobData>): string {
    const normalizedTitle = this.normalizeString(job.title || '');
    const normalizedCompany = this.normalizeString(job.company || '');
    const normalizedLocation = this.normalizeString(job.location || '');
    
    const key = `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`;
    return this.hashString(key);
  }

  /**
   * Normalize a string for comparison
   */
  protected normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(word => word.length > 2)
      .sort()
      .join(' ');
  }

  /**
   * Simple hash function for string
   */
  protected hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Deduplicate jobs based on fingerprint - PUBLIC for service access
   */
  public deduplicateJobs(jobs: JobData[]): JobData[] {
    if (jobs.length === 0) return [];

    const seen = new Map<string, JobData>();
    const duplicateGroups = new Map<string, JobData[]>();
    
    for (const job of jobs) {
      const fingerprint = job._fingerprint || this.generateFingerprint(job);
      job._fingerprint = fingerprint;
      
      if (seen.has(fingerprint)) {
        if (!duplicateGroups.has(fingerprint)) {
          duplicateGroups.set(fingerprint, [seen.get(fingerprint)!]);
        }
        duplicateGroups.get(fingerprint)!.push(job);
      } else {
        seen.set(fingerprint, job);
      }
    }
    
    const result: JobData[] = [];
    let duplicateCount = 0;
    
    for (const [fingerprint, job] of seen) {
      if (duplicateGroups.has(fingerprint)) {
        const allJobs = duplicateGroups.get(fingerprint)!;
        const bestJob = this.selectBestJob(allJobs);
        result.push(bestJob);
        duplicateCount++;
        
        this.logger.debug(
          `Deduplicated: "${bestJob.title}" at ${bestJob.company} (${allJobs.length + 1} duplicates)`
        );
      } else {
        result.push(job);
      }
    }
    
    const saved = jobs.length - result.length;
    if (saved > 0) {
      this.logger.log(`✅ Deduplication: ${jobs.length} → ${result.length} jobs (${saved} duplicates removed, ${duplicateCount} groups)`);
    }
    
    return result;
  }

  /**
   * Select the best job from duplicates based on data completeness
   */
  protected selectBestJob(jobs: JobData[]): JobData {
    if (jobs.length === 1) return jobs[0];
    
    let bestJob = jobs[0];
    let bestScore = this.calculateJobScore(jobs[0]);
    
    for (let i = 1; i < jobs.length; i++) {
      const score = this.calculateJobScore(jobs[i]);
      if (score > bestScore) {
        bestScore = score;
        bestJob = jobs[i];
      }
    }
    
    return bestJob;
  }

  /**
   * Calculate a quality score for a job
   */
  private calculateJobScore(job: JobData): number {
    let score = 0;
    
    if (job.description && job.description.length > 100) score += 20;
    if (job.description && job.description.length > 500) score += 10;
    if (job.minSalary && job.maxSalary) score += 30;
    else if (job.minSalary || job.maxSalary) score += 15;
    if (job.company && job.company.length > 2) score += 10;
    if (job.workMode === 'REMOTE') score += 10;
    if (job.applyUrl) score += 20;
    if (job._sourcePriority) score += job._sourcePriority * 2;
    
    return score;
  }

  /**
   * Extract skills from job description using AI
   */
  protected async extractSkillsWithAI(text: string): Promise<string[]> {
    try {
      const prompt = `
Extract ALL technical and professional skills from this job description.
Return ONLY a JSON array of skills found.

Text: ${text.slice(0, 2000)}

Format: ["skill1", "skill2", "skill3"]

Return ONLY the JSON array, no other text.
`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
          temperature: 0.1,
          max_tokens: 300,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error: any) {
      this.logger.warn(`AI skill extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Set custom user skills for filtering
   */
  setUserSkills(skills: string[]): void {
    // This method is kept for compatibility but we use hardcoded skills
    this.logger.log('Skills are hardcoded in BaseScraper. Use the hardcoded lists instead.');
  }

  /**
   * Get the list of core skills
   */
  getCoreSkills(): string[] {
    return [...this.coreSkills];
  }

  /**
   * Get the list of secondary skills
   */
  getSecondarySkills(): string[] {
    return [...this.secondarySkills];
  }
}