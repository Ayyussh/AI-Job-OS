'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useJob } from '../../../hooks/useJobs';
import { useResume } from '../../../context/ResumeContext';
import { ResumeSelector } from '../../../components/ResumeSelector';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorState } from '@/components/ErrorState';
import { createApplication } from '@/lib/application-api';

export default function JobDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { job, loading, error } = useJob(slug);
  const { selectedResumeId, resumes } = useResume();
  const [matchResult, setMatchResult] = useState<any>(null);
  const [matching, setMatching] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  const handleMatch = async () => {
    if (!selectedResumeId) {
      alert('Please upload a resume first');
      return;
    }

    setMatching(true);
    try {
      const response = await fetch('http://localhost:5000/matching/match-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResumeId, jobId: job?.id }),
      });
      const data = await response.json();
      const jobMatch = data.matchedJobs?.find((m: any) => m.job.id === job?.id);
      setMatchResult(jobMatch);
    } catch (error) {
      console.error('Match failed:', error);
      alert('Matching failed. Please try again.');
    } finally {
      setMatching(false);
    }
  };

  const handleApply = async () => {
    if (!selectedResumeId) {
      alert('Please upload a resume first');
      return;
    }

    if (!job) return;

    setApplying(true);
    try {
      await createApplication(job.id, selectedResumeId);
      setApplicationStatus('success');
      
      // Open external apply URL in new tab
      if (job.applyUrl) {
        window.open(job.applyUrl, '_blank');
      }
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        setApplicationStatus('already-applied');
      } else {
        setApplicationStatus('error');
        console.error('Apply failed:', error);
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!job) return <div className="text-center py-12">Job not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to jobs
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-xl text-gray-600 mt-2">{job.company.name}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="text-sm text-gray-500">📍 {job.location}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{job.workMode}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{job.jobType?.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={handleApply}
              disabled={applying || !selectedResumeId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-center"
            >
              {applying ? 'Applying...' : '📝 Apply Now'}
            </button>
            <a
              href={job.applyUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
            >
              View Original →
            </a>
          </div>
        </div>

        {/* Application Status Messages */}
        {applicationStatus === 'success' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">✅ Application tracked successfully! The job posting has been opened in a new tab.</p>
          </div>
        )}
        {applicationStatus === 'already-applied' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">⚠️ You've already applied to this job.</p>
          </div>
        )}
        {applicationStatus === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">❌ Failed to track application. Please try again.</p>
          </div>
        )}

        {job.minSalary && job.maxSalary && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-lg font-semibold text-gray-800">
              💰 {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: job.currency || 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(job.minSalary)} - {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: job.currency || 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(job.maxSalary)}
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Match your resume with this job:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <ResumeSelector />
            </div>
            <button
              onClick={handleMatch}
              disabled={matching || resumes.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {matching ? 'Matching...' : '🎯 Match'}
            </button>
          </div>

          {matchResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-bold text-blue-600">
                  {matchResult.matchPercentage}%
                </div>
                <div>
                  <p className="font-semibold">Match Score</p>
                  <p className="text-sm text-gray-600">{matchResult.explanation}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {matchResult.strengths && matchResult.strengths.length > 0 && (
                  <div>
                    <p className="font-semibold text-green-600 mb-2">✅ Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {matchResult.strengths.map((s: string, i: number) => (
                        <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {matchResult.missingSkills && matchResult.missingSkills.length > 0 && (
                  <div>
                    <p className="font-semibold text-orange-600 mb-2">📈 Missing Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {matchResult.missingSkills.map((s: string, i: number) => (
                        <span key={i} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Job Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span
                key={skill.id}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {skill.name}
                {skill.importance === 'PREFERRED' && (
                  <span className="ml-1 text-xs text-gray-500">(preferred)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}