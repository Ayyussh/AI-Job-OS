import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { AiService } from '../ai/ai.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService,
    private readonly aiService: AiService,
  ) {}

  @Post('match-all')
  async matchAllJobs(
    @Body('resumeId') resumeId: string,
    @Body('useAI') useAI: boolean = true,
    @Body('complexity') complexity: 'simple' | 'moderate' | 'complex' = 'moderate',
  ) {
    return this.matchingService.matchResumeWithAllJobs(resumeId, useAI, complexity);
  }

  @Post('match-single')
  async matchSingleJob(
    @Body('resumeId') resumeId: string,
    @Body('jobId') jobId: string,
    @Body('useAI') useAI: boolean = true,
    @Body('complexity') complexity: 'simple' | 'moderate' | 'complex' = 'moderate',
  ) {
    return this.matchingService.matchResumeWithAllJobs(resumeId, useAI, complexity);
  }

  @Get('resume/:resumeId')
  async getMatchesForResume(
    @Param('resumeId') resumeId: string,
    @Query('complexity') complexity: 'simple' | 'moderate' | 'complex' = 'moderate',
  ) {
    return this.matchingService.matchResumeWithAllJobs(resumeId, true, complexity);
  }

  @Get('test-models')
  async testModels() {
    return this.aiService.testModels();
  }
}