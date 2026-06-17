'use client';

import { useState } from 'react';

interface MatchResult {
  matchPercentage: number;
  strengths: string[];
  missingSkills: string[];
  explanation: string;
  job: {
    id: string;
    title: string;
    slug: string;
    company: string;
    location: string;
    workMode: string;
    applyUrl: string;
  };
}

interface MatchResultsProps {
  results: {
    resumeId: string;
    totalJobs: number;
    matchedJobs: MatchResult[];
  };
}

export function MatchResults({ results }: MatchResultsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayJobs = showAll ? results.matchedJobs : results.matchedJobs.slice(0, 10);

  if (!results || results.matchedJobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No matches found. Upload a resume and try again!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🎯 Match Results</h2>
        <span className="text-sm text-gray-500">
          {results.totalJobs} jobs analyzed
        </span>
      </div>

      <div className="space-y-4">
        {displayJobs.map((match, index) => (
          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-blue-600 min-w-[60px]">
                    {match.matchPercentage}%
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{match.job.title}</h3>
                    <p className="text-sm text-gray-600">{match.job.company}</p>
                    <p className="text-xs text-gray-500">
                      📍 {match.job.location} • {match.job.workMode}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mt-2">{match.explanation}</p>

                <div className="mt-3 flex flex-wrap gap-4">
                  {match.strengths && match.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-600">✅ Strengths</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.strengths.slice(0, 3).map((s, i) => (
                          <span key={i} className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.missingSkills && match.missingSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-orange-600">📈 Missing</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.missingSkills.slice(0, 3).map((s, i) => (
                          <span key={i} className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <a
                href={match.job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap text-center"
              >
                Apply Now →
              </a>
            </div>
          </div>
        ))}
      </div>

      {results.matchedJobs.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-blue-600 hover:underline text-sm"
        >
          {showAll ? 'Show less' : `Show all ${results.matchedJobs.length} matches`}
        </button>
      )}
    </div>
  );
}