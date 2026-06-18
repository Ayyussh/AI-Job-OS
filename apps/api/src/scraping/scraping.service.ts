import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperFactory } from '../scraping/scrappers/scraper.factory';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scraperFactory: ScraperFactory,
  ) {}

  async scrapeAllSources() {
    const results: {
      success: Array<{ source: string; count: number }>;
      failed: Array<{ source: string; error: string }>;
      total: number;
      newJobs: number;
    } = {
      success: [],
      failed: [],
      total: 0,
      newJobs: 0,
    };

    const sources = await this.prisma.jobSource.findMany({
      where: { active: true },
    });

    for (const source of sources) {
      try {
        this.logger.log(`Scraping ${source.name}...`);
        const scraper = this.scraperFactory.getScraper(source.kind);

        if (!scraper) {
          this.logger.warn(`No scraper found for ${source.name}`);
          results.failed.push({
            source: source.name,
            error: 'No scraper available',
          });
          continue;
        }

        const jobs = await scraper.scrape(source);
        const saved = await this.saveJobs(jobs, source.id);
        results.newJobs += saved;
        results.total += jobs.length;
        results.success.push({ source: source.name, count: jobs.length });

        await this.prisma.jobSource.update({
          where: { id: source.id },
          data: { lastScrapedAt: new Date() },
        });
      } catch (err: any) {
        this.logger.error(`Failed to scrape ${source.name}: ${err.message}`);
        results.failed.push({ source: source.name, error: err.message });
      }
    }

    return results;
  }

  private async saveJobs(jobs: any[], sourceId: string): Promise<number> {
    let saved = 0;

    for (const jobData of jobs) {
      try {
        // Check if job already exists by sourceJobId
        const existing = await this.prisma.job.findFirst({
          where: {
            sourceId,
            sourceJobId: jobData.sourceJobId,
          },
        });

        if (existing) {
          // Update existing job
          await this.prisma.job.update({
            where: { id: existing.id },
            data: {
              title: jobData.title,
              description: jobData.description,
              location: jobData.location,
              minSalary: jobData.minSalary,
              maxSalary: jobData.maxSalary,
              applyUrl: jobData.applyUrl,
              postedAt: jobData.postedAt || new Date(),
              updatedAt: new Date(),
            },
          });
          saved++;
        } else {
          // Find or create company
          let company = await this.prisma.company.findFirst({
            where: { name: jobData.company },
          });

          if (!company) {
            company = await this.prisma.company.create({
              data: {
                name: jobData.company,
                slug: this.generateUniqueSlug(jobData.company),
                verified: false,
              },
            });
          }

          // Generate a unique slug
          const baseSlug = this.generateSlug(jobData.title, jobData.company);
          let slug = baseSlug;
          let counter = 1;

          // Check if slug already exists and append counter if needed
          while (await this.prisma.job.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }

          // Create the job with unique slug
          await this.prisma.job.create({
            data: {
              title: jobData.title,
              slug: slug, // This is now guaranteed to be unique
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
          saved++;
        }
      } catch (err: any) {
        this.logger.error(`Failed to save job: ${err.message}`);
      }
    }

    return saved;
  }

  private generateSlug(title: string, company?: string): string {
    const base = company ? `${title}-${company}` : title;
    return base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateUniqueSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base}-${Date.now()}`;
  }

  async scrapeSource(sourceName: string) {
    const source = await this.prisma.jobSource.findUnique({
      where: { name: sourceName },
    });

    if (!source) {
      throw new Error(`Source ${sourceName} not found`);
    }

    const scraper = this.scraperFactory.getScraper(source.kind);
    if (!scraper) {
      throw new Error(`No scraper for ${sourceName}`);
    }

    const jobs = await scraper.scrape(source);
    await this.saveJobs(jobs, source.id);

    return { source: source.name, count: jobs.length };
  }

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
}
