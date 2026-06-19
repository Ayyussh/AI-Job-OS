'use client';

import { useState } from 'react';
import { useResume } from '@/context/ResumeContext';
import { ResumeSelector } from './ResumeSelector';
import { Sparkles, Loader2 } from 'lucide-react';

interface MatchAllButtonProps {
  onMatchComplete: (results: any) => void;
}

export function MatchAllButton({ onMatchComplete }: MatchAllButtonProps) {
  const { selectedResumeId, resumes } = useResume();
  const [isMatching, setIsMatching] = useState(false);
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'complex'>('moderate');

  const handleMatchAll = async () => {
    if (!selectedResumeId) {
      alert('Please select a resume first');
      return;
    }

    setIsMatching(true);
    try {
      const response = await fetch('http://localhost:5000/matching/match-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resumeId: selectedResumeId,
          useAI: complexity !== 'simple',
          complexity: complexity,
        }),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Server error: ${error}`);
      }

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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
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
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={complexity}
            onChange={(e) => setComplexity(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="simple">⚡ Fast (Keyword)</option>
            <option value="moderate">🎯 Balanced (AI)</option>
            <option value="complex">🧠 Deep (AI)</option>
          </select>
          
          <button
            onClick={handleMatchAll}
            disabled={isMatching || !selectedResumeId}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium min-w-[160px]"
          >
            {isMatching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Matching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Match All Jobs
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}