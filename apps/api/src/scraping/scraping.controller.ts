import { Controller, Post, Get, Param } from '@nestjs/common';
import { ScrapingService } from './scraping.service';

@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Post('scrape-all')
  async scrapeAll() {
    return this.scrapingService.scrapeAllSources();
  }

  @Post('scrape/:sourceName')
  async scrapeSource(@Param('sourceName') sourceName: string) {
    return this.scrapingService.scrapeSource(sourceName);
  }

  @Get('status')
  async getStatus() {
    return this.scrapingService.getScrapingStatus();
  }
}