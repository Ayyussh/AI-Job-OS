import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { BaseScraper, JobData, JobSource } from './base.scraper';

@Injectable()
export class GoogleJobsScraper extends BaseScraper {
  kind = 'google';

  async scrape(source: JobSource, searchQuery?: string): Promise<JobData[]> {
    // Use provided search query or default to React jobs
    const query = searchQuery || 'react frontend jobs remote';
    this.logger.log(`🔍 Starting Google Jobs scraping for: "${query}"`);

    // Build Google Jobs search URL with React-specific query
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&ibp=htl;jobs`;

    let browser: puppeteer.Browser | null = null;

    try {
      // Launch headless browser with additional args for stability
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
      });

      const page = await browser.newPage();

      // Set realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate to Google Jobs search
      this.logger.log(`🌐 Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for job results to load
      await page.waitForSelector('.iFjolc, .gws-plugins-horizon-jobs__li, .job-card-container, .job-card', {
        timeout: 15000,
      }).catch(() => {
        this.logger.warn('⚠️ No job cards found on page, continuing...');
      });

      // Get page content
      const html = await page.content();
      const $ = cheerio.load(html);

      const jobs: JobData[] = [];

      // ===== REACT-SPECIFIC SELECTORS =====
      // Try multiple selector patterns for Google Jobs cards
      const jobCardSelectors = [
        '.iFjolc', // Common Google Jobs card
        '.gws-plugins-horizon-jobs__li', // Older Google Jobs card
        '.job-card-container', // Alternative card container
        '.job-card', // Simple job card
        '.gws-plugins-horizon-jobs__item', // Another common pattern
        '.gws-plugins-horizon-jobs__result', // Result container
        '.PwjeAc', // Google jobs card (newer)
        '.nDgy9d', // Job title container
      ];

      let jobCards: any = $();

      // Try each selector until we find cards
      for (const selector of jobCardSelectors) {
        const found = $(selector);
        if (found.length > 0) {
          jobCards = found;
          this.logger.log(`📋 Found ${found.length} job cards with selector: ${selector}`);
          break;
        }
      }

      // If no cards found, try a broader search
      if (jobCards.length === 0) {
        this.logger.warn('⚠️ No job cards found with specific selectors, trying broader search...');
        
        // Look for any element containing job-related text
        const allElements = $('*').filter((_, el) => {
          const text = $(el).text().toLowerCase();
          return text.includes('react') || text.includes('frontend') || text.includes('developer') || text.includes('engineering');
        });
        
        if (allElements.length > 0) {
          this.logger.log(`📋 Found ${allElements.length} potential job elements`);
          // Use the parent containers
          jobCards = allElements.parent().parent();
        }
      }

      this.logger.log(`📋 Processing ${jobCards.length} job cards`);

      // Process each job card
      jobCards.each((index, element) => {
        const $el = $(element);

        // ===== EXTRACT JOB DETAILS WITH MULTIPLE FALLBACKS =====

        // Title - try multiple selectors
        const title = 
          $el.find('.jobTitle, .job-title, .title, .jCsbSe, .nDgy9d, .BjJfJf, .tNxQIb').first().text().trim() ||
          $el.find('a[aria-label*="job"]').first().text().trim() ||
          $el.find('h3').first().text().trim() ||
          $el.find('[class*="title"]').first().text().trim() ||
          $el.find('[class*="job"]').first().text().trim();

        // Company - try multiple selectors
        const company = 
          $el.find('.companyName, .company-name, .company, .sE0Fhd, .vNEEBe, .QflVpf').first().text().trim() ||
          $el.find('[aria-label*="company"]').first().text().trim() ||
          $el.find('[class*="company"]').first().text().trim() ||
          $el.find('[class*="employer"]').first().text().trim();

        // Location - try multiple selectors
        const location = 
          $el.find('.location, .job-location, .YQ4gaf, .r0vOg, .QflVpf').first().text().trim() ||
          $el.find('[aria-label*="location"]').first().text().trim() ||
          $el.find('[class*="location"]').first().text().trim();

        // Description - try multiple selectors
        const description = 
          $el.find('.job-description, .description, .job-snippet, .p2V3k, .HBvzbc').first().text().trim() ||
          $el.find('[class*="description"]').first().text().trim() ||
          $el.find('[class*="snippet"]').first().text().trim();

        // Extract link - try multiple selectors
        let applyUrl = 
          $el.find('a[href*="jobs"]').first().attr('href') ||
          $el.find('a[jsname="hSRGPd"]').first().attr('href') ||
          $el.find('a[aria-label*="apply"]').first().attr('href') ||
          $el.find('a[href*="google.com/search"]').first().attr('href');

        if (applyUrl && !applyUrl.startsWith('http')) {
          applyUrl = `https://www.google.com${applyUrl}`;
        }

        // Try to get salary
        const salaryText = 
          $el.find('.salary, .job-salary, .Ywe0Nb, .HBvzbc').first().text().trim() ||
          $el.find('[class*="salary"]').first().text().trim();
        const salary = this.extractSalary(salaryText || '');

        // Extract posted date
        const postedText = 
          $el.find('.date, .job-date, .posted, .s5Kkuf').first().text().trim() ||
          $el.find('[class*="date"]').first().text().trim() ||
          $el.find('[class*="posted"]').first().text().trim();

        // Only add if we have at least a title
        if (title && title.length > 2) {
          jobs.push({
            title: title,
            company: company || 'Google Jobs',
            description: description || title,
            location: location || 'Remote',
            workMode: location?.toLowerCase().includes('remote') ? 'REMOTE' : 'ONSITE',
            jobType: 'FULL_TIME',
            applyUrl: applyUrl || source.websiteUrl,
            sourceJobId: `google-${Date.now()}-${index}`,
            postedAt: this.parsePostedDate(postedText),
            minSalary: salary.min,
            maxSalary: salary.max,
            currency: salary.currency || 'USD',
            salaryPeriod: 'YEAR',
          });
        }
      });

      // If still no jobs found, try extracting from script tags
      if (jobs.length === 0) {
        this.logger.log('🔄 No jobs found with selectors, trying script tag extraction...');
        
        try {
          // Extract job data from script tags
          const scriptData = await page.evaluate(() => {
            const results: any[] = [];
            const scripts = document.querySelectorAll('script');
            
            scripts.forEach((script) => {
              const text = script.textContent || '';
              
              // Look for job data in JSON format
              try {
                // Find job listing patterns in the script
                const jobPatterns = [
                  /"jobTitle"\s*:\s*"([^"]+)"/,
                  /"title"\s*:\s*"([^"]+)"/,
                  /"company"\s*:\s*"([^"]+)"/,
                  /"companyName"\s*:\s*"([^"]+)"/,
                  /"location"\s*:\s*"([^"]+)"/,
                  /"applyUrl"\s*:\s*"([^"]+)"/,
                ];
                
                // Check if this script contains job data
                const hasJobData = jobPatterns.some(p => p.test(text));
                
                if (hasJobData) {
                  // Try to extract complete job objects
                  const jobMatches = text.match(/\{[^{]*"jobTitle"[^{]*\}/g);
                  if (jobMatches) {
                    jobMatches.forEach((match) => {
                      try {
                        const job = JSON.parse(match);
                        if (job.jobTitle || job.title) {
                          results.push(job);
                        }
                      } catch (e) {
                        // Ignore parse errors
                      }
                    });
                  }
                }
              } catch (e) {
                // Ignore errors
              }
            });
            
            return results;
          });

          // Convert script data to jobs
          for (const item of scriptData) {
            if (item.jobTitle || item.title) {
              jobs.push({
                title: item.jobTitle || item.title || 'Unknown',
                company: item.company || item.companyName || 'Google Jobs',
                description: item.description || item.snippet || '',
                location: item.location || 'Remote',
                workMode: item.location?.toLowerCase().includes('remote') ? 'REMOTE' : 'ONSITE',
                jobType: 'FULL_TIME',
                applyUrl: item.applyUrl || item.url || source.websiteUrl,
                sourceJobId: `google-script-${Date.now()}-${jobs.length}`,
                postedAt: new Date(),
                minSalary: undefined,
                maxSalary: undefined,
                currency: 'USD',
              });
            }
          }

          this.logger.log(`📋 Extracted ${jobs.length} jobs from script tags`);
        } catch (error: any) {
          this.logger.warn(`Script extraction failed: ${error.message}`);
        }
      }

      // Filter by core skills (React, Next.js, JavaScript, TypeScript, HTML, CSS)
      const filteredJobs = this.filterJobsBySkills(jobs);
      this.logger.log(`✅ Google Jobs: Found ${jobs.length} raw jobs, ${filteredJobs.length} matched React/JavaScript skills`);

      // Deduplicate
      const deduplicated = this.deduplicateJobs(filteredJobs);
      this.logger.log(`✅ Google Jobs: ${deduplicated.length} jobs after deduplication`);

      return deduplicated;

    } catch (error: any) {
      this.logger.error(`❌ Google Jobs scraping failed: ${error.message}`);
      return [];
    } finally {
      if (browser) {
        await browser.close();
        this.logger.log('🔒 Browser closed');
      }
    }
  }

  /**
   * Parse posted date from text
   */
  private parsePostedDate(text: string): Date {
    if (!text) return new Date();

    const lower = text.toLowerCase();
    const now = new Date();

    if (lower.includes('today')) return now;
    if (lower.includes('yesterday')) {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d;
    }

    const daysMatch = lower.match(/(\d+)\s*days? ago/);
    if (daysMatch) {
      const d = new Date(now);
      d.setDate(d.getDate() - parseInt(daysMatch[1]));
      return d;
    }

    const hoursMatch = lower.match(/(\d+)\s*hours? ago/);
    if (hoursMatch) {
      const d = new Date(now);
      d.setHours(d.getHours() - parseInt(hoursMatch[1]));
      return d;
    }

    const weeksMatch = lower.match(/(\d+)\s*weeks? ago/);
    if (weeksMatch) {
      const d = new Date(now);
      d.setDate(d.getDate() - parseInt(weeksMatch[1]) * 7);
      return d;
    }

    return now;
  }

  /**
   * Scrape with specific query - for React jobs
   */
  async scrapeReactJobs(source: JobSource): Promise<JobData[]> {
    return this.scrape(source, 'react frontend jobs remote');
  }

  /**
   * Scrape with specific query - for React.js jobs
   */
  async scrapeReactJSJobs(source: JobSource): Promise<JobData[]> {
    return this.scrape(source, 'react.js frontend jobs remote');
  }
}