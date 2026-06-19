'use client';

import { useEffect, useState } from 'react';
import { useResume } from '@/context/ResumeContext';
import { FileText, Trash2, CheckCircle, Clock } from 'lucide-react';

export function ResumeList() {
  const { resumes, selectedResumeId, setSelectedResumeId, refreshResumes } = useResume();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    refreshResumes().finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    setDeleting(id);
    try {
      const response = await fetch(`http://localhost:5000/resume/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await refreshResumes();
        // If the deleted resume was selected, clear selection
        if (selectedResumeId === id) {
          setSelectedResumeId(resumes.length > 1 ? resumes.find(r => r.id !== id)?.id || '' : '');
        }
      } else {
        alert('Failed to delete resume');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete resume');
    } finally {
      setDeleting(null);
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
      <div className="bg-white rounded-lg shadow p-6 text-center border border-gray-100">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No resumes uploaded yet.</p>
        <p className="text-sm text-gray-400 mt-1">Upload your first resume above!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Your Resumes ({resumes.length})
      </h2>
      
      <div className="space-y-3">
        {resumes.map((resume) => {
          const isSelected = selectedResumeId === resume.id;
          const isDeleting = deleting === resume.id;
          
          return (
            <div
              key={resume.id}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
              onClick={() => setSelectedResumeId(resume.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {resume.title || resume.fileName}
                        {isSelected && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{resume.fileName}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      {resume.extractedSkills?.length || 0} skills
                    </span>
                  </div>
                  
                  {resume.extractedSkills && resume.extractedSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {resume.extractedSkills.slice(0, 8).map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {resume.extractedSkills.length > 8 && (
                        <span className="text-xs text-gray-400">
                          +{resume.extractedSkills.length - 8} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(resume.id, resume.fileName);
                  }}
                  disabled={isDeleting}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="animate-spin w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}