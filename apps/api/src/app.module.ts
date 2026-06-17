import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { PrismaModule } from './prisma/prisma.module';
import { ResumeModule } from './resume/resume.module';
import { MatchingModule } from './matching/matching.module';
import { ScrapingModule } from './scraping/scraping.module';
import { ApplicationsModule } from './applications/applications.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    JobsModule,
    ResumeModule,
    MatchingModule,
    ScrapingModule,
    ApplicationsModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}