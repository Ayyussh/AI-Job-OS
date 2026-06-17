'use client';

import { useState } from 'react';
import { ResumeUploader } from '@/components/ResumeUploader';
import { ResumeList } from '@/components/ResumeList';
import { MatchAllButton } from '@/components/MatchAllButton';
import { MatchResults } from '@/components/MatchResults';

export default function ResumePage() {
  const [matchResults, setMatchResults] = useState(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Resume Management</h1>
        <p className="text-gray-600 mt-2">
          Upload your resume to extract skills and match with jobs
        </p>
      </div>
      
      <div className="grid gap-8">
        {/* Upload Section */}
        <section>
          <ResumeUploader />
        </section>

        {/* Match Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🎯 Match with Jobs</h2>
          <p className="text-gray-600 mb-4">
            Select a resume and match against all available jobs
          </p>
          <MatchAllButton onMatchComplete={setMatchResults} />
        </section>

        {/* Results Section */}
        {matchResults && (
          <section>
            <MatchResults results={matchResults} />
          </section>
        )}

        {/* Resume List Section */}
        <section>
          <ResumeList />
        </section>
      </div>
    </div>
  );
}