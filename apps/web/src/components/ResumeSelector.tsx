'use client';

import { useResume } from '@/context/ResumeContext';
import { ChevronDown, Check, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function ResumeSelector() {
  const { resumes, selectedResumeId, setSelectedResumeId, loading } = useResume();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedResume = resumes.find(r => r.id === selectedResumeId);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="text-yellow-600 text-sm bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
        ⚠️ No resumes found. Please upload a resume first.
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all w-full sm:w-auto min-w-[200px]"
      >
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="flex-1 text-left truncate">
          {selectedResume ? (selectedResume.title || selectedResume.fileName) : 'Select a resume'}
        </span>
        <span className="text-xs text-gray-400">
          {selectedResume && `${selectedResume.extractedSkills?.length || 0} skills`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {resumes.map((resume) => (
            <button
              key={resume.id}
              onClick={() => {
                setSelectedResumeId(resume.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                selectedResumeId === resume.id ? 'bg-blue-50' : ''
              }`}
            >
              <FileText className="w-4 h-4 text-gray-400" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">
                  {resume.title || resume.fileName}
                </div>
                <div className="text-xs text-gray-500">
                  {resume.extractedSkills?.length || 0} skills • {new Date(resume.createdAt).toLocaleDateString()}
                </div>
              </div>
              {selectedResumeId === resume.id && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}