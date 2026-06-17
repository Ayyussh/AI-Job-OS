'use client';

import { useState, useEffect, useCallback } from 'react';
import { getJobs, getJobBySlug, Job } from '@/lib/api';

interface UseJobsOptions {
  page?: number;
  limit?: number;
  q?: string;
  location?: string;
  workMode?: string;
  jobType?: string;
  experienceLevel?: string;
}

export function useJobs(options: UseJobsOptions = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getJobs(options);
      setJobs(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit, options.q, options.location, options.workMode, options.jobType, options.experienceLevel]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, total, totalPages, refetch: fetchJobs };
}

// Add this new hook for single job fetching
export function useJob(slug: string) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getJobBySlug(slug);
        setJob(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch job');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [slug]);

  return { job, loading, error, refetch: () => {} };
}