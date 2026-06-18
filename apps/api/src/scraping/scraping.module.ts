import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { ScrapingScheduler } from './scraping.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { ScraperFactory } from '../scraping/scrappers/scraper.factory';
import { WellfoundScraper } from '../scraping/scrappers/wellfound.scraper';
import { RemoteOKScraper } from '../scraping/scrappers/remoteok.scraper';
import { RemotiveScraper } from '../scraping/scrappers/remotive.scraper';
import { IndeedScraper } from '../scraping/scrappers/indeed.scraper';
import { NaukriScraper } from '../scraping/scrappers/naukri.scraper';
import { LinkedInScraper } from '../scraping/scrappers/linkedin.scraper';
import { YCombinatorScraper } from '../scraping/scrappers/ycombinator.scraper';
import { ZipRecruiterScraper } from '../scraping/scrappers/ziprecruiter.scraper';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule,
  ],
  controllers: [ScrapingController],
  providers: [
    ScrapingService,
    ScrapingScheduler,
    ScraperFactory,
    WellfoundScraper,
    RemoteOKScraper,
    RemotiveScraper,
    IndeedScraper,
    NaukriScraper,
    LinkedInScraper,
    YCombinatorScraper,
    ZipRecruiterScraper,
  ],
  exports: [ScrapingService, ScraperFactory],
})
export class ScrapingModule {}