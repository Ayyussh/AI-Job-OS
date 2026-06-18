import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class NaukriScraper extends BaseScraper {
  kind = 'india';

  async scrape(source: JobSource): Promise<JobData[]> {
    try {
      const searchUrl = `${source.websiteUrl}/software-engineer-jobs?k=react%20nextjs%20nodejs`;
      const html = await this.fetchPage(searchUrl);
      const $ = cheerio.load(html);
      
      const jobs: JobData[] = [];

      $('.jobTuple').each((index, element) => {
        const $el = $(element);
        
        const title = $el.find('.jobInfo h3 a').text().trim() || 
                     $el.find('.title a').text().trim();
        const company = $el.find('.companyInfo a').text().trim() || 
                       $el.find('.subTitle a').text().trim();
        const location = $el.find('.location').text().trim() || 'India';
        const description = $el.find('.job-description').text().trim() || title;
        const applyUrl = $el.find('.jobInfo h3 a').attr('href');
        
        if (title && company) {
          jobs.push({
            title,
            company,
            description,
            location,
            workMode: location.includes('Remote') || location.includes('Work From Home') ? 'REMOTE' : 'ONSITE',
            jobType: 'FULL_TIME',
            applyUrl: applyUrl || source.websiteUrl,
            sourceJobId: `naukri-${index}-${Date.now()}`,
            postedAt: new Date(),
          });
        }
      });

      return this.filterJobsBySkills(jobs);
    } catch (error: any) {
      this.logger.error(`Naukri scraping failed: ${error.message}`);
      return [];
    }
  }
}