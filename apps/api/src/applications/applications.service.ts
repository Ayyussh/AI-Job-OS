import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createApplication(userId: string, jobId: string, resumeId?: string, coverLetter?: string) {
    // Check if application already exists
    const existing = await this.prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    if (existing) {
      throw new Error('Application already exists');
    }

    return this.prisma.application.create({
      data: {
        userId,
        jobId,
        resumeId,
        coverLetter,
        status: ApplicationStatus.APPLIED,
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  async getApplications(userId: string, status?: ApplicationStatus) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.prisma.application.findMany({
      where,
      include: {
        job: {
          include: {
            company: true,
            skills: {
              include: {
                skill: true,
              },
            },
          },
        },
        resume: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateStatus(applicationId: string, status: ApplicationStatus) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { 
        status,
        updatedAt: new Date(),
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  async deleteApplication(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.application.delete({
      where: { id: applicationId },
    });
  }

  async getApplicationStats(userId: string) {
    const stats = await this.prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        status: true,
      },
    });

    const result: Record<string, number> = {};
    stats.forEach((stat) => {
      result[stat.status] = stat._count.status;
    });

    // Ensure all statuses are present
    const allStatuses = Object.values(ApplicationStatus);
    allStatuses.forEach((status) => {
      if (!result[status]) {
        result[status] = 0;
      }
    });

    return result;
  }
}