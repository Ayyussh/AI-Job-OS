'use client';

import { useState } from 'react';
import { useResume } from '@/context/ResumeContext';
import { ResumeSelector } from './ResumeSelector';

interface MatchAllButtonProps {
  onMatchComplete: (results: any) => void;
}

export function MatchAllButton({ onMatchComplete }: MatchAllButtonProps) {
  const { selectedResumeId, resumes } = useResume();
  const [isMatching, setIsMatching] = useState(false);

  const handleMatchAll = async () => {
    if (!selectedResumeId) {
      alert('Please upload a resume first');
      return;
    }

    setIsMatching(true);
    try {
      const response = await fetch('http://localhost:5000/matching/match-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResumeId }),
      });
      const data = await response.json();
      onMatchComplete(data);
    } catch (error) {
      console.error('Match all failed:', error);
      alert('Matching failed. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  if (resumes.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        ⚠️ No resumes found. Please upload a resume first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:w-auto">
          <ResumeSelector />
        </div>
        
        <button
          onClick={handleMatchAll}
          disabled={isMatching || !selectedResumeId}
          className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {isMatching ? '🎯 Matching...' : '🎯 Match All Jobs'}
        </button>
      </div>
    </div>
  );
}