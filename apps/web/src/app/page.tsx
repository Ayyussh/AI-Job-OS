"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useJobs } from "../hooks/useJobs";
import { useRouter } from "next/navigation";
import { JobCard } from "../components/JobCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorState } from "../components/ErrorState";
import { Search, Filter, X } from "lucide-react";
import { Pagination } from "../components/Pagination";

interface FilterState {
  search: string;
  location: string;
  workMode: string;
  jobType: string;
  experienceLevel: string;
  sortBy: "newest" | "oldest" | "match";
}

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    location: "",
    workMode: "",
    jobType: "",
    experienceLevel: "",
    sortBy: "newest",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    jobs,
    loading,
    error,
    total,
    totalPages,
    currentPage,
    goToPage,
    refetch,
  } = useJobs({
    q: filters.search || undefined,
    location: filters.location || undefined,
    workMode: filters.workMode || undefined,
    jobType: filters.jobType || undefined,
    experienceLevel: filters.experienceLevel || undefined,
  });

  // Sort jobs
  const sortedJobs = [...jobs].sort((a, b) => {
    if (filters.sortBy === "newest") {
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    } else if (filters.sortBy === "oldest") {
      return new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
    }
    return 0;
  });

  const clearFilters = () => {
    setFilters({
      search: "",
      location: "",
      workMode: "",
      jobType: "",
      experienceLevel: "",
      sortBy: "newest",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.location ||
    filters.workMode ||
    filters.jobType ||
    filters.experienceLevel;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">
            Find Your Dream Job with AI
          </h1>
          <p className="text-lg text-center text-blue-100 mb-6">
            Upload your resume and let our AI match you with perfect
            opportunities
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 bg-white rounded-lg p-2 shadow-lg">
              <Search className="w-5 h-5 text-gray-400 ml-2 self-center" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Search by title, company, or skill..."
                className="flex-1 px-3 py-2 text-gray-800 outline-none bg-transparent"
              />
              <button
                onClick={() => refetch()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">
              {total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Live Jobs</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">50+</div>
            <div className="text-sm text-gray-600">Companies</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">86%</div>
            <div className="text-sm text-gray-600">Match Rate</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">AI</div>
            <div className="text-sm text-gray-600">Smart Matching</div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside
            className={`lg:w-64 ${isMobile ? (showFilters ? "block" : "hidden") : "block"}`}
          >
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200 sticky top-20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) =>
                      setFilters({ ...filters, location: e.target.value })
                    }
                    placeholder="City or country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Mode
                  </label>
                  <select
                    value={filters.workMode}
                    onChange={(e) =>
                      setFilters({ ...filters, workMode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">All</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type
                  </label>
                  <select
                    value={filters.jobType}
                    onChange={(e) =>
                      setFilters({ ...filters, jobType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">All</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="FREELANCE">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={filters.experienceLevel}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        experienceLevel: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">All</option>
                    <option value="INTERN">Intern</option>
                    <option value="ENTRY">Entry</option>
                    <option value="MID">Mid</option>
                    <option value="SENIOR">Senior</option>
                    <option value="LEAD">Lead</option>
                    <option value="EXECUTIVE">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters({ ...filters, sortBy: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                <button
                  onClick={() => refetch()}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Job Listings */}
          <main className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {loading ? "Loading..." : `${total} Jobs Found`}
                </h2>
                {hasActiveFilters && (
                  <p className="text-sm text-gray-500 mt-1">
                    Showing filtered results
                  </p>
                )}
              </div>

              {/* Mobile Filter Toggle */}
              {isMobile && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </button>
              )}
            </div>

            {loading && <LoadingSpinner />}

            {error && <ErrorState message={error} onRetry={() => refetch()} />}

            {!loading && !error && sortedJobs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-100">
                <p className="text-gray-500">
                  No jobs found matching your criteria
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4">
              {sortedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  showApplyButton={true}
                  onClick={() => router.push(`/jobs/${job.slug}`)}
                />
              ))}
            </div>

            {/* Pagination - Show only if there are jobs */}
            {!loading && !error && totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
