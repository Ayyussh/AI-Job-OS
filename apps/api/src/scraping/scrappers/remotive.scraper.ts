import { Injectable } from '@nestjs/common';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class RemotiveScraper extends BaseScraper {
  kind = 'remotive';

  async scrape(source: JobSource): Promise<JobData[]> {
    try {
      // Remotive has a public API
      const data = await this.fetchJSON('https://remotive.com/api/remote-jobs');
      
      const jobs: JobData[] = (data.jobs || []).map((item: any) => ({
        title: item.title || 'Unknown',
        company: item.company_name || 'Unknown Company',
        description: item.description || item.title || '',
        location: item.candidate_required_location || 'Remote',
        workMode: 'REMOTE',
        jobType: item.job_type?.toUpperCase() || 'FULL_TIME',
        applyUrl: item.url || source.websiteUrl,
        sourceJobId: `remotive-${item.id || Date.now()}`,
        postedAt: item.publication_date ? new Date(item.publication_date) : new Date(),
        minSalary: undefined,
        maxSalary: undefined,
        currency: 'USD',
      }));

      // Step 1: Filter by skills
      const filtered = this.filterJobsBySkills(jobs);
      
      // Step 2: Deduplicate within this source
      const deduplicated = this.deduplicateJobs(filtered);
      
      return deduplicated;
    } catch (error: any) {
      this.logger.error(`Remotive scraping failed: ${error.message}`);
      return [];
    }
  }
}