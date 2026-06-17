'use client';

import { Job } from '@/lib/api';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  // Safely access company data with fallbacks
  const companyName = job.company?.name || 'Unknown Company';
  const companyLogo = job.company?.logoUrl || null;
  const companyVerified = job.company?.verified || false;

  const formatSalary = () => {
    if (!job.minSalary && !job.maxSalary) return 'Salary not specified';
    if (job.minSalary && job.maxSalary) {
      return `${formatCurrency(job.minSalary)} - ${formatCurrency(job.maxSalary)} ${job.currency || 'USD'}`;
    }
    if (job.minSalary) return `From ${formatCurrency(job.minSalary)} ${job.currency || 'USD'}`;
    return `Up to ${formatCurrency(job.maxSalary!)} ${job.currency || 'USD'}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getWorkModeBadge = () => {
    const styles: Record<string, string> = {
      REMOTE: 'bg-green-100 text-green-800',
      HYBRID: 'bg-blue-100 text-blue-800',
      ONSITE: 'bg-purple-100 text-purple-800',
    };
    return styles[job.workMode] || 'bg-gray-100 text-gray-800';
  };

  // Skills are already flat objects in your data
  const skills = job.skills || [];
  const displaySkills = skills.slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
            {job.isFeatured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                Featured
              </span>
            )}
          </div>
          
          <p className="text-gray-600 mb-2">
            {companyName}
            {companyVerified && (
              <span className="ml-2 text-blue-600 text-sm">✓ Verified</span>
            )}
          </p>
          
          <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              📍 {job.location || 'Location not specified'}
            </span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${getWorkModeBadge()}`}>
              {job.workMode || 'Not specified'}
            </span>
            <span>•</span>
            <span>{job.jobType?.replace('_', ' ') || 'Not specified'}</span>
            {job.experienceLevel && (
              <>
                <span>•</span>
                <span>{job.experienceLevel}</span>
              </>
            )}
          </div>

          <div className="text-sm text-gray-700 mb-3">
            💰 {formatSalary()}
          </div>

          {displaySkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {displaySkills.map((skill) => (
                <span
                  key={skill.id || Math.random()}
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                >
                  {skill.name || 'Unknown Skill'}
                </span>
              ))}
              {skills.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{skills.length - 5} more
                </span>
              )}
            </div>
          )}

          {job.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {job.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
            </p>
          )}

          {job.postedAt && (
            <div className="mt-3 text-xs text-gray-400">
              Posted {formatDate(job.postedAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  } catch {
    return 'recently';
  }
}