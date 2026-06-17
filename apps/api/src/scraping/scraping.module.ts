import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule'; // ADD THIS
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { ScrapingScheduler } from './scraping.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { ScraperFactory } from '../scraping/scrappers/scraper.factory';
import { WellfoundScraper } from '../scraping/scrappers/wellfound.scraper';
// import { LinkedInScraper } from './scrapers/linkedin.scraper';
// import { IndeedScraper } from './scrapers/indeed.scraper';
// import { NaukriScraper } from './scrapers/naukri.scraper';
// import { RemoteOKScraper } from './scrapers/remoteok.scraper';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule, // ADD THIS
  ],
  controllers: [ScrapingController],
  providers: [
    ScrapingService,
    ScrapingScheduler,
    ScraperFactory,
    WellfoundScraper,
    // LinkedInScraper,
    // IndeedScraper,
    // NaukriScraper,
    // RemoteOKScraper,
  ],
  exports: [ScrapingService],
})
export class ScrapingModule {}