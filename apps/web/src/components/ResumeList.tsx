'use client';

import { useEffect, useState } from 'react';

interface ResumeItem {
  id: string;
  fileName: string;
  title: string | null;
  extractedSkills: string[];
  createdAt: string;
  matchCount?: number;
}

export function ResumeList() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch('http://localhost:5000/resume');
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No resumes uploaded yet.</p>
        <p className="text-sm text-gray-400 mt-1">Upload your first resume above!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Your Resumes ({resumes.length})</h2>
      
      <div className="space-y-4">
        {resumes.map((resume) => (
          <div key={resume.id} className="border rounded-lg p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {resume.title || resume.fileName}
                </h3>
                <p className="text-sm text-gray-500">{resume.fileName}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
                </p>
                
                {resume.extractedSkills && resume.extractedSkills.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      🎯 Skills Detected:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {resume.extractedSkills.slice(0, 10).map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {resume.extractedSkills.length > 10 && (
                        <span className="text-xs text-gray-500 ml-1">
                          +{resume.extractedSkills.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {resume.matchCount !== undefined && resume.matchCount > 0 && (
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {resume.matchCount} matches
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}