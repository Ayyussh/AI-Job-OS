import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AIModel = 'llama3.2' | 'qwen3' | 'deepseek-r1';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chat with AI for job-related queries
   */
  async chatWithAI(
    message: string,
    context: { skills?: string[] },
  ): Promise<string> {
    this.logger.log(`Chat: ${message}`);

    try {
      const systemPrompt = `
You are an AI job assistant helping a developer find their dream job.
Current User Skills: ${context.skills?.join(', ') || 'Unknown'}

Provide helpful, actionable advice about job searching, career growth, and skill development.
Be conversational but concise. If asked about specific jobs, provide realistic recommendations.
`;

      const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
          stream: false,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error: any) {
      this.logger.error(`Chat failed: ${error.message}`);
      return "I'm having trouble connecting to my AI brain. Please try again later.";
    }
  }

  /**
   * Check if Ollama is running
   */
  async checkOllamaStatus(): Promise<{ running: boolean; models: string[] }> {
    try {
      const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
      const response = await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        return { running: false, models: [] };
      }

      const data = await response.json();
      return {
        running: true,
        models: data.models?.map((m: any) => m.name) || [],
      };
    } catch {
      return { running: false, models: [] };
    }
  }

  /**
   * Get the best model based on context
   */
  private getBestModel(
    complexity: 'simple' | 'moderate' | 'complex' = 'moderate',
  ): AIModel {
    switch (complexity) {
      case 'simple':
        return 'llama3.2'; // Fast and cheap
      case 'complex':
        return 'deepseek-r1'; // Best reasoning
      case 'moderate':
      default:
        return 'qwen3'; // Best balance
    }
  }

  /**
   * Refine match score using AI semantic analysis
   */
  async refineMatch(
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    keywordScore: number,
    matchedSkills: string[],
    missingSkills: string[],
    complexity: 'simple' | 'moderate' | 'complex' = 'moderate',
  ): Promise<{
    adjustedScore: number;
    explanation: string;
    strengths: string[];
    improvements: string[];
  }> {
    const model = this.getBestModel(complexity);

    try {
      // Call Ollama for semantic analysis
      const analysis = await this.callOllama(
        resumeText,
        jobDescription,
        jobTitle,
        matchedSkills,
        missingSkills,
        model,
      );

      // Combine keyword score with AI score (weighted)
      // Give more weight to AI for complex analysis
      const aiWeight = complexity === 'complex' ? 0.5 : 0.4;
      const adjustedScore = Math.round(
        keywordScore * (1 - aiWeight) + analysis.aiScore * aiWeight,
      );

      return {
        adjustedScore: Math.min(adjustedScore, 100),
        explanation: analysis.explanation,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`AI refinement failed (${model}): ${errorMessage}`);

      // Try fallback to simpler model if complex failed
      if (model !== 'llama3.2') {
        this.logger.log('Falling back to llama3.2...');
        try {
          const fallbackAnalysis = await this.callOllama(
            resumeText,
            jobDescription,
            jobTitle,
            matchedSkills,
            missingSkills,
            'llama3.2',
          );
          return {
            adjustedScore: Math.min(
              Math.round(keywordScore * 0.6 + fallbackAnalysis.aiScore * 0.4),
              100,
            ),
            explanation: fallbackAnalysis.explanation,
            strengths: fallbackAnalysis.strengths,
            improvements: fallbackAnalysis.improvements,
          };
        } catch (fallbackErr) {
          this.logger.error('Fallback also failed');
        }
      }

      // Ultimate fallback to keyword-only
      return {
        adjustedScore: keywordScore,
        explanation: this.generateFallbackExplanation(
          keywordScore,
          matchedSkills,
          missingSkills,
          jobTitle,
        ),
        strengths: matchedSkills.slice(0, 5),
        improvements: missingSkills
          .slice(0, 5)
          .map((s) => `Consider learning ${s}`),
      };
    }
  }

  private async callOllama(
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    matchedSkills: string[],
    missingSkills: string[],
    model: AIModel = 'qwen3',
  ): Promise<{
    aiScore: number;
    explanation: string;
    strengths: string[];
    improvements: string[];
  }> {
    // Use different prompts based on model for best results
    let prompt: string;

    switch (model) {
      case 'deepseek-r1':
        prompt = this.buildDeepSeekPrompt(
          resumeText,
          jobDescription,
          jobTitle,
          matchedSkills,
          missingSkills,
        );
        break;
      case 'llama3.2':
        prompt = this.buildSimplePrompt(
          resumeText,
          jobDescription,
          jobTitle,
          matchedSkills,
          missingSkills,
        );
        break;
      case 'qwen3':
      default:
        prompt = this.buildQwenPrompt(
          resumeText,
          jobDescription,
          jobTitle,
          matchedSkills,
          missingSkills,
        );
    }

    try {
      const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data.response);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Ollama call failed (${model}): ${errorMessage}`);
      throw err;
    }
  }

  private buildSimplePrompt(
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    matchedSkills: string[],
    missingSkills: string[],
  ): string {
    const truncatedResume = resumeText.slice(0, 2000);
    const truncatedJob = jobDescription.slice(0, 1500);

    return `Analyze resume vs job. Return JSON only.
Job: ${jobTitle}
Description: ${truncatedJob}
Resume: ${truncatedResume}
Matches: ${matchedSkills.join(', ')}
Missing: ${missingSkills.join(', ')}

JSON: {"aiScore": number 0-100, "explanation": string, "strengths": string[], "improvements": string[]}`;
  }

  private buildQwenPrompt(
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    matchedSkills: string[],
    missingSkills: string[],
  ): string {
    const truncatedResume = resumeText.slice(0, 3000);
    const truncatedJob = jobDescription.slice(0, 2000);

    return `You are an expert hiring manager. Analyze this candidate's resume against the job description.

Job Title: ${jobTitle}
Job Description: ${truncatedJob}

Resume: ${truncatedResume}

Keyword Matches: ${matchedSkills.join(', ')}
Keyword Gaps: ${missingSkills.join(', ')}

Provide a comprehensive JSON analysis with:
1. "aiScore": 0-100 - Overall fit based on semantic understanding
2. "explanation": 2-3 sentences - Why this candidate fits or doesn't fit
3. "strengths": 3-5 specific strengths from their experience
4. "improvements": 3-5 specific, actionable suggestions

Return ONLY valid JSON.`;
  }

  private buildDeepSeekPrompt(
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    matchedSkills: string[],
    missingSkills: string[],
  ): string {
    const truncatedResume = resumeText.slice(0, 3500);
    const truncatedJob = jobDescription.slice(0, 2500);

    return `You are a senior hiring manager and career coach with 20 years of experience. Provide a deep, nuanced analysis of this candidate.

Job Title: ${jobTitle}
Job Description: ${truncatedJob}

Resume: ${truncatedResume}

Technical Keyword Matches: ${matchedSkills.join(', ')}
Technical Gaps: ${missingSkills.join(', ')}

Provide a thorough analysis including:
1. "aiScore": 0-100 - Holistic fit score considering experience, culture, and growth potential
2. "explanation": 3-4 sentences - Detailed analysis of fit with specific reasons
3. "strengths": 4-5 specific strengths with context from their experience
4. "improvements": 4-5 detailed, actionable improvement suggestions

Return ONLY valid JSON with these fields.`;
  }

  private parseAIResponse(response: string): {
    aiScore: number;
    explanation: string;
    strengths: string[];
    improvements: string[];
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        aiScore: Math.min(Math.max(parsed.aiScore || 50, 0), 100),
        explanation: parsed.explanation || 'AI analysis complete.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements)
          ? parsed.improvements
          : [],
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to parse AI response: ${errorMessage}`);
      return {
        aiScore: 50,
        explanation:
          'AI analysis could not be completed. Using keyword matching.',
        strengths: [],
        improvements: [],
      };
    }
  }

  private generateFallbackExplanation(
    score: number,
    strengths: string[],
    missingSkills: string[],
    jobTitle: string,
  ): string {
    if (score >= 80) {
      return `Strong match for ${jobTitle}! Your skills align well with the requirements.`;
    } else if (score >= 60) {
      return `Good potential for ${jobTitle}. Consider developing ${missingSkills.slice(0, 3).join(', ')} to increase your match.`;
    } else if (score >= 40) {
      return `You have some relevant skills for ${jobTitle}. Focus on ${missingSkills.slice(0, 3).join(', ')} to improve your fit.`;
    } else {
      return `This role requires skills you may not have yet. Consider gaining experience in ${missingSkills.slice(0, 5).join(', ')}.`;
    }
  }

  /**
   * Generate improvement recommendations based on missing skills
   */
  async generateRecommendations(
    resumeText: string,
    jobTitle: string,
    missingSkills: string[],
    model: AIModel = 'qwen3',
  ): Promise<string[]> {
    if (missingSkills.length === 0) {
      return [];
    }

    try {
      const prompt = `
You are a career coach. The candidate is applying for "${jobTitle}" but is missing: ${missingSkills.join(', ')}.

Resume: ${resumeText.slice(0, 500)}

Provide 3 specific, actionable recommendations for skill development.
Return as JSON array: ["recommendation1", "recommendation2", "recommendation3"]
`;

      const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          temperature: 0.5,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const jsonMatch = data.response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return missingSkills.map((s) => `Gain experience in ${s}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Recommendations failed: ${errorMessage}`);
      return missingSkills.map((s) => `Consider developing skills in ${s}`);
    }
  }

  /**
   * Test all models and return performance metrics
   */
  // Replace the testModels method with this:
  async testModels(): Promise<
    Array<{
      model: string;
      status: 'available' | 'unavailable';
      responseTime?: number;
    }>
  > {
    const models = ['llama3.2', 'qwen3', 'deepseek-r1'];
    const results: Array<{
      model: string;
      status: 'available' | 'unavailable';
      responseTime?: number;
    }> = [];

    for (const model of models) {
      try {
        const start = Date.now();
      const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
      const response = await fetch(`${ollamaUrl}/api/generate`, {
          body: JSON.stringify({
            model: model,
            prompt: 'Say "OK" in one word.',
            stream: false,
            max_tokens: 5,
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const end = Date.now();
          results.push({
            model,
            status: 'available',
            responseTime: end - start,
          });
        } else {
          results.push({ model, status: 'unavailable' });
        }
      } catch {
        results.push({ model, status: 'unavailable' });
      }
    }

    return results;
  }
}
