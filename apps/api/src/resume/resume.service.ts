import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async processResume(file: Express.Multer.File) {
    const pdf = await pdfParse(file.buffer);

    // Simple skill extraction (will be enhanced later)
    const extractedSkills = this.extractSkills(pdf.text);

    const resume = await this.prisma.resume.create({
      data: {
        fileName: file.originalname,
        content: pdf.text,
        parsedSkills: extractedSkills,
      },
    });

    return {
      id: resume.id,
      fileName: file.originalname,
      pages: pdf.numpages,
      textLength: pdf.text.length,
      extractedSkills: extractedSkills,
      preview: pdf.text.slice(0, 500),
    };
  }

  // Add this method
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
      matchCount: 0, // Will be populated later
    }));
  }

  // Simple skill extraction (enhance later with AI)
  private extractSkills(text: string): string[] {
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
      'node.js', 'nestjs', 'next.js', 'postgresql', 'mysql', 'mongodb',
      'docker', 'kubernetes', 'aws', 'git', 'ci/cd', 'agile', 'scrum',
      'leadership', 'communication', 'problem solving', 'teamwork'
    ];
    
    const lowerText = text.toLowerCase();
    const foundSkills = new Set<string>();
    
    for (const skill of commonSkills) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundSkills.add(skill);
      }
    }
    
    return Array.from(foundSkills);
  }
}