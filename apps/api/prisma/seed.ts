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

const sources = [
  { name: 'Wellfound', websiteUrl: 'https://wellfound.com/jobs', kind: 'startup' },
  { name: 'Remote OK', websiteUrl: 'https://remoteok.com', kind: 'remote' },
  { name: 'Remotive', websiteUrl: 'https://remotive.com', kind: 'remote' },
  { name: 'Indeed', websiteUrl: 'https://indeed.com', kind: 'aggregator' },
  { name: 'Instahyre', websiteUrl: 'https://instahyre.com', kind: 'india-tech' },
  { name: 'Glassdoor', websiteUrl: 'https://glassdoor.com', kind: 'company-review' },
  { name: 'Naukri', websiteUrl: 'https://naukri.com', kind: 'india' },
  { name: 'Foundit', websiteUrl: 'https://foundit.in', kind: 'apac' },
  { name: 'Hirect', websiteUrl: 'https://hirect.in', kind: 'direct-hiring' },
  { name: 'LinkedIn Jobs', websiteUrl: 'https://linkedin.com/jobs', kind: 'network' },
  { name: 'YC Jobs', websiteUrl: 'https://www.ycombinator.com/jobs', kind: 'startup' },
  { name: 'We Work Remotely', websiteUrl: 'https://weworkremotely.com', kind: 'remote' },
  { name: 'FlexJobs', websiteUrl: 'https://flexjobs.com', kind: 'flexible' },
  { name: 'Himalayas', websiteUrl: 'https://himalayas.app/jobs', kind: 'remote' },
  { name: 'Cutshort', websiteUrl: 'https://cutshort.io', kind: 'india-startup' },
  { name: 'Dice', websiteUrl: 'https://dice.com', kind: 'tech' },
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
];

const jobs = [
  {
    title: 'Senior Full Stack Engineer',
    slug: 'senior-full-stack-engineer-brightloop-ai',
    companySlug: 'brightloop-ai',
    sourceName: 'Wellfound',
    sourceJobId: 'wellfound-brightloop-001',
    location: 'Remote, India',
    city: null,
    country: 'India',
    workMode: WorkMode.REMOTE,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.SENIOR,
    minSalary: 3800000,
    maxSalary: 5800000,
    currency: 'INR',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://wellfound.com/jobs/brightloop-senior-full-stack',
    isFeatured: true,
    postedAt: daysAgo(0),
    description:
      'Own product surfaces for AI hiring workflows, from candidate discovery to recruiter analytics.',
    responsibilities: [
      'Build recruiter and candidate workflows across web and API surfaces.',
      'Collaborate with product to ship fast experiments safely.',
      'Improve reliability across queue-backed AI matching jobs.',
    ],
    requirements: ['5+ years of product engineering experience.', 'Strong TypeScript and SQL skills.'],
    benefits: ['Remote-first team.', 'Learning budget.', 'Meaningful equity.'],
    skillNames: ['Next.js', 'NestJS', 'PostgreSQL', 'Prisma', 'LLM', 'TypeScript'],
  },
  {
    title: 'Product Designer, Talent Marketplace',
    slug: 'product-designer-talent-marketplace-northstar-labs',
    companySlug: 'northstar-labs',
    sourceName: 'Instahyre',
    sourceJobId: 'instahyre-northstar-001',
    location: 'Bengaluru, India',
    city: 'Bengaluru',
    country: 'India',
    workMode: WorkMode.HYBRID,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.MID,
    minSalary: 2400000,
    maxSalary: 3600000,
    currency: 'INR',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://instahyre.com/jobs/northstar-product-designer',
    isFeatured: true,
    postedAt: daysAgo(0),
    description:
      'Design candidate-first job discovery, saved searches, and recruiter messaging flows.',
    responsibilities: [
      'Own end-to-end UX for marketplace discovery surfaces.',
      'Run research with candidates and recruiters.',
      'Maintain a practical design system for high-velocity teams.',
    ],
    requirements: ['Portfolio with shipped SaaS work.', 'Strong visual and interaction design craft.'],
    benefits: ['Hybrid workspace.', 'Design conference budget.', 'Flexible time off.'],
    skillNames: ['Figma', 'Design Systems', 'Research', 'Product Strategy'],
  },
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
    title: 'Growth Marketing Manager',
    slug: 'growth-marketing-manager-hiresignal',
    companySlug: 'hiresignal',
    sourceName: 'Naukri',
    sourceJobId: 'naukri-hiresignal-001',
    location: 'Mumbai, India',
    city: 'Mumbai',
    country: 'India',
    workMode: WorkMode.ONSITE,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.LEAD,
    minSalary: 3000000,
    maxSalary: 4500000,
    currency: 'INR',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://naukri.com/jobs/hiresignal-growth-marketing',
    isFeatured: false,
    postedAt: daysAgo(2),
    description:
      'Scale acquisition loops across job seekers, recruiters, and employer brand campaigns.',
    responsibilities: [
      'Own SEO, lifecycle, and paid experiments.',
      'Build reporting around acquisition and activation.',
      'Partner with sales on employer demand generation.',
    ],
    requirements: ['Experience growing B2B or marketplace funnels.', 'Strong analytics discipline.'],
    benefits: ['Performance bonus.', 'Leadership visibility.', 'Health insurance.'],
    skillNames: ['SEO', 'Analytics', 'Product Strategy'],
  },
  {
    title: 'AI Product Manager',
    slug: 'ai-product-manager-talentgrid',
    companySlug: 'talentgrid',
    sourceName: 'LinkedIn Jobs',
    sourceJobId: 'linkedin-talentgrid-001',
    location: 'Hyderabad, India',
    city: 'Hyderabad',
    country: 'India',
    workMode: WorkMode.HYBRID,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.SENIOR,
    minSalary: 4200000,
    maxSalary: 6200000,
    currency: 'INR',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://linkedin.com/jobs/view/talentgrid-ai-pm',
    isFeatured: true,
    postedAt: daysAgo(3),
    description:
      'Lead AI-powered candidate ranking, recruiter assist, and search relevance experiences.',
    responsibilities: [
      'Define product requirements for matching and ranking systems.',
      'Partner with engineering on model evaluation and rollout plans.',
      'Use customer research to prioritize recruiter workflows.',
    ],
    requirements: ['Experience shipping AI or search products.', 'Strong analytical product judgment.'],
    benefits: ['ESOPs.', 'Hybrid schedule.', 'Annual learning budget.'],
    skillNames: ['Product Strategy', 'Analytics', 'LLM', 'Research'],
  },
  {
    title: 'Founding Frontend Engineer',
    slug: 'founding-frontend-engineer-cloudlane',
    companySlug: 'cloudlane',
    sourceName: 'YC Jobs',
    sourceJobId: 'yc-cloudlane-001',
    location: 'Pune, India',
    city: 'Pune',
    country: 'India',
    workMode: WorkMode.HYBRID,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.SENIOR,
    minSalary: 3200000,
    maxSalary: 5200000,
    currency: 'INR',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://www.ycombinator.com/jobs/cloudlane-frontend',
    isFeatured: false,
    postedAt: daysAgo(4),
    description:
      'Build fast, dense cloud operations interfaces for technical teams that live in dashboards.',
    responsibilities: [
      'Own frontend architecture for command-center workflows.',
      'Build reusable UI primitives for data-heavy screens.',
      'Collaborate directly with early design partners.',
    ],
    requirements: ['Strong React and TypeScript experience.', 'Taste for operational product UX.'],
    benefits: ['Founder access.', 'High ownership.', 'Early-stage equity.'],
    skillNames: ['React', 'Next.js', 'TypeScript', 'Design Systems'],
  },
  {
    title: 'DevOps Platform Engineer',
    slug: 'devops-platform-engineer-horizon-ai',
    companySlug: 'horizon-ai',
    sourceName: 'Indeed',
    sourceJobId: 'indeed-horizon-001',
    location: 'Delhi NCR, India',
    city: 'Delhi NCR',
    country: 'India',
    workMode: WorkMode.HYBRID,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.MID,
    minSalary: 2600000,
    maxSalary: 4200000,
    currency: 'INR',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://indeed.com/viewjob/horizon-platform-engineer',
    isFeatured: false,
    postedAt: daysAgo(5),
    description:
      'Keep AI workloads reliable across deploy pipelines, observability, and cloud infrastructure.',
    responsibilities: [
      'Operate Kubernetes clusters for product and AI workloads.',
      'Automate deployment and incident-response workflows.',
      'Improve reliability dashboards for engineering teams.',
    ],
    requirements: ['Production Kubernetes experience.', 'Comfort with cloud networking and CI/CD.'],
    benefits: ['Cloud certification support.', 'Hybrid office.', 'Wellness allowance.'],
    skillNames: ['Kubernetes', 'Go', 'Redis', 'PostgreSQL'],
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
    title: 'Customer Success Lead',
    slug: 'customer-success-lead-hiresignal',
    companySlug: 'hiresignal',
    sourceName: 'Glassdoor',
    sourceJobId: 'glassdoor-hiresignal-001',
    location: 'Mumbai, India',
    city: 'Mumbai',
    country: 'India',
    workMode: WorkMode.ONSITE,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.LEAD,
    minSalary: 2200000,
    maxSalary: 3400000,
    currency: 'INR',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://glassdoor.com/job-listing/hiresignal-cs-lead',
    isFeatured: false,
    postedAt: daysAgo(7),
    description:
      'Lead onboarding, adoption, and expansion for recruiting teams using HireSignal.',
    responsibilities: [
      'Own executive onboarding for strategic customers.',
      'Create playbooks for activation and retention.',
      'Feed customer insights into product planning.',
    ],
    requirements: ['B2B SaaS customer success experience.', 'Strong communication and analytics skills.'],
    benefits: ['Customer travel budget.', 'Quarterly bonus.', 'Health coverage.'],
    skillNames: ['Analytics', 'Research', 'Product Strategy'],
  },
  {
    title: 'Mobile Engineer',
    slug: 'mobile-engineer-cloudlane',
    companySlug: 'cloudlane',
    sourceName: 'Foundit',
    sourceJobId: 'foundit-cloudlane-001',
    location: 'Pune, India',
    city: 'Pune',
    country: 'India',
    workMode: WorkMode.HYBRID,
    jobType: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.MID,
    minSalary: 2400000,
    maxSalary: 3900000,
    currency: 'INR',
    salaryPeriod: SalaryPeriod.YEAR,
    applyUrl: 'https://foundit.in/job/cloudlane-mobile-engineer',
    isFeatured: false,
    postedAt: daysAgo(8),
    description:
      'Build mobile workflows for incident response, alerts, and approval actions on the go.',
    responsibilities: [
      'Ship mobile experiences for operations teams.',
      'Integrate alerting and approval workflows.',
      'Keep performance sharp on low-connectivity networks.',
    ],
    requirements: ['Strong React experience.', 'Experience building production mobile apps.'],
    benefits: ['Device budget.', 'Hybrid work.', 'Equity participation.'],
    skillNames: ['React', 'TypeScript', 'Design Systems'],
  },
];

async function main() {
  const sourceByName = new Map<string, string>();
  const skillByName = new Map<string, string>();
  const jobBySlug = new Map<string, string>();

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

  for (const job of jobs) {
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
  const savedJobId = requiredJobId(jobBySlug, 'senior-full-stack-engineer-brightloop-ai');
  const appliedJobId = requiredJobId(jobBySlug, 'founding-frontend-engineer-cloudlane');

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
