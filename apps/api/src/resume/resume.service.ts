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

    const resume = await this.prisma.resume.create({
      data: {
        fileName: file.originalname,
        content: pdf.text,
      },
    });

    return {
      id: resume.id,
      filename: file.originalname,
      size: file.size,
      pages: pdf.numpages,
      textLength: pdf.text.length,
      preview: pdf.text.slice(0, 1000),
    };
  }
}