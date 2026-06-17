export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  endpoints: {
    jobs: '/jobs',
    jobDetails: (slug: string) => `/jobs/${slug}`,
    sources: '/jobs/sources',
    skills: '/jobs/skills',
    resumeUpload: '/resume/upload',
  },
  timeout: 30000,
  retries: 3,
} as const;