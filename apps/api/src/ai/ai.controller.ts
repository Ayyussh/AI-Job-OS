import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { JobDiscoveryService } from './job-discovery.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly jobDiscoveryService: JobDiscoveryService,
  ) {}

  @Post('chat')
  async chat(
    @Body('message') message: string,
    @Body('context') context?: { skills?: string[] },
  ) {
    // Check if user is asking about jobs
    if (this.isJobQuery(message)) {
      const result = await this.jobDiscoveryService.discoverJobs(message, context?.skills || []);
      return {
        response: result.summary,
        jobs: result.jobs,
        searchUrls: result.portals,
        type: 'job_discovery',
      };
    }

    const response = await this.aiService.chatWithAI(message, context || {});
    return { response, type: 'chat' };
  }

  @Post('discover-jobs')
  async discoverJobs(
    @Body('query') query: string,
    @Body('skills') skills: string[] = [],
  ) {
    const result = await this.jobDiscoveryService.discoverJobs(query, skills);
    return result;
  }

  @Get('search-urls')
  async getSearchUrls(
    @Query('query') query: string,
    @Query('location') location: string = 'remote',
  ) {
    // Updated method name to match the service
    const urls = this.jobDiscoveryService.getPortalSearchUrls(query, location);
    return { urls };
  }

  @Get('status')
  async getStatus() {
    return this.aiService.checkOllamaStatus();
  }

  /**
   * Check if a message is a job-related query
   */
  private isJobQuery(message: string): boolean {
    const jobKeywords = ['find', 'search', 'job', 'work', 'role', 'position', 
                         'hiring', 'developer', 'engineer', 'designer', 'manager',
                         'react', 'node', 'python', 'java', 'full stack', 'frontend', 'backend'];
    const lower = message.toLowerCase();
    return jobKeywords.some(keyword => lower.includes(keyword));
  }
}