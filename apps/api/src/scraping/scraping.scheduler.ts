import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScrapingService } from './scraping.service';

@Injectable()
export class ScrapingScheduler {
  private readonly logger = new Logger(ScrapingScheduler.name);

  constructor(private readonly scrapingService: ScrapingService) {}

  // Runs every 6 hours - only scrapes jobs matching your skills
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleScheduledScraping() {
    this.logger.log('🔄 Starting scheduled job scraping...');
    try {
      const result = await this.scrapingService.scrapeAllSources();
      this.logger.log(`✅ Scraping completed: ${result.newJobs} new jobs found (${result.total} total)`);
      
      if (result.failed.length > 0) {
        this.logger.warn(`⚠️ Failed sources: ${result.failed.map(f => f.source).join(', ')}`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Scheduled scraping failed: ${error.message}`);
    }
  }

  // Runs every 12 hours at 9 AM and 9 PM
  @Cron('0 9,21 * * *')
  async handleDailyScraping() {
    this.logger.log('🌅 Running daily job scraping...');
    await this.handleScheduledScraping();
  }
}