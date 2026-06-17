import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule'; // TEMPORARILY COMMENT OUT
import { ScrapingService } from './scraping.service';

@Injectable()
export class ScrapingScheduler {
  private readonly logger = new Logger(ScrapingScheduler.name);

  constructor(private readonly scrapingService: ScrapingService) {}

  // @Cron(CronExpression.EVERY_6_HOURS) // TEMPORARILY COMMENT OUT
  async handleScheduledScraping() {
    this.logger.log('Starting scheduled job scraping...');
    try {
      const result = await this.scrapingService.scrapeAllSources();
      this.logger.log(`Scraping completed: ${result.newJobs} new jobs found`);
      
      if (result.failed.length > 0) {
        this.logger.warn(`Failed sources: ${result.failed.map(f => f.source).join(', ')}`);
      }
    } catch (error: any) {
      this.logger.error(`Scheduled scraping failed: ${error.message}`);
    }
  }
}