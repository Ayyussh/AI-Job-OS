import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class LinkedInScraper extends BaseScraper {
  kind = 'network';

  async scrape(source: JobSource): Promise<JobData[]> {
    try {
      // LinkedIn has complex anti-scraping. We'll use their public job search
      const searchUrl = `${source.websiteUrl}/jobs/search?keywords=react%20nextjs%20nodejs&location=India`;
      const html = await this.fetchPage(searchUrl);
      const $ = cheerio.load(html);
      
      const jobs: JobData[] = [];

      $('.job-search-card').each((index, element) => {
        const $el = $(element);
        
        const title = $el.find('.base-search-card__title').text().trim();
        const company = $el.find('.base-search-card__subtitle a').text().trim() || 
                       $el.find('.base-search-card__subtitle').text().trim();
        const location = $el.find('.job-search-card__location').text().trim() || 'India';
        const applyUrl = $el.find('.base-card__full-link').attr('href');
        
        if (title) {
          jobs.push({
            title,
            company: company || 'Unknown',
            description: title,
            location,
            workMode: location.includes('Remote') ? 'REMOTE' : 'ONSITE',
            jobType: 'FULL_TIME',
            applyUrl: applyUrl || source.websiteUrl,
            sourceJobId: `linkedin-${index}-${Date.now()}`,
            postedAt: new Date(),
          });
        }
      });

      return this.filterJobsBySkills(jobs);
    } catch (error: any) {
      this.logger.error(`LinkedIn scraping failed: ${error.message}`);
      return [];
    }
  }
}