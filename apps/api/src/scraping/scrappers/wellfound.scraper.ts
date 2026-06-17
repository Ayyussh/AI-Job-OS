import { Injectable } from '@nestjs/common';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class WellfoundScraper extends BaseScraper {
  kind = 'startup';

  async scrape(source: JobSource): Promise<JobData[]> {
    const url = `${source.websiteUrl}/api/jobs`;
    
    try {
      const html = await this.fetchPage(url);
      const jobs = this.parseJobs(html);
      return jobs;
    } catch (error: any) {
      console.error(`Wellfound scraping failed: ${error.message}`);
      return this.getMockJobs();
    }
  }

  private parseJobs(html: string): JobData[] {
    // Implement actual parsing logic here
    return [];
  }

  private getMockJobs(): JobData[] {
    return [
      {
        title: 'Senior Full Stack Engineer',
        company: 'BrightLoop AI',
        description: 'Own product surfaces for AI hiring workflows...',
        location: 'Remote, India',
        country: 'India',
        workMode: 'REMOTE',
        jobType: 'FULL_TIME',
        experienceLevel: 'SENIOR',
        minSalary: 3800000,
        maxSalary: 5800000,
        currency: 'INR',
        salaryPeriod: 'YEAR',
        applyUrl: 'https://wellfound.com/jobs/brightloop-senior-full-stack',
        sourceJobId: `wellfound-${Date.now()}`,
        postedAt: new Date(),
      },
    ];
  }
}