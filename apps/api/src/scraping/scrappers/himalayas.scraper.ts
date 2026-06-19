import { Injectable } from '@nestjs/common';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class HimalayasScraper extends BaseScraper {
  kind = 'himalayas';

  async scrape(source: JobSource): Promise<JobData[]> {
    try {
      // Try different endpoints for Himalayas
      const urls = [
        `${source.websiteUrl}/api/jobs`,
        `${source.websiteUrl}/jobs.json`,
        `https://himalayas.app/api/jobs`,
      ];

      let data: any = null;
      let found = false;

      for (const url of urls) {
        try {
          const response = await this.fetchJSON(url);
          if (response) {
            data = response;
            found = true;
            this.logger.log(`Successfully fetched from ${url}`);
            break;
          }
        } catch (e: any) {
          this.logger.warn(`Failed on ${url}, trying next...`);
        }
      }

      if (!found || !data) {
        this.logger.warn('No Himalayas API endpoint worked');
        return [];
      }

      // Extract jobs array - handle different response formats
      let jobsArray: any[] = [];
      
      if (Array.isArray(data)) {
        jobsArray = data;
      } else if (data.jobs && Array.isArray(data.jobs)) {
        jobsArray = data.jobs;
      } else if (data.data && Array.isArray(data.data)) {
        jobsArray = data.data;
      } else {
        // Try to find any array property
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            jobsArray = data[key];
            this.logger.log(`Found jobs array in property: ${key}`);
            break;
          }
        }
      }

      if (jobsArray.length === 0) {
        this.logger.warn('No jobs found in Himalayas response');
        return [];
      }

      this.logger.log(`Found ${jobsArray.length} jobs from Himalayas`);

      const jobs: JobData[] = jobsArray.map((item: any) => ({
        title: item.title || item.role || item.position || 'Unknown',
        company: item.company || item.company_name || item.organization || 'Himalayas',
        description: item.description || item.overview || item.summary || '',
        location: item.location || item.remote_location || (item.remote ? 'Remote' : 'On-site'),
        workMode: item.remote || item.location?.toLowerCase().includes('remote') ? 'REMOTE' : 'ONSITE',
        jobType: item.job_type || item.type || 'FULL_TIME',
        applyUrl: item.url || item.apply_url || item.link || source.websiteUrl,
        sourceJobId: `himalayas-${item.id || Date.now()}-${Math.random()}`,
        postedAt: item.created_at || item.posted_at ? new Date(item.created_at || item.posted_at) : new Date(),
        minSalary: item.min_salary || item.salary_min || undefined,
        maxSalary: item.max_salary || item.salary_max || undefined,
        currency: item.currency || 'USD',
      }));

      this.logger.log(`Himalayas: ${jobs.length} raw jobs found`);

      // Filter by core skills
      const filtered = this.filterJobsBySkills(jobs);
      this.logger.log(`Himalayas: ${filtered.length} jobs matched your skills`);

      // Deduplicate
      const deduplicated = this.deduplicateJobs(filtered);
      this.logger.log(`Himalayas: ${deduplicated.length} jobs after deduplication`);

      return deduplicated;
    } catch (error: any) {
      this.logger.error(`Himalayas scraping failed: ${error.message}`);
      return [];
    }
  }
}