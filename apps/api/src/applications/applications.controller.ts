import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from '@prisma/client';

// Temporary - will be replaced with actual auth
const TEMP_USER_ID = 'user-temp-123';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  async createApplication(
    @Body('jobId') jobId: string,
    @Body('resumeId') resumeId?: string,
    @Body('coverLetter') coverLetter?: string,
  ) {
    return this.applicationsService.createApplication(TEMP_USER_ID, jobId, resumeId, coverLetter);
  }

  @Get()
  async getApplications(@Query('status') status?: ApplicationStatus) {
    return this.applicationsService.getApplications(TEMP_USER_ID, status);
  }

  @Get('stats')
  async getStats() {
    return this.applicationsService.getApplicationStats(TEMP_USER_ID);
  }

  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ApplicationStatus,
  ) {
    return this.applicationsService.updateStatus(id, status);
  }

  @Delete(':id')
  async deleteApplication(@Param('id') id: string) {
    return this.applicationsService.deleteApplication(id);
  }
}