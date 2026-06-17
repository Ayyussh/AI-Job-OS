'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Resume {
  id: string;
  fileName: string;
  title: string | null;
  extractedSkills: string[];
  createdAt: string;
}

interface ResumeContextType {
  resumes: Resume[];
  selectedResumeId: string | null;
  selectedResume: Resume | null;
  loading: boolean;
  error: string | null;
  setSelectedResumeId: (id: string) => void;
  refreshResumes: () => Promise<void>;
  uploadResume: (file: File, title?: string) => Promise<void>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load selected resume from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem('selectedResumeId');
    if (savedId) {
      setSelectedResumeId(savedId);
    }
  }, []);

  // Save selected resume to localStorage when it changes
  useEffect(() => {
    if (selectedResumeId) {
      localStorage.setItem('selectedResumeId', selectedResumeId);
    }
  }, [selectedResumeId]);

  // Fetch resumes on mount
  useEffect(() => {
    refreshResumes();
  }, []);

  const refreshResumes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/resume');
      if (!response.ok) throw new Error('Failed to fetch resumes');
      const data = await response.json();
      setResumes(data);
      
      // Auto-select first resume if none selected
      if (data.length > 0 && !selectedResumeId) {
        setSelectedResumeId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    try {
      const response = await fetch('http://localhost:5000/resume/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      await refreshResumes();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const selectedResume = resumes.find(r => r.id === selectedResumeId) || null;

  return (
    <ResumeContext.Provider value={{
      resumes,
      selectedResumeId,
      selectedResume,
      loading,
      error,
      setSelectedResumeId,
      refreshResumes,
      uploadResume,
    }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
}