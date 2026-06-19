'use client';

import { Job } from '@/lib/api';
import { Calendar, MapPin, Building2, DollarSign, ExternalLink } from 'lucide-react';

interface JobCardProps {
  job: Job;
  showApplyButton?: boolean;
  onClick?: () => void;
}

export function JobCard({ job, showApplyButton = true, onClick }: JobCardProps) {
  const companyName = job.company?.name || 'Unknown Company';
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
      REMOTE: 'bg-green-100 text-green-700',
      HYBRID: 'bg-blue-100 text-blue-700',
      ONSITE: 'bg-purple-100 text-purple-700',
    };
    return styles[job.workMode] || 'bg-gray-100 text-gray-700';
  };

  const skills = job.skills || [];
  const displaySkills = skills.slice(0, 5);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the apply button
    const target = e.target as HTMLElement;
    if (target.closest('.apply-button')) return;
    if (onClick) onClick();
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-gray-100 hover:border-blue-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition">
              {job.title}
            </h3>
            {job.isFeatured && (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                Featured
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 font-medium">{companyName}</span>
            {companyVerified && (
              <span className="text-blue-600 text-xs">✓ Verified</span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {job.location || 'Location not specified'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getWorkModeBadge()}`}>
              {job.workMode || 'Not specified'}
            </span>
            <span className="text-gray-500">
              {job.jobType?.replace('_', ' ') || 'Not specified'}
            </span>
            {job.experienceLevel && (
              <span className="text-gray-500">
                • {job.experienceLevel}
              </span>
            )}
          </div>

          {job.minSalary && job.maxSalary && (
            <div className="flex items-center gap-1 text-sm text-gray-700 mb-3">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span>{formatSalary()}</span>
            </div>
          )}

          {displaySkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displaySkills.map((skill) => (
                <span
                  key={skill.id}
                  className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  {skill.name}
                </span>
              ))}
              {skills.length > 5 && (
                <span className="text-xs text-gray-500 ml-1">
                  +{skills.length - 5} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Posted {formatDate(job.postedAt)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 self-start">
          {showApplyButton && job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="apply-button flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
              onClick={(e) => e.stopPropagation()}
            >
              Apply Now <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {/* {job.matchScore && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full self-start">
              <div className="text-sm font-bold text-blue-600">{job.matchScore}%</div>
              <div className="text-xs text-gray-500">match</div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  } catch {
    return 'recently';
  }
}