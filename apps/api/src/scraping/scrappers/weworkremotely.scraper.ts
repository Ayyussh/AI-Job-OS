import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class WeWorkRemotelyScraper extends BaseScraper {
  kind = 'weworkremotely';

  async scrape(source: JobSource): Promise<JobData[]> {
    try {
      const html = await this.fetchPage(source.websiteUrl);
      const $ = cheerio.load(html);
      
      const jobs: JobData[] = [];

      // Updated selectors for We Work Remotely
      $('.job-listing, .job, .jobs li, .position').each((index, element) => {
        const $el = $(element);
        
        // Try multiple selector patterns
        const title = $el.find('.title a, .position-title, h3 a, .job-title').first().text().trim() ||
                     $el.find('a').first().text().trim();
        const company = $el.find('.company a, .company-name, .employer').first().text().trim() ||
                       $el.find('.company').first().text().trim();
        const location = $el.find('.location, .region, .job-location').first().text().trim() || 'Remote';
        const applyUrl = $el.find('.title a, a[href*="/jobs/"]').first().attr('href');
        
        if (title && title.length > 2) {
          jobs.push({
            title: title,
            company: company || 'We Work Remotely',
            description: title,
            location: location || 'Remote',
            workMode: 'REMOTE',
            jobType: 'FULL_TIME',
            applyUrl: applyUrl ? `https://weworkremotely.com${applyUrl}` : source.websiteUrl,
            sourceJobId: `weworkremotely-${Date.now()}-${index}`,
            postedAt: new Date(),
          });
        }
      });

      this.logger.log(`Found ${jobs.length} raw jobs from We Work Remotely`);
      
      const filtered = this.filterJobsBySkills(jobs);
      return this.deduplicateJobs(filtered);
    } catch (error: any) {
      this.logger.error(`We Work Remotely scraping failed: ${error.message}`);
      return [];
    }
  }
}