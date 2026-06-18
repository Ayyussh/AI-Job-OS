import { Injectable } from '@nestjs/common';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class YCombinatorScraper extends BaseScraper {
  kind = 'startup';

  async scrape(source: JobSource): Promise<JobData[]> {
    try {
      // YC has a public jobs API
      const data = await this.fetchJSON('https://www.ycombinator.com/jobs.json');
      
      const jobs: JobData[] = (data || []).map((item: any) => ({
        title: item.role || item.title || 'Unknown',
        company: item.company_name || 'YC Startup',
        description: item.description || item.role || '',
        location: item.location || 'Remote',
        workMode: item.location?.includes('Remote') ? 'REMOTE' : 'ONSITE',
        jobType: 'FULL_TIME',
        applyUrl: `https://www.ycombinator.com/jobs/${item.id}`,
        sourceJobId: `yc-${item.id || Date.now()}`,
        postedAt: item.created_at ? new Date(item.created_at) : new Date(),
      }));

      return this.filterJobsBySkills(jobs);
    } catch (error: any) {
      this.logger.error(`YC Jobs scraping failed: ${error.message}`);
      return [];
    }
  }
}