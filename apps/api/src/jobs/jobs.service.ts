import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ExperienceLevel,
  JobStatus,
  JobType,
  Prisma,
  WorkMode,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JobsQueryDto } from './dto/jobs-query.dto';

const jobInclude = {
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      verified: true,
      industries: true,
    },
  },
  source: {
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      kind: true,
    },
  },
  skills: {
    include: {
      skill: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      skill: {
        name: 'asc',
      },
    },
  },
  _count: {
    select: {
      applications: true,
      savedBy: true,
    },
  },
} satisfies Prisma.JobInclude;

const jobDetailInclude = {
  ...jobInclude,
  jobDescription: {
    select: {
      id: true,
      content: true,
      createdAt: true,
    },
  },
} satisfies Prisma.JobInclude;

type JobWithRelations = Prisma.JobGetPayload<{ include: typeof jobInclude }>;
type JobDetailWithRelations = Prisma.JobGetPayload<{
  include: typeof jobDetailInclude;
}>;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: JobsQueryDto) {
    const page = toPositiveInt(query.page, 1);
    const limit = Math.min(toPositiveInt(query.limit, 20), 50);
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [total, jobs] = await this.prisma.$transaction([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        include: jobInclude,
        orderBy: this.buildOrderBy(query.sort),
        skip,
        take: limit,
      }),
    ]);

    return {
      data: jobs.map((job) => this.toJobSummary(job)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        slug,
        status: JobStatus.PUBLISHED,
      },
      include: jobDetailInclude,
    });

    if (!job) {
      throw new NotFoundException(`Job "${slug}" was not found`);
    }

    return this.toJobDetail(job);
  }

  async findSources() {
    const sources = await this.prisma.jobSource.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        kind: true,
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      websiteUrl: source.websiteUrl,
      kind: source.kind,
      jobsCount: source._count.jobs,
    }));
  }

  async findSkills() {
    const skills = await this.prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      jobsCount: skill._count.jobs,
    }));
  }

  private buildWhere(query: JobsQueryDto): Prisma.JobWhereInput {
    const q = clean(query.q);
    const location = clean(query.location);
    const source = clean(query.source);
    const company = clean(query.company);
    const skill = clean(query.skill);
    const workMode = enumValue(WorkMode, query.workMode);
    const jobType = enumValue(JobType, query.jobType);
    const experienceLevel = enumValue(ExperienceLevel, query.experienceLevel);
    const minSalary = toOptionalInt(query.minSalary);
    const maxSalary = toOptionalInt(query.maxSalary);
    const featured = toOptionalBoolean(query.featured);

    const where: Prisma.JobWhereInput = {
      status: JobStatus.PUBLISHED,
    };

    if (q) {
      where.OR = [
        { title: contains(q) },
        { description: contains(q) },
        { location: contains(q) },
        { company: { name: contains(q) } },
        { source: { name: contains(q) } },
        {
          skills: {
            some: {
              skill: {
                OR: [{ name: contains(q) }, { slug: contains(q) }],
              },
            },
          },
        },
      ];
    }

    if (location) {
      where.location = contains(location);
    }

    if (workMode) {
      where.workMode = workMode;
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (experienceLevel) {
      where.experienceLevel = experienceLevel;
    }

    if (source) {
      where.source = { name: contains(source) };
    }

    if (company) {
      where.company = {
        OR: [{ name: contains(company) }, { slug: contains(company) }],
      };
    }

    if (skill) {
      where.skills = {
        some: {
          skill: {
            OR: [{ name: contains(skill) }, { slug: contains(skill) }],
          },
        },
      };
    }

    if (minSalary !== undefined) {
      where.maxSalary = { gte: minSalary };
    }

    if (maxSalary !== undefined) {
      where.minSalary = { lte: maxSalary };
    }

    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    return where;
  }

  private buildOrderBy(
    sort: JobsQueryDto['sort'],
  ): Prisma.JobOrderByWithRelationInput[] {
    if (sort === 'salary') {
      return [{ maxSalary: 'desc' }, { postedAt: 'desc' }];
    }

    if (sort === 'newest') {
      return [{ postedAt: 'desc' }];
    }

    return [{ isFeatured: 'desc' }, { postedAt: 'desc' }];
  }

  private toJobSummary(job: JobWithRelations) {
    return {
      id: job.id,
      title: job.title,
      slug: job.slug,
      description: job.description,
      location: job.location,
      city: job.city,
      country: job.country,
      workMode: job.workMode,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      minSalary: job.minSalary,
      maxSalary: job.maxSalary,
      currency: job.currency,
      salaryPeriod: job.salaryPeriod,
      applyUrl: job.applyUrl,
      isFeatured: job.isFeatured,
      postedAt: job.postedAt,
      expiresAt: job.expiresAt,
      company: job.company,
      source: job.source,
      skills: job.skills.map((jobSkill) => ({
        importance: jobSkill.importance,
        ...jobSkill.skill,
      })),
      counts: {
        applications: job._count.applications,
        saved: job._count.savedBy,
      },
    };
  }

  private toJobDetail(job: JobDetailWithRelations) {
    return {
      ...this.toJobSummary(job),
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      benefits: job.benefits,
      jobDescription: job.jobDescription,
    };
  }
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function contains(value: string): Prisma.StringFilter {
  return {
    contains: value,
    mode: 'insensitive',
  };
}

function enumValue<T extends Record<string, string>>(
  enumObject: T,
  value?: string,
): T[keyof T] | undefined {
  const normalized = clean(value)
    ?.toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (!normalized) {
    return undefined;
  }

  return Object.values(enumObject).find(
    (option): option is T[keyof T] => option === normalized,
  );
}

function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toOptionalInt(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function toOptionalBoolean(value?: string) {
  if (value === undefined) {
    return undefined;
  }

  return value === 'true' || value === '1';
}
