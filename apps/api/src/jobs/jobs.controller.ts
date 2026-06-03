import { Controller, Get, Param, Query } from '@nestjs/common';
import { JobsQueryDto } from './dto/jobs-query.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findMany(@Query() query: JobsQueryDto) {
    return this.jobsService.findMany(query);
  }

  @Get('sources')
  findSources() {
    return this.jobsService.findSources();
  }

  @Get('skills')
  findSkills() {
    return this.jobsService.findSkills();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.jobsService.findBySlug(slug);
  }
}
