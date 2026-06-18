import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class FlexJobsScraper extends BaseScraper {
  kind = 'remote';

  async scrape(source: JobSource): Promise<JobData[]> {
    try {
      // FlexJobs requires different approach - using their public feed
      const url = `${source.websiteUrl}/search?q=software+engineer&remote=true`;
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      
      const jobs: JobData[] = [];

      $('.job-item, .job-list-item, .search-result-item').each((index, element) => {
        const $el = $(element);
        const title = $el.find('.job-title a, .title').first().text().trim();
        const company = $el.find('.company-name, .company').first().text().trim();
        const location = $el.find('.location').text().trim() || 'Remote';
        const applyUrl = $el.find('.job-title a, .title a').attr('href');
        
        if (title && title.length > 3) {
          jobs.push({
            title,
            company: company || 'FlexJobs Company',
            description: title,
            location: 'Remote',
            workMode: 'REMOTE',
            jobType: 'FULL_TIME',
            applyUrl: applyUrl ? `https://www.flexjobs.com${applyUrl}` : source.websiteUrl,
            sourceJobId: `flexjobs-${Date.now()}-${index}`,
            postedAt: new Date(),
          });
        }
      });

      return this.filterJobsBySkills(jobs);
    } catch (error: any) {
      this.logger.error(`FlexJobs scraping failed: ${error.message}`);
      return [];
    }
  }
}