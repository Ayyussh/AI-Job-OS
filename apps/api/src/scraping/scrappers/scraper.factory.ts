import { Injectable } from '@nestjs/common';
import { BaseScraper } from './base.scraper';
import { RemoteOKScraper } from './remoteok.scraper';
import { RemotiveScraper } from './remotive.scraper';
import { WeWorkRemotelyScraper } from './weworkremotely.scraper';
import { HimalayasScraper } from './himalayas.scraper';
import { GoogleJobsScraper } from './googlejobs.scraper';
// Import other scrapers as you add them

@Injectable()
export class ScraperFactory {
  constructor(
    private readonly remoteOKScraper: RemoteOKScraper,
    private readonly remotiveScraper: RemotiveScraper,
    private readonly weWorkRemotelyScraper: WeWorkRemotelyScraper,
    private readonly himalayasScraper: HimalayasScraper,
    private readonly googleJobsScraper: GoogleJobsScraper,
  ) {}

  getScraper(kind: string): BaseScraper | null {
    const scrapers: Record<string, BaseScraper> = {
      'remote': this.remoteOKScraper,
      'remote-ok': this.remoteOKScraper,
      'remotive': this.remotiveScraper,
      'weworkremotely': this.weWorkRemotelyScraper,
      'himalayas': this.himalayasScraper,
      'google': this.googleJobsScraper,
    };

    return scrapers[kind] || null;
  }
}