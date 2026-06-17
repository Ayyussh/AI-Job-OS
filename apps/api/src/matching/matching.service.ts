import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async matchResumeWithAllJobs(resumeId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    const jobs = await this.prisma.job.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        skills: {
          include: { skill: true },
        },
        company: true,
      },
    });

    const results: any[] = [];
    const resumeSkills = (resume.parsedSkills as string[]) || [];

    for (const job of jobs) {
      try {
        const match = await this.matchJob(resumeSkills, job);
        results.push({
          ...match,
          job: {
            id: job.id,
            title: job.title,
            slug: job.slug,
            company: job.company.name,
            location: job.location,
            workMode: job.workMode,
            applyUrl: job.applyUrl,
          },
        });
      } catch (err: any) {
        this.logger.error(`Match failed for job ${job.id}: ${err.message}`);
      }
    }

    // Sort by match percentage (highest first)
    results.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return {
      resumeId,
      totalJobs: jobs.length,
      matchedJobs: results,
    };
  }

  private matchJob(resumeSkills: string[], job: any) {
    const jobSkills = job.skills.map((js: any) => ({
      name: js.skill.name.toLowerCase(),
      importance: js.importance,
    }));

    const requiredSkills = jobSkills
      .filter((s: any) => s.importance === 'REQUIRED')
      .map((s: any) => s.name);
    const preferredSkills = jobSkills
      .filter((s: any) => s.importance === 'PREFERRED')
      .map((s: any) => s.name);

    const resumeSkillNames = resumeSkills.map((s) => s.toLowerCase());

    const matchedRequired = requiredSkills.filter((s: string) =>
      resumeSkillNames.includes(s)
    );
    const matchedPreferred = preferredSkills.filter((s: string) =>
      resumeSkillNames.includes(s)
    );

    let score = 0;
    if (requiredSkills.length > 0) {
      score += (matchedRequired.length / requiredSkills.length) * 70;
    }
    if (preferredSkills.length > 0) {
      score += (matchedPreferred.length / preferredSkills.length) * 30;
    }

    const matchPercentage = Math.round(Math.min(score, 100));

    const strengths = matchedRequired.length > 0 
      ? matchedRequired 
      : matchedPreferred.slice(0, 3);

    const missingSkills = requiredSkills
      .filter((s: string) => !resumeSkillNames.includes(s))
      .concat(
        preferredSkills.filter((s: string) => !resumeSkillNames.includes(s))
      );

    return {
      matchPercentage,
      strengths: strengths.slice(0, 5),
      missingSkills: missingSkills.slice(0, 10),
      explanation: this.generateExplanation(
        matchPercentage,
        strengths,
        missingSkills,
        job.title
      ),
      details: {
        required: {
          matched: matchedRequired.length,
          total: requiredSkills.length,
          skills: requiredSkills,
        },
        preferred: {
          matched: matchedPreferred.length,
          total: preferredSkills.length,
          skills: preferredSkills,
        },
      },
    };
  }

  private generateExplanation(
    score: number,
    strengths: string[],
    missingSkills: string[],
    jobTitle: string
  ): string {
    if (score >= 80) {
      return `Strong match for ${jobTitle}! You have ${strengths.length} key skills that align perfectly.`;
    } else if (score >= 60) {
      return `Good potential for ${jobTitle}. Consider developing ${missingSkills.slice(0, 3).join(', ')} to increase your match.`;
    } else if (score >= 40) {
      return `You have some relevant skills for ${jobTitle}. Focus on ${missingSkills.slice(0, 3).join(', ')} to improve your fit.`;
    } else {
      return `This role requires skills you may not have yet. Consider gaining experience in ${missingSkills.slice(0, 5).join(', ')}.`;
    }
  }
}