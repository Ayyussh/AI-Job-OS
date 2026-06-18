import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Match a resume against all jobs with pagination and batching
   */
  async matchResumeWithAllJobs(
    resumeId: string,
    useAI: boolean = true,
    complexity: 'simple' | 'moderate' | 'complex' = 'moderate',
    limit: number = 20,
    page: number = 1,
  ) {
    const startTime = Date.now();
    this.logger.log(`Starting match for resume: ${resumeId}`);

    try {
      // 1. Find the resume
      const resume = await this.prisma.resume.findUnique({
        where: { id: resumeId },
      });

      if (!resume) {
        throw new NotFoundException(`Resume with ID ${resumeId} not found`);
      }

      this.logger.log(`Resume found: ${resume.fileName}`);
      this.logger.log(
        `Resume skills: ${(resume.parsedSkills as string[])?.join(', ') || 'none'}`,
      );

      // 2. Get total job count for pagination
      const totalJobs = await this.prisma.job.count({
        where: { status: 'PUBLISHED' },
      });

      this.logger.log(`Total jobs in database: ${totalJobs}`);

      if (totalJobs === 0) {
        return {
          resumeId,
          totalJobs: 0,
          aiUsed: false,
          matchedJobs: [],
          message: 'No jobs found in database. Please scrape jobs first!',
          pagination: {
            page,
            limit,
            totalPages: 0,
          },
        };
      }

      // 3. Get jobs with pagination
      const skip = (page - 1) * limit;
      const jobs = await this.prisma.job.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          skills: {
            include: { skill: true },
          },
          company: true,
        },
        take: limit,
        skip: skip,
        orderBy: { postedAt: 'desc' },
      });

      this.logger.log(`Processing ${jobs.length} jobs (page ${page})`);

      // 4. Check AI availability
      let aiAvailable = false;
      if (useAI) {
        try {
          const status = await this.aiService.checkOllamaStatus();
          aiAvailable = status.running;
          this.logger.log(
            `AI status: ${aiAvailable ? 'available' : 'not available'}`,
          );
        } catch (error) {
          this.logger.warn('AI check failed, using keyword-only matching');
        }
      }

      // 5. Process jobs in batches to avoid timeout
      const resumeSkills = (resume.parsedSkills as string[]) || [];
      const results: any[] = [];
      const batchSize = 5;

      for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);
        this.logger.log(
          `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)}`,
        );

        const batchResults = await Promise.all(
          batch.map(async (job) => {
            try {
              const match = await this.matchJob(
                resumeSkills,
                resume.content,
                job,
                aiAvailable,
                complexity,
              );
              return {
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
              };
            } catch (err: any) {
              this.logger.error(
                `Match failed for job ${job.id}: ${err.message}`,
              );
              return null;
            }
          }),
        );

        // Filter out null results and add to results
        results.push(
          ...batchResults.filter((r): r is NonNullable<typeof r> => r !== null),
        );
      }

      // 6. Sort by match percentage (highest first)
      results.sort((a, b) => b.matchPercentage - a.matchPercentage);

      const totalTime = Date.now() - startTime;
      this.logger.log(
        `Matching completed in ${totalTime}ms for ${results.length} jobs`,
      );

      // 7. Return results with pagination info
      return {
        resumeId,
        totalJobs,
        aiUsed: aiAvailable,
        matchedJobs: results,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalJobs / limit),
        },
        processingTime: totalTime,
      };
    } catch (err: any) {
      this.logger.error(`Match all failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Match a single job against a resume
   */
  async matchSingleJob(
    resumeId: string,
    jobId: string,
    useAI: boolean = true,
    complexity: 'simple' | 'moderate' | 'complex' = 'moderate',
  ) {
    try {
      const [resume, job] = await Promise.all([
        this.prisma.resume.findUnique({
          where: { id: resumeId },
        }),
        this.prisma.job.findUnique({
          where: { id: jobId },
          include: {
            skills: {
              include: { skill: true },
            },
            company: true,
          },
        }),
      ]);

      if (!resume) {
        throw new NotFoundException(`Resume with ID ${resumeId} not found`);
      }

      if (!job) {
        throw new NotFoundException(`Job with ID ${jobId} not found`);
      }

      const resumeSkills = (resume.parsedSkills as string[]) || [];

      let aiAvailable = false;
      if (useAI) {
        try {
          const status = await this.aiService.checkOllamaStatus();
          aiAvailable = status.running;
        } catch (error) {
          this.logger.warn('AI check failed, using keyword-only matching');
        }
      }

      const match = await this.matchJob(
        resumeSkills,
        resume.content,
        job,
        aiAvailable,
        complexity,
      );

      return {
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
        aiUsed: aiAvailable,
      };
    } catch (err: any) {
      this.logger.error(`Single match failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Core matching logic for a single job
   */
  private async matchJob(
    resumeSkills: string[],
    resumeText: string,
    job: any,
    useAI: boolean,
    complexity: 'simple' | 'moderate' | 'complex' = 'moderate',
  ) {
    // 1. Extract job skills
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

    // 2. Keyword matching
    const matchedRequired = requiredSkills.filter((s: string) =>
      resumeSkillNames.includes(s),
    );
    const matchedPreferred = preferredSkills.filter((s: string) =>
      resumeSkillNames.includes(s),
    );

    // 3. Calculate keyword score (70% required, 30% preferred)
    let keywordScore = 0;
    if (requiredSkills.length > 0) {
      keywordScore += (matchedRequired.length / requiredSkills.length) * 70;
    }
    if (preferredSkills.length > 0) {
      keywordScore += (matchedPreferred.length / preferredSkills.length) * 30;
    }
    keywordScore = Math.round(Math.min(keywordScore, 100));

    // 4. Identify missing skills
    const missingSkills = requiredSkills
      .filter((s: string) => !resumeSkillNames.includes(s))
      .concat(
        preferredSkills.filter((s: string) => !resumeSkillNames.includes(s)),
      );

    // 5. Get strengths (skills the candidate has)
    const strengths =
      matchedRequired.length > 0
        ? matchedRequired
        : matchedPreferred.length > 0
          ? matchedPreferred.slice(0, 3)
          : [];

    // 6. AI refinement (if enabled)
    let finalScore = keywordScore;
    let explanation = '';
    let improvements: string[] = [];

    if (useAI) {
      try {
        const aiRefinement = await this.aiService.refineMatch(
          resumeText,
          job.description,
          job.title,
          keywordScore,
          strengths,
          missingSkills,
          complexity,
        );

        finalScore = aiRefinement.adjustedScore;
        explanation = aiRefinement.explanation;
        strengths.push(
          ...aiRefinement.strengths.filter(
            (s: string) => !strengths.includes(s),
          ),
        );
        improvements = aiRefinement.improvements;
      } catch (err: any) {
        this.logger.error(
          `AI refinement failed for job ${job.id}: ${err.message}`,
        );
        explanation = this.generateExplanation(
          keywordScore,
          strengths,
          missingSkills,
          job.title,
        );
      }
    } else {
      explanation = this.generateExplanation(
        keywordScore,
        strengths,
        missingSkills,
        job.title,
      );
    }

    // 7. Return match result
    return {
      matchPercentage: Math.min(finalScore, 100),
      strengths: strengths.slice(0, 5),
      missingSkills: missingSkills.slice(0, 10),
      explanation,
      improvements: improvements.slice(0, 5),
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

  /**
   * Generate a human-readable explanation
   */
  private generateExplanation(
    score: number,
    strengths: string[],
    missingSkills: string[],
    jobTitle: string,
  ): string {
    if (score >= 80) {
      return `Strong match for ${jobTitle}! Your skills in ${strengths.slice(0, 3).join(', ')} align perfectly with the requirements.`;
    } else if (score >= 60) {
      return `Good potential for ${jobTitle}. You have ${strengths.length} matching skills. Consider developing ${missingSkills.slice(0, 3).join(', ')} to strengthen your application.`;
    } else if (score >= 40) {
      return `You have some relevant skills for ${jobTitle}. Focus on learning ${missingSkills.slice(0, 3).join(', ')} to improve your fit.`;
    } else if (score > 0) {
      return `Limited match for ${jobTitle}. Consider gaining experience in ${missingSkills.slice(0, 5).join(', ')}.`;
    } else {
      return `No significant skill overlap with ${jobTitle}. This role requires different expertise.`;
    }
  }

  /**
   * Get match statistics for a resume
   */
  async getMatchStats(resumeId: string) {
    const matches = await this.prisma.matchResult.findMany({
      where: { resumeId },
      include: {
        job: {
          select: {
            title: true,
            company: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { matchPercentage: 'desc' },
    });

    const totalMatches = matches.length;
    const averageScore =
      totalMatches > 0
        ? Math.round(
            matches.reduce((acc, m) => acc + m.matchPercentage, 0) /
              totalMatches,
          )
        : 0;

    // Filter out matches where job is null
    const validMatches = matches.filter((m) => m.job !== null);

    const topMatches = validMatches.slice(0, 5).map((m) => ({
      jobTitle: m.job?.title || 'Unknown Job',
      company: m.job?.company?.name || 'Unknown Company',
      score: m.matchPercentage,
    }));

    return {
      totalMatches,
      averageScore,
      topMatches,
      matches: validMatches,
    };
  }
}
