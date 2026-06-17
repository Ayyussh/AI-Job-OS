'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useJobs } from '../hooks/useJobs';
import { JobCard } from '../components/JobCard';
import { JobFilters } from '../components/JobFilters';
import { SearchBar } from '../components/SearchBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';

interface FilterState {
  search: string;
  location: string;
  workMode: string;
}

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    location: '',
    workMode: '',
  });

  const { jobs, loading, error, total } = useJobs({
    q: filters.search || undefined,
    location: filters.location || undefined,
    workMode: filters.workMode || undefined,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Find Your Dream Job with AI
          </h1>
          <p className="text-xl text-center text-blue-100 mb-8">
            Upload your resume and let our AI match you with perfect opportunities
          </p>
          <SearchBar 
            onSearch={(search) => setFilters(prev => ({ ...prev, search }))} 
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Live Jobs" value={total.toLocaleString()} />
          <StatCard label="Companies" value="50+" />
          <StatCard label="Match Rate" value="86%" />
          <StatCard label="AI-Powered" value="Smart Matching" />
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-1/4">
            <JobFilters 
              onFilterChange={(newFilters) => {
                setFilters(prev => ({
                  ...prev,
                  location: newFilters.location,
                  workMode: newFilters.workMode,
                }));
              }}
              initialFilters={filters}
            />
          </aside>

          {/* Job Listings */}
          <main className="lg:w-3/4">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">
                {loading ? 'Loading jobs...' : `${total} Jobs Found`}
              </h2>
            </div>

            {loading && <LoadingSpinner />}
            
            {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
            
            {!loading && !error && jobs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No jobs found matching your criteria</p>
              </div>
            )}

            <div className="space-y-4">
              {jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.slug}`}>
                  <JobCard job={job} />
                </Link>
              ))}
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <div className="text-3xl font-bold text-blue-600 mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}