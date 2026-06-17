'use client';

import { useState, useEffect } from 'react';
import { 
  getApplications, 
  updateApplicationStatus, 
  deleteApplication,
  Application 
} from '@/lib/application-api';
import { StatusBadge } from '../components/StatusBadge';
import { ApplicationStats } from '../components/ApplicationStats';

const STATUS_ORDER = ['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];

export function ApplicationTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await getApplications(filter);
      setApplications(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateApplicationStatus(id, newStatus);
      await fetchApplications();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await deleteApplication(id);
      await fetchApplications();
    } catch (err) {
      setError('Failed to delete application');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ApplicationStats />
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Applications</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Statuses</option>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No applications yet.</p>
            <p className="text-sm text-gray-400 mt-1">Start applying to jobs!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{app.job.title}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-gray-600">{app.job.company.name}</p>
                    <p className="text-sm text-gray-500">
                      📍 {app.job.location} • {app.job.workMode}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied: {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                    {app.coverLetter && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        📝 {app.coverLetter}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      {STATUS_ORDER.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="px-3 py-1.5 text-red-600 hover:text-red-800 text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}