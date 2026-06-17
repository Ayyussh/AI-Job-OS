export interface JobData {
  title: string;
  company: string;
  description: string;
  location: string;
  city?: string;
  country?: string;
  workMode?: 'REMOTE' | 'HYBRID' | 'ONSITE';
  jobType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
  experienceLevel?: 'INTERN' | 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  salaryPeriod?: 'YEAR' | 'MONTH' | 'HOUR';
  applyUrl: string;
  sourceJobId: string;
  postedAt?: Date;
}

export interface JobSource {
  id: string;
  name: string;
  websiteUrl: string;
  kind: string;
}

export abstract class BaseScraper {
  abstract kind: string;
  
  abstract scrape(source: JobSource): Promise<JobData[]>;

  protected async fetchPage(url: string): Promise<string> {
    // Use fetch with headers to avoid blocking
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Job-OS/1.0)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.text();
  }

  protected extractSalary(text: string): { min?: number; max?: number; currency?: string } {
    // Simple salary extraction (enhance based on source)
    const patterns = [
      /(\$|USD|INR|EUR|GBP)\s*([\d,]+)\s*-\s*([\d,]+)/i,
      /([\d,]+)\s*-\s*([\d,]+)\s*(\$|USD|INR|EUR|GBP)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const currency = match[1] || match[3] || 'USD';
        const min = parseInt(match[2]?.replace(/,/g, '') || '0');
        const max = parseInt(match[3]?.replace(/,/g, '') || '0');
        return { min, max, currency };
      }
    }

    return {};
  }
}