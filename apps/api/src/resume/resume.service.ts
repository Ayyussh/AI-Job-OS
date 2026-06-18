import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async processResume(file: Express.Multer.File, userId?: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    try {
      const pdfData = await pdfParse(file.buffer);
      const extractedText = pdfData.text;

      // Use AI to extract ALL skills
      const extractedSkills = await this.extractSkillsWithAI(extractedText);

      const resume = await this.prisma.resume.create({
        data: {
          fileName: file.originalname,
          title: file.originalname.replace('.pdf', ''),
          content: extractedText,
          parsedSkills: extractedSkills,
          userId: userId || null,
        },
      });

      return {
        success: true,
        id: resume.id,
        fileName: file.originalname,
        pages: pdfData.numpages,
        textLength: pdfData.text.length,
        extractedSkills: extractedSkills,
        preview: pdfData.text.slice(0, 500),
        totalSkills: extractedSkills.length,
      };
    } catch (error: any) {
      this.logger.error(`Failed to process resume: ${error.message}`);
      throw new BadRequestException('Failed to process PDF file');
    }
  }

  private async extractSkillsWithAI(text: string): Promise<string[]> {
    try {
      const prompt = `
Extract ALL technical and professional skills from this resume text.

Resume Text:
${text.slice(0, 4000)}

Return ONLY a JSON array of unique skills found.
Include:
- Programming languages (Python, JavaScript, etc.)
- Frameworks (React, Django, etc.)
- Tools (Git, Docker, etc.)
- Databases (PostgreSQL, MongoDB, etc.)
- Soft skills (Leadership, Communication, etc.)
- Any technology or tool mentioned

Format: ["skill1", "skill2", "skill3"]

Return ONLY the JSON array, no other text.
`;

      const response = await this.callOllamaForSkills(prompt);
      
      try {
        const skills = JSON.parse(response);
        if (Array.isArray(skills) && skills.length > 0) {
          this.logger.log(`AI extracted ${skills.length} skills from resume`);
          return skills;
        }
      } catch (e) {
        this.logger.warn('Failed to parse AI skill extraction, falling back to keyword matching');
      }

      return this.extractSkillsWithKeywords(text);
    } catch (error: any) {
      this.logger.error(`AI skill extraction failed: ${error.message}`);
      return this.extractSkillsWithKeywords(text);
    }
  }

  private extractSkillsWithKeywords(text: string): string[] {
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
      'node.js', 'nestjs', 'next.js', 'postgresql', 'mysql', 'mongodb',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'ci/cd',
      'agile', 'scrum', 'leadership', 'communication', 'problem solving',
      'teamwork', 'html', 'css', 'sass', 'tailwind', 'bootstrap',
      'redux', 'graphql', 'rest api', 'microservices', 'serverless',
      'jenkins', 'github actions', 'redis', 'go', 'rust', 'c++', 'c#',
      'php', 'ruby', 'swift', 'kotlin', 'flutter', 'react native',
      'machine learning', 'ai', 'llm', 'nlp', 'computer vision',
    ];
    
    const lowerText = text.toLowerCase();
    const foundSkills = new Set<string>();
    
    for (const skill of commonSkills) {
      const regex = new RegExp(`\\b${this.escapeRegex(skill)}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundSkills.add(skill);
      }
    }
    
    return Array.from(foundSkills);
  }

  private async callOllamaForSkills(prompt: string): Promise<string> {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3',
          prompt: prompt,
          stream: false,
          temperature: 0.1,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error: any) {
      this.logger.error('Ollama call failed, using fallback');
      throw error;
    }
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async getAllResumes() {
    const resumes = await this.prisma.resume.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return resumes.map(resume => ({
      id: resume.id,
      fileName: resume.fileName,
      title: resume.title,
      extractedSkills: resume.parsedSkills as string[] || [],
      createdAt: resume.createdAt,
      matchCount: 0,
    }));
  }

  async getResumeById(id: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      throw new BadRequestException('Resume not found');
    }

    return {
      id: resume.id,
      fileName: resume.fileName,
      title: resume.title,
      content: resume.content,
      extractedSkills: resume.parsedSkills as string[],
      createdAt: resume.createdAt,
    };
  }

  async deleteResume(id: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      throw new BadRequestException('Resume not found');
    }

    await this.prisma.resume.delete({
      where: { id },
    });

    return { success: true };
  }
}