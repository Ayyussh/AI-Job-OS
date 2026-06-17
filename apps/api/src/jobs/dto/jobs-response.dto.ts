import { Job } from '@prisma/client';

export class JobsResponseDto {
  data: Job[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  constructor(data: Job[], meta: { total: number; page: number; limit: number; totalPages: number }) {
    this.data = data;
    this.meta = meta;
  }
}