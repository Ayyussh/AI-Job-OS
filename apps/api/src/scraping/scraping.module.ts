import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { ScrapingScheduler } from './scraping.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { ScraperFactory } from '../scraping/scrappers/scraper.factory';
import { RemoteOKScraper } from '../scraping/scrappers/remoteok.scraper';
import { RemotiveScraper } from '../scraping/scrappers/remotive.scraper';
import { WeWorkRemotelyScraper } from '../scraping/scrappers/weworkremotely.scraper';
import { HimalayasScraper } from '../scraping/scrappers/himalayas.scraper';
import { GoogleJobsScraper } from '../scraping/scrappers/googlejobs.scraper';

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
    RemoteOKScraper,
    RemotiveScraper,
    WeWorkRemotelyScraper,
    HimalayasScraper,
    GoogleJobsScraper,
  ],
  exports: [ScrapingService, ScraperFactory],
})
export class ScrapingModule {}