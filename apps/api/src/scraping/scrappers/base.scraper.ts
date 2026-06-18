import { Logger } from '@nestjs/common';

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
}

export interface JobSource {
  id: string;
  name: string;
  websiteUrl: string;
  kind: string;
}

export abstract class BaseScraper {
  protected readonly logger = new Logger(this.constructor.name);
  abstract kind: string;
  
  // User skills to filter jobs
  protected userSkills: string[] = [
    // Core
    'react', 'next.js', 'javascript', 'typescript', 'html', 'css',
    // State Management
    'redux', 'redux toolkit', 'context api', 'zustand',
    // UI
    'tailwind', 'ant design', 'material ui', 'responsive design',
    // Backend
    'node.js', 'express', 'nestjs', 'redis',
    // Database
    'postgresql', 'mongodb', 'prisma', 'sql',
    // DevOps
    'docker', 'kubernetes', 'ci/cd',
    // AI
    'ollama', 'llm', 'embeddings', 'vector search',
    // General
    'rest api', 'graphql', 'microservices', 'agile', 'scrum',
  ];

  abstract scrape(source: JobSource): Promise<JobData[]>;

  protected async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.text();
  }

  protected async fetchJSON(url: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch JSON from ${url}: ${response.status}`);
    }

    return response.json();
  }

  /**
   * AI-powered job filtering - only keep jobs matching user skills
   */
  protected filterJobsBySkills(jobs: JobData[]): JobData[] {
    const filtered = jobs.filter(job => {
      const content = `${job.title} ${job.description} ${job.company}`.toLowerCase();
      
      // Check if any user skill matches
      const matchedSkills = this.userSkills.filter(skill => 
        content.includes(skill.toLowerCase())
      );

      // Log match results
      if (matchedSkills.length > 0) {
        this.logger.log(`✅ Job matched: ${job.title} at ${job.company} (${matchedSkills.length} skills)`);
      }

      return matchedSkills.length > 0;
    });

    this.logger.log(`Filtered ${jobs.length} -> ${filtered.length} jobs (${this.userSkills.length} skills tracked)`);
    return filtered;
  }

  protected extractSalary(text: string): { min?: number; max?: number; currency?: string } {
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
}