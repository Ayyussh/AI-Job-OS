'use client';

import { useState, useEffect } from 'react';
import { 
  getScrapingStatus, 
  scrapeAllSources, 
  scrapeSource,
  ScrapingStatus 
} from '@/lib/scraping-api';
import { RefreshCw, Play, CheckCircle, XCircle, Clock, Database } from 'lucide-react';

export function ScrapingDashboard() {
  const [sources, setSources] = useState<ScrapingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await getScrapingStatus();
      setSources(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeAll = async () => {
    setScraping(true);
    setResult(null);
    try {
      const data = await scrapeAllSources();
      setResult(data);
      await fetchStatus(); // Refresh after scraping
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scraping failed');
    } finally {
      setScraping(false);
    }
  };

  const handleScrapeSource = async (sourceName: string) => {
    setScraping(true);
    try {
      await scrapeSource(sourceName);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to scrape ${sourceName}`);
    } finally {
      setScraping(false);
    }
  };

  const getStatusIcon = (source: ScrapingStatus) => {
    if (!source.active) {
      return <XCircle className="w-5 h-5 text-gray-400" />;
    }
    if (source.lastScraped) {
      const hours = Math.floor((Date.now() - new Date(source.lastScraped).getTime()) / (1000 * 60 * 60));
      if (hours < 6) {
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      }
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = (source: ScrapingStatus) => {
    if (!source.active) return 'Inactive';
    if (!source.lastScraped) return 'Never scraped';
    const hours = Math.floor((Date.now() - new Date(source.lastScraped).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 6) return `${hours}h ago`;
    return `${hours}h ago (needs refresh)`;
  };

  const getStatusColor = (source: ScrapingStatus) => {
    if (!source.active) return 'text-gray-400';
    if (!source.lastScraped) return 'text-gray-400';
    const hours = Math.floor((Date.now() - new Date(source.lastScraped).getTime()) / (1000 * 60 * 60));
    if (hours < 6) return 'text-green-600';
    return 'text-yellow-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">📊 Job Sources</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage job scraping from all sources
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleScrapeAll}
            disabled={scraping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 text-sm"
          >
            <Play className="w-4 h-4" />
            {scraping ? 'Scraping...' : 'Scrape All'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Results Summary */}
      {result && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✅ Scraping Complete!</p>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Jobs:</span>
              <span className="ml-2 font-semibold">{result.total}</span>
            </div>
            <div>
              <span className="text-gray-600">New Jobs:</span>
              <span className="ml-2 font-semibold text-green-600">{result.newJobs}</span>
            </div>
            <div>
              <span className="text-gray-600">Successful:</span>
              <span className="ml-2 font-semibold text-blue-600">{result.success.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Failed:</span>
              <span className="ml-2 font-semibold text-red-600">{result.failed.length}</span>
            </div>
          </div>
          {result.failed.length > 0 && (
            <div className="mt-2 text-sm text-red-600">
              Failed sources: {result.failed.map((f: any) => f.source).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Sources List */}
      <div className="space-y-3">
        {sources.map((source) => (
          <div
            key={source.name}
            className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
              source.active ? 'hover:border-blue-300' : 'opacity-60'
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-shrink-0">
                {getStatusIcon(source)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{source.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    source.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {source.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {source.jobCount} jobs
                  </span>
                  <span className={`flex items-center gap-1 ${getStatusColor(source)}`}>
                    <Clock className="w-3 h-3" />
                    {getStatusText(source)}
                  </span>
                  {source.lastScraped && (
                    <span className="text-xs text-gray-400">
                      {new Date(source.lastScraped).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleScrapeSource(source.name)}
              disabled={scraping || !source.active}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Scrape
            </button>
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-500">
        <span>Total Sources: {sources.length}</span>
        <span>Active: {sources.filter(s => s.active).length}</span>
        <span>Total Jobs: {sources.reduce((acc, s) => acc + s.jobCount, 0)}</span>
      </div>
    </div>
  );
}