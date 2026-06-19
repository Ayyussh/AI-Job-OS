import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperFactory } from './scrappers/scraper.factory';
import { JobData } from './scrappers/base.scraper';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scraperFactory: ScraperFactory,
  ) {}

  /**
   * Scrape all active sources
   */
  async scrapeAllSources() {
    this.logger.log('🔄 Starting on-demand scraping...');
    
    const results = {
      success: [] as Array<{ source: string; count: number; newJobs: number; duplicatesRemoved: number }>,
      failed: [] as Array<{ source: string; error: string }>,
      total: 0,
      newJobs: 0,
      duplicatesRemoved: 0,
    };

    const sources = await this.prisma.jobSource.findMany({
      where: { active: true },
    });

    this.logger.log(`Found ${sources.length} active sources`);

    const concurrencyLimit = 3;
    const batches = this.chunkArray(sources, concurrencyLimit);

    for (const batch of batches) {
      const scrapePromises = batch.map(async (source) => {
        return this.scrapeSourceWithDedup(source);
      });
      
      const batchResults = await Promise.all(scrapePromises);
      
      for (const result of batchResults) {
        if (result.success) {
          results.success.push({
            source: result.sourceName,
            count: result.totalJobs || 0,
            newJobs: result.newJobs || 0,
            duplicatesRemoved: result.duplicatesRemoved || 0,
          });
          results.total += result.totalJobs || 0;
          results.newJobs += result.newJobs || 0;
          results.duplicatesRemoved += result.duplicatesRemoved || 0;
        } else {
          results.failed.push({
            source: result.sourceName,
            error: result.error || 'Unknown error',
          });
        }
      }
    }

    this.logger.log(`✅ Scraping complete: ${results.total} total, ${results.newJobs} new, ${results.duplicatesRemoved} duplicates removed`);
    return results;
  }

  /**
   * Scrape a specific source with deduplication
   */
  private async scrapeSourceWithDedup(source: any): Promise<{
    sourceName: string;
    success: boolean;
    totalJobs?: number;
    newJobs?: number;
    duplicatesRemoved?: number;
    error?: string;
  }> {
    try {
      this.logger.log(`Scraping ${source.name}...`);
      const scraper = this.scraperFactory.getScraper(source.kind);
      
      if (!scraper) {
        this.logger.warn(`No scraper found for ${source.name}`);
        return {
          sourceName: source.name,
          success: false,
          error: 'No scraper available',
        };
      }

      const sourcePriority = this.getSourcePriority(source.name);
      
      let jobs = await scraper.scrape(source);
      
      // Add source priority and generate fingerprints
      jobs = jobs.map(job => ({
        ...job,
        _sourcePriority: sourcePriority,
        _fingerprint: scraper.generateFingerprint(job),
      }));
      
      // Deduplicate within the same source
      const deduplicatedJobs = scraper.deduplicateJobs(jobs);
      const duplicatesRemoved = jobs.length - deduplicatedJobs.length;
      
      // Save to database with deduplication against existing jobs
      const saved = await this.saveJobsWithDeduplication(deduplicatedJobs, source.id);
      
      // Update last scraped timestamp
      await this.prisma.jobSource.update({
        where: { id: source.id },
        data: { lastScrapedAt: new Date() },
      });

      this.logger.log(`✅ ${source.name}: ${deduplicatedJobs.length} jobs, ${saved} new, ${duplicatesRemoved} duplicates removed`);

      return {
        sourceName: source.name,
        success: true,
        totalJobs: deduplicatedJobs.length,
        newJobs: saved,
        duplicatesRemoved: duplicatesRemoved,
      };

    } catch (err: any) {
      this.logger.error(`Failed to scrape ${source.name}: ${err.message}`);
      return {
        sourceName: source.name,
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Save jobs with deduplication against existing database jobs
   */
  private async saveJobsWithDeduplication(jobs: JobData[], sourceId: string): Promise<number> {
    let saved = 0;
    let skipped = 0;
    
    // Get all existing jobs from this source
    const existingJobs = await this.prisma.job.findMany({
      where: { sourceId },
      select: { sourceJobId: true, title: true, companyId: true, location: true },
    });
    
    const existingSourceJobIds = new Set(existingJobs.map(j => j.sourceJobId));
    
    for (const jobData of jobs) {
      try {
        // Check if job already exists by sourceJobId
        if (jobData.sourceJobId && existingSourceJobIds.has(jobData.sourceJobId)) {
          await this.updateExistingJob(jobData, sourceId);
          saved++;
          continue;
        }
        
        // Check for duplicate by title + company + location
        const duplicate = await this.prisma.job.findFirst({
          where: {
            title: jobData.title,
            location: jobData.location,
            company: { name: jobData.company },
          },
        });
        
        if (duplicate) {
          const currentScore = this.calculateJobScore(jobData);
          const existingScore = this.calculateExistingJobScore(duplicate);
          
          if (currentScore > existingScore) {
            await this.updateExistingJobById(jobData, duplicate.id);
            saved++;
          } else {
            skipped++;
          }
          continue;
        }
        
        // Create new job
        await this.createJob(jobData, sourceId);
        saved++;
        
      } catch (err: any) {
        this.logger.error(`Failed to save job: ${err.message}`);
      }
    }
    
    if (skipped > 0) {
      this.logger.log(`Skipped ${skipped} duplicate jobs (existing data is better)`);
    }
    
    return saved;
  }

  /**
   * Create a new job
   */
  private async createJob(jobData: JobData, sourceId: string) {
    let company = await this.prisma.company.findFirst({
      where: { name: jobData.company },
    });

    if (!company) {
      company = await this.prisma.company.create({
        data: {
          name: jobData.company,
          slug: this.generateSlug(jobData.company),
          verified: false,
        },
      });
    }

    // Generate unique slug
    const baseSlug = this.generateSlug(jobData.title, jobData.company);
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.prisma.job.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    await this.prisma.job.create({
      data: {
        title: jobData.title,
        slug: slug,
        description: jobData.description || jobData.title,
        location: jobData.location || 'Remote',
        city: jobData.city,
        country: jobData.country || 'India',
        workMode: jobData.workMode || 'REMOTE',
        jobType: jobData.jobType || 'FULL_TIME',
        experienceLevel: jobData.experienceLevel || 'MID',
        minSalary: jobData.minSalary,
        maxSalary: jobData.maxSalary,
        currency: jobData.currency || 'USD',
        salaryPeriod: jobData.salaryPeriod || 'YEAR',
        applyUrl: jobData.applyUrl,
        sourceJobId: jobData.sourceJobId,
        postedAt: jobData.postedAt || new Date(),
        companyId: company.id,
        sourceId: sourceId,
      },
    });
  }

  /**
   * Update existing job by sourceJobId
   */
  private async updateExistingJob(jobData: JobData, sourceId: string) {
    await this.prisma.job.update({
      where: {
        sourceId_sourceJobId: { 
          sourceId, 
          sourceJobId: jobData.sourceJobId! 
        },
      },
      data: {
        title: jobData.title,
        description: jobData.description || jobData.title,
        location: jobData.location || 'Remote',
        minSalary: jobData.minSalary,
        maxSalary: jobData.maxSalary,
        applyUrl: jobData.applyUrl,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update existing job by ID
   */
  private async updateExistingJobById(jobData: JobData, jobId: string) {
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        title: jobData.title,
        description: jobData.description || jobData.title,
        location: jobData.location || 'Remote',
        minSalary: jobData.minSalary,
        maxSalary: jobData.maxSalary,
        applyUrl: jobData.applyUrl,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Calculate job quality score
   */
  private calculateJobScore(job: JobData): number {
    let score = 0;
    if (job.description && job.description.length > 100) score += 20;
    if (job.minSalary && job.maxSalary) score += 30;
    else if (job.minSalary || job.maxSalary) score += 15;
    if (job.company && job.company.length > 2) score += 10;
    if (job.workMode === 'REMOTE') score += 10;
    if (job.applyUrl) score += 20;
    if (job._sourcePriority) score += job._sourcePriority * 2;
    return score;
  }

  /**
   * Calculate existing job quality score
   */
  private calculateExistingJobScore(job: any): number {
    let score = 0;
    if (job.description && job.description.length > 100) score += 20;
    if (job.minSalary && job.maxSalary) score += 30;
    else if (job.minSalary || job.maxSalary) score += 15;
    if (job.company?.name && job.company.name.length > 2) score += 10;
    if (job.workMode === 'REMOTE') score += 10;
    if (job.applyUrl) score += 20;
    return score;
  }

  /**
   * Get source priority for deduplication
   */
  private getSourcePriority(sourceName: string): number {
    const priorities: Record<string, number> = {
      'Remote OK': 8,
      'Remotive': 7,
      'We Work Remotely': 6,
      'Himalayas': 6,
    };
    return priorities[sourceName] || 5;
  }

  /**
   * Scrape a single source
   */
  async scrapeSource(sourceName: string) {
    const source = await this.prisma.jobSource.findUnique({
      where: { name: sourceName },
    });

    if (!source) {
      throw new Error(`Source ${sourceName} not found`);
    }

    const result = await this.scrapeSourceWithDedup(source);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      source: result.sourceName,
      count: result.totalJobs || 0,
      newJobs: result.newJobs || 0,
      duplicatesRemoved: result.duplicatesRemoved || 0,
    };
  }

  /**
   * Get scraping status for all sources
   */
  async getScrapingStatus() {
    const sources = await this.prisma.jobSource.findMany({
      select: {
        id: true,
        name: true,
        active: true,
        lastScrapedAt: true,
        jobs: {
          select: { id: true },
        },
      },
    });

    return sources.map((source) => ({
      name: source.name,
      active: source.active,
      lastScraped: source.lastScrapedAt,
      jobCount: source.jobs.length,
    }));
  }

  /**
   * Generate a URL-friendly slug
   */
  private generateSlug(title: string, company?: string): string {
    const base = company ? `${title}-${company}` : title;
    return base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Split array into chunks for parallel processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}