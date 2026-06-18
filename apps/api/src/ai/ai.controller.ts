import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { JobDiscoveryService } from './job-discovery.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly jobDiscoveryService: JobDiscoveryService,
  ) {}

  /**
   * Chat with AI about jobs, career, etc.
   */
  @Post('chat')
  async chat(
    @Body('message') message: string,
    @Body('context') context?: { skills?: string[] },
  ) {
    const response = await this.aiService.chatWithAI(message, context || {});
    return { response };
  }

  /**
   * Discover new jobs not in database
   */
  @Post('discover-jobs')
  async discoverJobs(
    @Body('query') query: string,
    @Body('skills') skills: string[] = [],
  ) {
    const jobs = await this.jobDiscoveryService.discoverJobs(query, skills);
    return { 
      jobs,
      total: jobs.length,
      newJobs: jobs.filter((j: any) => j._isNew).length,
    };
  }

  /**
   * Get search URLs for external job boards
   */
  @Get('search-urls')
  async getSearchUrls(
    @Query('query') query: string,
    @Query('location') location: string = 'remote',
  ) {
    const urls = this.jobDiscoveryService.generateSearchUrls(query, location);
    return { urls };
  }

  /**
   * Check AI status
   */
  @Get('status')
  async getStatus() {
    return this.aiService.checkOllamaStatus();
  }
}