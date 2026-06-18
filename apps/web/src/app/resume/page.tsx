'use client';

import { useState } from 'react';
import { ResumeUploader } from '@/components/ResumeUploader';
import { ResumeList } from '@/components/ResumeList';
import { MatchAllButton } from '@/components/MatchAllButton';
import { MatchResults } from '@/components/MatchResults';
import { JobDiscoveryChat } from '@/components/JobDiscoveryChat';
import { useResume } from '@/context/ResumeContext';

export default function ResumePage() {
  const [matchResults, setMatchResults] = useState(null);
  const { selectedResume } = useResume();
  const userSkills = selectedResume?.extractedSkills || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Resume Management</h1>
        <p className="text-gray-600 mt-2">
          Upload your resume, match with jobs, or discover new opportunities
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <section>
            <ResumeUploader />
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🎯 Match with Jobs</h2>
            <p className="text-gray-600 mb-4">
              Match your resume against all jobs in the database
            </p>
            <MatchAllButton onMatchComplete={setMatchResults} />
          </section>

          {matchResults && (
            <section>
              <MatchResults results={matchResults} />
            </section>
          )}

          <section>
            <ResumeList />
          </section>
        </div>

        {/* Right Column - Job Discovery Chat */}
        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🔍 Discover New Jobs</h2>
            <p className="text-gray-600 mb-4">
              Find jobs that are not in our database using AI
            </p>
            <JobDiscoveryChat userSkills={userSkills} />
          </section>
        </div>
      </div>
    </div>
  );
}