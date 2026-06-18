import { Injectable } from '@nestjs/common';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class RemoteOKScraper extends BaseScraper {
  kind = 'remote';

  async scrape(source: JobSource): Promise<JobData[]> {
    try {
      // RemoteOK has a public JSON API
      const data = await this.fetchJSON('https://remoteok.com/api');
      
      const jobs: JobData[] = data
        .filter((item: any) => !item.slug?.includes('---')) // Skip non-job items
        .map((item: any) => ({
          title: item.position || item.title || 'Unknown',
          company: item.company || 'Unknown Company',
          description: item.description || item.apply_url || '',
          location: item.location || 'Remote',
          workMode: this.detectWorkMode(item),
          jobType: 'FULL_TIME',
          applyUrl: item.apply_url || `https://remoteok.com/remote-jobs/${item.slug}`,
          sourceJobId: `remoteok-${item.id || item.slug}`,
          postedAt: item.date ? new Date(item.date) : new Date(),
          minSalary: undefined,
          maxSalary: undefined,
          currency: 'USD',
        }));

      return this.filterJobsBySkills(jobs);
    } catch (error: any) {
      this.logger.error(`RemoteOK scraping failed: ${error.message}`);
      return [];
    }
  }

  private detectWorkMode(job: any): 'REMOTE' | 'HYBRID' | 'ONSITE' {
    const tags = [job.tags || [], job.location || ''].flat();
    if (tags.some(t => typeof t === 'string' && t.toLowerCase().includes('remote'))) {
      return 'REMOTE';
    }
    return 'REMOTE';
  }
}