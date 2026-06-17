import { Injectable } from '@nestjs/common';
import { BaseScraper } from './base.scraper';
import { WellfoundScraper } from './wellfound.scraper';
//import { LinkedInScraper } from './linkedin.scraper';
//import { IndeedScraper } from './indeed.scraper';
//import { NaukriScraper } from './naukri.scraper';
//import { RemoteOKScraper } from './remoteok.scraper';

@Injectable()
export class ScraperFactory {
  constructor(
    private readonly wellfoundScraper: WellfoundScraper,
    // private readonly linkedInScraper: LinkedInScraper,
    // private readonly indeedScraper: IndeedScraper,
    // private readonly naukriScraper: NaukriScraper,
    // private readonly remoteOKScraper: RemoteOKScraper,
  ) {}

  getScraper(kind: string): BaseScraper | null {
    const scrapers: Record<string, BaseScraper> = {
      startup: this.wellfoundScraper,
      // network: this.linkedInScraper,
      // aggregator: this.indeedScraper,
      // india: this.naukriScraper,
      // remote: this.remoteOKScraper,
      // 'india-tech': this.naukriScraper,
      // 'company-review': this.indeedScraper,
      // apac: this.naukriScraper,
    };

    return scrapers[kind] || null;
  }
}