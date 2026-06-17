'use client';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  SAVED: 'bg-gray-100 text-gray-800',
  APPLIED: 'bg-blue-100 text-blue-800',
  SCREENING: 'bg-yellow-100 text-yellow-800',
  INTERVIEW: 'bg-purple-100 text-purple-800',
  OFFER: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-200 text-gray-600',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const displayName = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {displayName}
    </span>
  );
}