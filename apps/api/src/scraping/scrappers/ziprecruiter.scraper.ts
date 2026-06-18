import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class ZipRecruiterScraper extends BaseScraper {
  kind = 'aggregator';

  async scrape(source: JobSource): Promise<JobData[]> {
    try {
      const searchUrl = `${source.websiteUrl}/jobs/search?search=software%20engineer&location=India`;
      const html = await this.fetchPage(searchUrl);
      const $ = cheerio.load(html);
      
      const jobs: JobData[] = [];

      $('.job_result').each((index, element) => {
        const $el = $(element);
        
        const title = $el.find('.job_title a').text().trim();
        const company = $el.find('.company').text().trim();
        const location = $el.find('.location').text().trim() || 'India';
        const applyUrl = $el.find('.job_title a').attr('href');
        
        if (title) {
          jobs.push({
            title,
            company: company || 'Unknown',
            description: title,
            location,
            workMode: location.includes('Remote') ? 'REMOTE' : 'ONSITE',
            jobType: 'FULL_TIME',
            applyUrl: applyUrl ? `https://www.ziprecruiter.com${applyUrl}` : source.websiteUrl,
            sourceJobId: `ziprecruiter-${index}-${Date.now()}`,
            postedAt: new Date(),
          });
        }
      });

      return this.filterJobsBySkills(jobs);
    } catch (error: any) {
      this.logger.error(`ZipRecruiter scraping failed: ${error.message}`);
      return [];
    }
  }
}