import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { JobDiscoveryService } from './job-discovery.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScrapingModule } from '../scraping/scraping.module'; 

@Module({
  imports: [PrismaModule, ScrapingModule],
  controllers: [AiController],
  providers: [AiService, JobDiscoveryService],
  exports: [AiService, JobDiscoveryService],
})
export class AiModule {}