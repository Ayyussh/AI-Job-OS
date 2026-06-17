const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ScrapingStatus {
  name: string;
  active: boolean;
  lastScraped: string | null;
  jobCount: number;
}

export interface ScrapingResult {
  success: Array<{ source: string; count: number }>;
  failed: Array<{ source: string; error: string }>;
  total: number;
  newJobs: number;
}

export async function getScrapingStatus(): Promise<ScrapingStatus[]> {
  const response = await fetch(`${API_URL}/scraping/status`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch scraping status');
  }
  
  return response.json();
}

export async function scrapeAllSources(): Promise<ScrapingResult> {
  const response = await fetch(`${API_URL}/scraping/scrape-all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to start scraping');
  }
  
  return response.json();
}

export async function scrapeSource(sourceName: string): Promise<{ source: string; count: number }> {
  const response = await fetch(`${API_URL}/scraping/scrape/${encodeURIComponent(sourceName)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to scrape ${sourceName}`);
  }
  
  return response.json();
}