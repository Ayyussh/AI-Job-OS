'use client';

import { useState, useEffect } from 'react';
import { useResume } from '@/context/ResumeContext';
import { ResumeSelector } from './ResumeSelector';
import { Sparkles } from 'lucide-react';

interface MatchAllButtonProps {
  onMatchComplete: (results: any) => void;
}

export function MatchAllButton({ onMatchComplete }: MatchAllButtonProps) {
  const { selectedResumeId, resumes } = useResume();
  const [isMatching, setIsMatching] = useState(false);
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'complex'>('moderate');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/health', {
        signal: AbortSignal.timeout(3000),
      });
      setBackendStatus(response.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  const handleMatchAll = async () => {
    if (!selectedResumeId) {
      alert('Please upload a resume first');
      return;
    }

    if (backendStatus === 'offline') {
      alert('⚠️ Backend server is not running. Please start the backend with: cd apps/api && pnpm start:dev');
      return;
    }

    setIsMatching(true);
    try {
      const response = await fetch('http://localhost:5000/matching/match-all', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          resumeId: selectedResumeId,
          useAI: true,
          complexity: complexity,
        }),
        signal: AbortSignal.timeout(600000), // 60 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      onMatchComplete(data);
    } catch (error) {
      console.error('Match all failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        alert('⏰ Matching is taking too long. The server might be processing many jobs.');
      } else {
        alert(`❌ Matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsMatching(false);
    }
  };

  if (backendStatus === 'checking') {
    return <div className="animate-pulse h-12 bg-gray-200 rounded"></div>;
  }

  if (resumes.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        ⚠️ No resumes found. Please upload a resume first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {backendStatus === 'offline' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          ⚠️ Backend server is offline. Please start it with: <code className="bg-red-100 px-2 py-0.5 rounded">cd apps/api && pnpm start:dev</code>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:w-auto">
          <ResumeSelector />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={complexity}
            onChange={(e) => setComplexity(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="simple">⚡ Fast (llama3.2)</option>
            <option value="moderate">🎯 Balanced (qwen3)</option>
            <option value="complex">🧠 Deep (deepseek-r1)</option>
          </select>
          
          <button
            onClick={handleMatchAll}
            disabled={isMatching || !selectedResumeId || backendStatus === 'offline'}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {isMatching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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