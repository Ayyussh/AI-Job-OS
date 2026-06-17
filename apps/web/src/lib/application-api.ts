const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Application {
  id: string;
  status: 'SAVED' | 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  coverLetter: string | null;
  appliedAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
    location: string;
    workMode: string;
    company: {
      id: string;
      name: string;
      logoUrl: string | null;
    };
    skills: Array<{
      skill: {
        name: string;
      };
    }>;
  };
  resume: {
    id: string;
    fileName: string;
  } | null;
}

export interface ApplicationStats {
  SAVED: number;
  APPLIED: number;
  SCREENING: number;
  INTERVIEW: number;
  OFFER: number;
  REJECTED: number;
  WITHDRAWN: number;
}

export async function getApplications(status?: string): Promise<Application[]> {
  const url = status ? `${API_URL}/applications?status=${status}` : `${API_URL}/applications`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch applications');
  return response.json();
}

export async function getApplicationStats(): Promise<ApplicationStats> {
  const response = await fetch(`${API_URL}/applications/stats`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function createApplication(jobId: string, resumeId?: string, coverLetter?: string): Promise<Application> {
  const response = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, resumeId, coverLetter }),
  });
  if (!response.ok) throw new Error('Failed to create application');
  return response.json();
}

export async function updateApplicationStatus(id: string, status: string): Promise<Application> {
  const response = await fetch(`${API_URL}/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update status');
  return response.json();
}

export async function deleteApplication(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/applications/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete application');
}