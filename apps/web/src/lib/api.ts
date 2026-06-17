const API_URL = "http://localhost:5000";

// ============ TYPE DEFINITIONS ============
export interface Skill {
  id: string;
  name: string;
  slug: string;
}

export interface JobSkill {
  importance: 'REQUIRED' | 'PREFERRED';
  id: string;
  name: string;
  slug: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  verified: boolean;
  industries: string[];
}

export interface JobSource {
  id: string;
  name: string;
  websiteUrl: string;
  kind: string;
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  city: string | null;
  country: string | null;
  workMode: 'REMOTE' | 'HYBRID' | 'ONSITE';
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
  experienceLevel: string | null;
  minSalary: number | null;
  maxSalary: number | null;
  currency: string | null;
  salaryPeriod: string | null;
  applyUrl: string | null;
  isFeatured: boolean;
  postedAt: string;
  expiresAt: string | null;
  company: Company;
  source: JobSource | null;
  skills: JobSkill[];
  counts: {
    applications: number;
    saved: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ API FUNCTIONS ============

export async function getJobs(params?: {
  page?: number;
  limit?: number;
  q?: string;
  location?: string;
  workMode?: string;
  jobType?: string;
  experienceLevel?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
  }
  
  const url = `${API_URL}/jobs${queryParams.toString() ? `?${queryParams}` : ''}`;
  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch jobs");
  }

  return res.json() as Promise<ApiResponse<Job[]>>;
}

export async function getJobBySlug(slug: string) {
  const res = await fetch(`${API_URL}/jobs/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch job");
  }

  return res.json() as Promise<{ data: Job }>;
}

export async function getSources() {
  const res = await fetch(`${API_URL}/jobs/sources`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch sources");
  }

  return res.json();
}

export async function getSkills() {
  const res = await fetch(`${API_URL}/jobs/skills`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch skills");
  }

  return res.json();
}

// ONLY ONE uploadResume function - keep this one
export async function uploadResume(file: File, title?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);

  const response = await fetch(`${API_URL}/resume/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}