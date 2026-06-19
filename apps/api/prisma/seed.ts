import {
  ApplicationStatus,
  ExperienceLevel,
  JobType,
  PrismaClient,
  SalaryPeriod,
  SkillImportance,
  UserRole,
  WorkMode,
} from '@prisma/client';

const prisma = new PrismaClient();

// All portals - both working scrapers and external search portals
const sources = [
  // Working scrapers (4 sources)
  { name: 'Remote OK', websiteUrl: 'https://remoteok.com', kind: 'remote', active: true },
  { name: 'Remotive', websiteUrl: 'https://remotive.com', kind: 'remotive', active: true },
  { name: 'We Work Remotely', websiteUrl: 'https://weworkremotely.com', kind: 'weworkremotely', active: true },
  { name: 'Himalayas', websiteUrl: 'https://himalayas.app/jobs', kind: 'himalayas', active: true },
  
  // External search portals (no scraping, just search links)
  { name: 'LinkedIn', websiteUrl: 'https://linkedin.com', kind: 'external', active: true },
  { name: 'Indeed', websiteUrl: 'https://indeed.com', kind: 'external', active: true },
  { name: 'Wellfound', websiteUrl: 'https://wellfound.com', kind: 'external', active: true },
  { name: 'Glassdoor', websiteUrl: 'https://glassdoor.com', kind: 'external', active: true },
  { name: 'Naukri', websiteUrl: 'https://naukri.com', kind: 'external', active: true },
  { name: 'Cutshort', websiteUrl: 'https://cutshort.io', kind: 'external', active: true },
  { name: 'YC Jobs', websiteUrl: 'https://ycombinator.com', kind: 'external', active: true },
  { name: 'Monster', websiteUrl: 'https://monster.com', kind: 'external', active: true },
  { name: 'ZipRecruiter', websiteUrl: 'https://ziprecruiter.com', kind: 'external', active: true },
  { name: 'CareerBuilder', websiteUrl: 'https://careerbuilder.com', kind: 'external', active: true },
  { name: 'SimplyHired', websiteUrl: 'https://simplyhired.com', kind: 'external', active: true },
  { name: 'AngelList', websiteUrl: 'https://angel.co', kind: 'external', active: true },
  { name: 'FlexJobs', websiteUrl: 'https://flexjobs.com', kind: 'external', active: true },
  { name: 'Dice', websiteUrl: 'https://dice.com', kind: 'external', active: true },
  { name: 'Foundit', websiteUrl: 'https://foundit.in', kind: 'external', active: true },
  { name: 'Instahyre', websiteUrl: 'https://instahyre.com', kind: 'external', active: true },
  { name: 'Hirect', websiteUrl: 'https://hirect.in', kind: 'external', active: true },
  { name: 'Google Jobs', websiteUrl: 'https://www.google.com', kind: 'google', active: true },
];

const companies = [
  {
    name: 'BrightLoop AI',
    slug: 'brightloop-ai',
    website: 'https://brightloop.ai',
    description: 'AI workflow products for modern recruiting teams.',
    headquarters: 'Bengaluru, India',
    industries: ['Artificial Intelligence', 'Hiring'],
    size: '51-200',
    verified: true,
  },
  {
    name: 'Northstar Labs',
    slug: 'northstar-labs',
    website: 'https://northstarlabs.example',
    description: 'Design-led marketplace tooling for talent teams.',
    headquarters: 'Bengaluru, India',
    industries: ['Marketplace', 'Design'],
    size: '11-50',
    verified: true,
  },
  {
    name: 'Atlas Payroll',
    slug: 'atlas-payroll',
    website: 'https://atlaspayroll.example',
    description: 'Global payroll infrastructure for remote companies.',
    headquarters: 'Remote',
    industries: ['Fintech', 'HR Tech'],
    size: '201-500',
    verified: true,
  },
  {
    name: 'HireSignal',
    slug: 'hiresignal',
    website: 'https://hiresignal.example',
    description: 'Recruiter intelligence for high-volume hiring.',
    headquarters: 'Mumbai, India',
    industries: ['Recruiting', 'Analytics'],
    size: '51-200',
    verified: false,
  },
  {
    name: 'Cloudlane',
    slug: 'cloudlane',
    website: 'https://cloudlane.example',
    description: 'Cloud operations tools for product engineering teams.',
    headquarters: 'Pune, India',
    industries: ['Developer Tools', 'Cloud'],
    size: '11-50',
    verified: true,
  },
  {
    name: 'Horizon AI',
    slug: 'horizon-ai',
    website: 'https://horizonai.example',
    description: 'Applied AI products for operations-heavy businesses.',
    headquarters: 'Delhi NCR, India',
    industries: ['Artificial Intelligence', 'Operations'],
    size: '51-200',
    verified: true,
  },
  {
    name: 'TalentGrid',
    slug: 'talentgrid',
    website: 'https://talentgrid.example',
    description: 'Candidate relationship management for growing companies.',
    headquarters: 'Hyderabad, India',
    industries: ['SaaS', 'Hiring'],
    size: '201-500',
    verified: true,
  },
  {
    name: 'RemoteNest',
    slug: 'remote-nest',
    website: 'https://remotenest.example',
    description: 'Async-first teams building collaboration infrastructure.',
    headquarters: 'Remote',
    industries: ['Collaboration', 'Remote Work'],
    size: '11-50',
    verified: false,
  },
];

const skills = [
  'Analytics',
  'Design Systems',
  'Figma',
  'Go',
  'Kubernetes',
  'LLM',
  'NestJS',
  'Next.js',
  'Node.js',
  'PostgreSQL',
  'Prisma',
  'Product Strategy',
  'Python',
  'Queues',
  'React',
  'Redis',
  'Research',
  'SEO',
  'TypeScript',
  
  // ===== ADDED SKILLS FOR SEED =====
  // Core Frontend
  'JavaScript',
  'CSS',
  'HTML5',
  'HTML',
  'Redux',
  'Redux Toolkit',
  'Context API',
  'Tailwind CSS',
  'Ant Design',
  'Material UI',
  'Responsive Design',
  
  // Backend
  'Express.js',
  'MongoDB',
  'NoSQL',
  'SQL',
  'REST API',
  'GraphQL',
  'Microservices',
  
  // DevOps
  'Docker',
  'Kubernetes',
  'CI/CD',
  'Git',
  'GitHub',
  
  // AI
  'AI',
  'Ollama',
  'Embeddings',
  'Vector Search',
  'Prompt Engineering',
  
  // General
  'Agile',
  'Scrum',
  'Leadership',
  'Communication',
  'Problem Solving',
  'Teamwork',
  'Full Stack',
  'Code Review',
];

const jobs = [
  {
    title: 'Remote Backend Engineer',
    slug: 'remote-backend-engineer-atlas-payroll',
    companySlug: 'atlas-payroll',
    sourceName: 'Remote OK',
    sourceJobId: 'remoteok-atlas-001',
    location: 'Remote, Worldwide',
    city: null,
    country: null,
    workMode: WorkMode.REMOTE,
    jobType: JobType.CONTRACT,
    experienceLevel: ExperienceLevel.SENIOR,
    minSalary: 75,
    maxSalary: 110,
    currency: 'USD',
    salaryPeriod: SalaryPeriod.HOUR,
    applyUrl: 'https://remoteok.com/remote-jobs/atlas-backend',
    isFeatured: false,
    postedAt: daysAgo(1),
    description:
      'Build reliable integrations, background processing, and billing workflows for global teams.',
    responsibilities: [
      'Design API integrations for payroll providers.',
      'Improve queue processing and operational observability.',
      'Support reliability reviews for payment-critical systems.',
    ],
    requirements: ['Deep Node.js experience.', 'Comfort with Redis and background jobs.'],
    benefits: ['Async remote culture.', 'Global contractor setup.', 'Paid recharge days.'],
    skillNames: ['Node.js', 'Queues', 'Redis', 'Prisma', 'PostgreSQL'],
  },
  {
    title: 'Data Engineer',
    slug: 'data-engineer-remotenest',
    companySlug: 'remote-nest',
    sourceName: 'Remotive',
    sourceJobId: 'remotive-remotenest-001',
    location: 'Remote, Europe and Asia',
    city: null,
    country: null,
    workMode: WorkMode.REMOTE,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.MID,
    minSalary: 70000,
    maxSalary: 105000,
    currency: 'USD',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://remotive.com/remote-jobs/data/remotenest-data-engineer',
    isFeatured: false,
    postedAt: daysAgo(6),
    description:
      'Build trusted data pipelines for collaboration analytics and customer reporting.',
    responsibilities: [
      'Model product analytics data for self-serve reporting.',
      'Build resilient batch and streaming pipelines.',
      'Partner with product teams on metric definitions.',
    ],
    requirements: ['Strong SQL and Python skills.', 'Experience owning production data pipelines.'],
    benefits: ['Remote setup budget.', 'Async schedule.', 'Paid team retreats.'],
    skillNames: ['Python', 'PostgreSQL', 'Analytics', 'Queues'],
  },
  {
    title: 'Senior Frontend Engineer',
    slug: 'senior-frontend-engineer-horizon-ai',
    companySlug: 'horizon-ai',
    sourceName: 'We Work Remotely',
    sourceJobId: 'weworkremotely-horizon-001',
    location: 'Remote, Worldwide',
    city: null,
    country: null,
    workMode: WorkMode.REMOTE,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.SENIOR,
    minSalary: 90000,
    maxSalary: 130000,
    currency: 'USD',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://weworkremotely.com/remote-jobs/horizon-ai-senior-frontend-engineer',
    isFeatured: true,
    postedAt: daysAgo(2),
    description:
      'Build customer-facing product experiences for AI workflow tooling and analytics.',
    responsibilities: [
      'Develop polished interfaces for complex data dashboards.',
      'Collaborate with design and product to improve usability.',
      'Ship high-performance React applications at scale.',
    ],
    requirements: ['Strong React and frontend architecture experience.', 'Experience with modern CSS-in-JS or design systems.'],
    benefits: ['Remote-first team.', 'Flexible hours.', 'Professional development stipend.'],
    skillNames: ['React', 'Next.js', 'TypeScript', 'Design Systems'],
  },
  {
    title: 'AI Product Manager',
    slug: 'ai-product-manager-talentgrid',
    companySlug: 'talentgrid',
    sourceName: 'Himalayas',
    sourceJobId: 'himalayas-talentgrid-001',
    location: 'Remote, Europe and Asia',
    city: null,
    country: null,
    workMode: WorkMode.REMOTE,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.SENIOR,
    minSalary: 95000,
    maxSalary: 130000,
    currency: 'USD',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://himalayas.app/jobs/talentgrid-ai-product-manager',
    isFeatured: false,
    postedAt: daysAgo(3),
    description:
      'Own product direction for AI sourcing and matching workflows across global recruiter teams.',
    responsibilities: [
      'Define product strategy and roadmap for AI-powered hiring tools.',
      'Work closely with engineering on near-term delivery.',
      'Measure product adoption with recruiter success metrics.',
    ],
    requirements: ['Experience shipping AI or marketplace products.', 'Strong stakeholder communication skills.'],
    benefits: ['Remote-first culture.', 'Stock option opportunity.', 'Learning budgets.'],
    skillNames: ['Product Strategy', 'AI', 'Research', 'Analytics'],
  },
];

async function main() {
  const sourceByName = new Map<string, string>();
  const skillByName = new Map<string, string>();
  const jobBySlug = new Map<string, string>();

  // Seed all sources (including external portals)
  for (const source of sources) {
    const savedSource = await prisma.jobSource.upsert({
      where: { name: source.name },
      update: source,
      create: source,
    });

    sourceByName.set(savedSource.name, savedSource.id);
  }

  for (const company of companies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      update: company,
      create: company,
    });
  }

  for (const skillName of skills) {
    const savedSkill = await prisma.skill.upsert({
      where: { slug: slugify(skillName) },
      update: { name: skillName },
      create: {
        name: skillName,
        slug: slugify(skillName),
      },
    });

    skillByName.set(savedSkill.name, savedSkill.id);
  }

  // Only create jobs for the 4 working scrapers
  const allowedSourceNames = new Set([
    'Remote OK',
    'Remotive',
    'We Work Remotely',
    'Himalayas',
  ]);

  for (const job of jobs.filter((job) => allowedSourceNames.has(job.sourceName))) {
    const savedJob = await prisma.job.upsert({
      where: { slug: job.slug },
      update: {
        title: job.title,
        description: job.description,
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        benefits: job.benefits,
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
        sourceJobId: job.sourceJobId,
        isFeatured: job.isFeatured,
        postedAt: job.postedAt,
        company: { connect: { slug: job.companySlug } },
        source: { connect: { name: job.sourceName } },
      },
      create: {
        title: job.title,
        slug: job.slug,
        description: job.description,
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        benefits: job.benefits,
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
        sourceJobId: job.sourceJobId,
        isFeatured: job.isFeatured,
        postedAt: job.postedAt,
        company: { connect: { slug: job.companySlug } },
        source: { connect: { name: job.sourceName } },
      },
    });

    jobBySlug.set(savedJob.slug, savedJob.id);

    await prisma.jobDescription.upsert({
      where: { jobId: savedJob.id },
      update: {
        title: job.title,
        company: companyName(job.companySlug),
        content: job.description,
      },
      create: {
        title: job.title,
        company: companyName(job.companySlug),
        content: job.description,
        job: { connect: { id: savedJob.id } },
      },
    });

    await prisma.jobSkill.deleteMany({
      where: { jobId: savedJob.id },
    });

    await prisma.jobSkill.createMany({
      data: job.skillNames.map((skillName, index) => ({
        jobId: savedJob.id,
        skillId: requiredSkillId(skillByName, skillName),
        importance: index < 3 ? SkillImportance.REQUIRED : SkillImportance.PREFERRED,
      })),
    });
  }

  const candidate = await prisma.user.upsert({
    where: { email: 'demo.candidate@aijobos.local' },
    update: {
      name: 'Demo Candidate',
      headline: 'Full stack engineer exploring AI product roles',
      location: 'Bengaluru, India',
      role: UserRole.CANDIDATE,
    },
    create: {
      email: 'demo.candidate@aijobos.local',
      name: 'Demo Candidate',
      headline: 'Full stack engineer exploring AI product roles',
      location: 'Bengaluru, India',
      role: UserRole.CANDIDATE,
    },
  });

  const profile = await prisma.candidateProfile.upsert({
    where: { userId: candidate.id },
    update: {
      title: 'Senior Full Stack Engineer',
      summary: 'TypeScript engineer with product, backend, and AI workflow experience.',
      yearsExperience: 6,
      preferredLocation: 'Remote or Bengaluru',
      openToRemote: true,
      minSalaryExpectation: 3500000,
      currency: 'INR',
    },
    create: {
      userId: candidate.id,
      title: 'Senior Full Stack Engineer',
      summary: 'TypeScript engineer with product, backend, and AI workflow experience.',
      yearsExperience: 6,
      preferredLocation: 'Remote or Bengaluru',
      openToRemote: true,
      minSalaryExpectation: 3500000,
      currency: 'INR',
    },
  });

  await prisma.candidateSkill.deleteMany({
    where: { profileId: profile.id },
  });

  await prisma.candidateSkill.createMany({
    data: ['TypeScript', 'Next.js', 'NestJS', 'PostgreSQL', 'Prisma', 'LLM'].map(
      (skillName, index) => ({
        profileId: profile.id,
        skillId: requiredSkillId(skillByName, skillName),
        level: 5 - Math.min(index, 2),
      }),
    ),
  });

  await prisma.jobAlert.upsert({
    where: { id: 'seed-alert-full-stack-remote' },
    update: {
      name: 'Remote full stack roles',
      keywords: 'full stack, next.js, nestjs, ai',
      location: 'Remote',
      workMode: WorkMode.REMOTE,
      jobType: JobType.FULL_TIME,
      active: true,
      userId: candidate.id,
    },
    create: {
      id: 'seed-alert-full-stack-remote',
      name: 'Remote full stack roles',
      keywords: 'full stack, next.js, nestjs, ai',
      location: 'Remote',
      workMode: WorkMode.REMOTE,
      jobType: JobType.FULL_TIME,
      userId: candidate.id,
    },
  });

  await saveCandidateActivity(candidate.id, jobBySlug);

  console.log(
    `Seeded ${sources.length} sources, ${companies.length} companies, ${skills.length} skills, and ${jobs.length} jobs.`,
  );
}

async function saveCandidateActivity(userId: string, jobBySlug: Map<string, string>) {
  const savedJobId = requiredJobId(jobBySlug, 'remote-backend-engineer-atlas-payroll');
  const appliedJobId = requiredJobId(jobBySlug, 'ai-product-manager-talentgrid');

  await prisma.savedJob.upsert({
    where: {
      userId_jobId: {
        userId,
        jobId: savedJobId,
      },
    },
    update: {
      notes: 'Strong match for TypeScript, AI workflows, and backend experience.',
    },
    create: {
      userId,
      jobId: savedJobId,
      notes: 'Strong match for TypeScript, AI workflows, and backend experience.',
    },
  });

  await prisma.application.upsert({
    where: {
      userId_jobId: {
        userId,
        jobId: appliedJobId,
      },
    },
    update: {
      status: ApplicationStatus.SCREENING,
      source: 'AI Job OS seed',
    },
    create: {
      userId,
      jobId: appliedJobId,
      status: ApplicationStatus.SCREENING,
      source: 'AI Job OS seed',
    },
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function companyName(slug: string) {
  const company = companies.find((item) => item.slug === slug);

  if (!company) {
    throw new Error(`Missing company for slug ${slug}`);
  }

  return company.name;
}

function requiredSkillId(skillByName: Map<string, string>, name: string) {
  const skillId = skillByName.get(name);

  if (!skillId) {
    throw new Error(`Missing skill ${name}`);
  }

  return skillId;
}

function requiredJobId(jobBySlug: Map<string, string>, slug: string) {
  const jobId = jobBySlug.get(slug);

  if (!jobId) {
    throw new Error(`Missing job ${slug}`);
  }

  return jobId;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });