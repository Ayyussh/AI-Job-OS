import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';
import { memoryStorage } from 'multer';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  uploadResume(@UploadedFile() file: Express.Multer.File) {
    return this.resumeService.processResume(file);
  }

  @Get()
  async getAllResumes() {
    return this.resumeService.getAllResumes();
  }
}