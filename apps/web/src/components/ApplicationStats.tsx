'use client';

import { useState, useEffect } from 'react';
import { getApplicationStats, ApplicationStats as StatsType } from '@/lib/application-api';

export function ApplicationStats() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getApplicationStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    { key: 'SAVED', label: 'Saved', color: 'bg-gray-100' },
    { key: 'APPLIED', label: 'Applied', color: 'bg-blue-100' },
    { key: 'SCREENING', label: 'Screening', color: 'bg-yellow-100' },
    { key: 'INTERVIEW', label: 'Interview', color: 'bg-purple-100' },
    { key: 'OFFER', label: 'Offer', color: 'bg-green-100' },
    { key: 'REJECTED', label: 'Rejected', color: 'bg-red-100' },
    { key: 'WITHDRAWN', label: 'Withdrawn', color: 'bg-gray-200' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
      {statItems.map(({ key, label, color }) => (
        <div key={key} className={`p-3 rounded-lg text-center ${color}`}>
          <div className="text-2xl font-bold text-gray-800">{stats[key as keyof StatsType] || 0}</div>
          <div className="text-xs text-gray-600">{label}</div>
        </div>
      ))}
    </div>
  );
}