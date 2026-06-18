import { Injectable } from '@nestjs/common';
import { BaseScraper } from './base.scraper';
import { WellfoundScraper } from './wellfound.scraper';
import { RemoteOKScraper } from './remoteok.scraper';
import { RemotiveScraper } from './remotive.scraper';
import { IndeedScraper } from './indeed.scraper';
import { NaukriScraper } from './naukri.scraper';
import { LinkedInScraper } from './linkedin.scraper';
import { YCombinatorScraper } from './ycombinator.scraper';
import { ZipRecruiterScraper } from './ziprecruiter.scraper';
// Import other scrapers as you add them

@Injectable()
export class ScraperFactory {
  constructor(
    private readonly wellfoundScraper: WellfoundScraper,
    private readonly remoteOKScraper: RemoteOKScraper,
    private readonly remotiveScraper: RemotiveScraper,
    private readonly indeedScraper: IndeedScraper,
    private readonly naukriScraper: NaukriScraper,
    private readonly linkedInScraper: LinkedInScraper,
    private readonly yCombinatorScraper: YCombinatorScraper,
    private readonly zipRecruiterScraper: ZipRecruiterScraper,
  ) {}

  getScraper(kind: string): BaseScraper | null {
    const scrapers: Record<string, BaseScraper> = {
      'startup': this.wellfoundScraper,
      'remote': this.remoteOKScraper,
      'aggregator': this.indeedScraper,
      'india': this.naukriScraper,
      'network': this.linkedInScraper,
      'remote-ok': this.remoteOKScraper,
      'remotive': this.remotiveScraper,
      'yc': this.yCombinatorScraper,
      'ziprecruiter': this.zipRecruiterScraper,
      // Aliases for different sources
      'india-tech': this.naukriScraper,
      'company-review': this.indeedScraper,
      'apac': this.naukriScraper,
      'direct-hiring': this.naukriScraper,
    };

    return scrapers[kind] || null;
  }
}