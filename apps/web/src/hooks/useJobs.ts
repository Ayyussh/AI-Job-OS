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
  const [currentPage, setCurrentPage] = useState(options.page || 1);

  const fetchJobs = useCallback(async (page: number = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getJobs({ 
        ...options, 
        page, 
        limit: options.limit || 20 
      });
      setJobs(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchJobs(currentPage);
  }, [fetchJobs, currentPage]);

  return { 
    jobs, 
    loading, 
    error, 
    total, 
    totalPages, 
    currentPage,
    goToPage: (page: number) => fetchJobs(page),
    refetch: () => fetchJobs(currentPage),
  };
}

// Hook for single job fetching
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