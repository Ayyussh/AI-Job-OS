import { ExperienceLevel, JobType, WorkMode } from '@prisma/client';

export class JobsQueryDto {
  q?: string;
  location?: string;
  workMode?: WorkMode;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  source?: string;
  company?: string;
  skill?: string;
  minSalary?: string;
  maxSalary?: string;
  featured?: string;
  sort?: 'newest' | 'salary' | 'featured';
  page?: string;
  limit?: string;
}
