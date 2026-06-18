import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class IndeedScraper extends BaseScraper {
  kind = 'aggregator';

  async scrape(source: JobSource): Promise<JobData[]> {
    try {
      // Better search with more specific keywords
      const keywords = encodeURIComponent('software engineer react nextjs typescript nodejs');
      const searchUrl = `${source.websiteUrl}/jobs?q=${keywords}&l=India&sort=date&fromage=7`;
      const html = await this.fetchPage(searchUrl);
      const $ = cheerio.load(html);
      
      const jobs: JobData[] = [];

      // Updated selector for Indeed's current structure
      $('.job_seen_beacon, .jobsearch-SerpJobCard, .cardOutline').each((index, element) => {
        const $el = $(element);
        
        const title = $el.find('.jobTitle span, .jobtitle, .title').first().text().trim();
        const company = $el.find('.companyName, .company, .subtitle').first().text().trim();
        const location = $el.find('.companyLocation, .location, .subtitle').first().text().trim() || 'India';
        const description = $el.find('.job-snippet, .summary, .description').text().trim();
        const applyUrl = $el.find('.jobTitle a, .title a').attr('href');
        
        if (title && title.length > 3) {
          jobs.push({
            title,
            company: company || 'Unknown Company',
            description: description || title,
            location: location || 'India',
            workMode: location.toLowerCase().includes('remote') ? 'REMOTE' : 'ONSITE',
            jobType: 'FULL_TIME',
            applyUrl: applyUrl ? `https://www.indeed.com${applyUrl}` : source.websiteUrl,
            sourceJobId: `indeed-${Date.now()}-${index}`,
            postedAt: new Date(),
          });
        }
      });

      this.logger.log(`Indeed: Found ${jobs.length} raw jobs before filtering`);
      const filtered = this.filterJobsBySkills(jobs);
      this.logger.log(`Indeed: ${filtered.length} jobs matched your skills`);
      return filtered;
    } catch (error: any) {
      this.logger.error(`Indeed scraping failed: ${error.message}`);
      return [];
    }
  }
}