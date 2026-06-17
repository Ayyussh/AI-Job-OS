import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('match-all')
  async matchAllJobs(@Body('resumeId') resumeId: string) {
    return this.matchingService.matchResumeWithAllJobs(resumeId);
  }

  @Post('match-single')
  async matchSingleJob(
    @Body('resumeId') resumeId: string,
    @Body('jobId') jobId: string,
  ) {
    // For now, use match-all for single job too
    return this.matchingService.matchResumeWithAllJobs(resumeId);
  }

  @Get('resume/:resumeId')
  async getMatchesForResume(@Param('resumeId') resumeId: string) {
    return this.matchingService.matchResumeWithAllJobs(resumeId);
  }
}