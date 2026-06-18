'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getScrapingStatus, 
  scrapeAllSources, 
  scrapeSource,
  ScrapingStatus 
} from '@/lib/scraping-api';
import { RefreshCw, Play, CheckCircle, XCircle, Clock, Database, Loader2 } from 'lucide-react';

export function ScrapingDashboard() {
  const [sources, setSources] = useState<ScrapingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

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

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleScrapeAll = async () => {
    setScraping(true);
    setResult(null);
    setLogs([]);
    addLog('🚀 Starting scrape all sources...');
    
    try {
      const data = await scrapeAllSources();
      setResult(data);
      addLog(`✅ Scraping complete! Found ${data.total} jobs, ${data.newJobs} new`);
      if (data.success.length > 0) {
        data.success.forEach((s: any) => addLog(`✅ ${s.source}: ${s.count} jobs`));
      }
      if (data.failed.length > 0) {
        data.failed.forEach((f: any) => addLog(`❌ ${f.source}: ${f.error}`));
      }
      await fetchStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scraping failed';
      setError(msg);
      addLog(`❌ Error: ${msg}`);
    } finally {
      setScraping(false);
    }
  };

  const handleScrapeSource = async (sourceName: string) => {
    setScraping(true);
    addLog(`🔍 Scraping ${sourceName}...`);
    try {
      const data = await scrapeSource(sourceName);
      addLog(`✅ ${sourceName}: ${data.count} jobs found`);
      await fetchStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to scrape ${sourceName}`;
      setError(msg);
      addLog(`❌ ${sourceName}: ${msg}`);
    } finally {
      setScraping(false);
    }
  };

  const getStatusIcon = (source: ScrapingStatus) => {
    if (!source.active) return <XCircle className="w-5 h-5 text-gray-400" />;
    if (source.lastScraped) {
      const hours = Math.floor((Date.now() - new Date(source.lastScraped).getTime()) / (1000 * 60 * 60));
      if (hours < 6) return <CheckCircle className="w-5 h-5 text-green-500" />;
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-20 bg-gray-200 rounded"></div></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">📊 Job Sources</h2>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered filtering: Only jobs matching your skills will be saved
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleScrapeAll}
            disabled={scraping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 text-sm"
          >
            {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
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
            <div><span className="text-gray-600">Total Jobs:</span> <span className="ml-2 font-semibold">{result.total}</span></div>
            <div><span className="text-gray-600">New Jobs:</span> <span className="ml-2 font-semibold text-green-600">{result.newJobs}</span></div>
            <div><span className="text-gray-600">Successful:</span> <span className="ml-2 font-semibold text-blue-600">{result.success.length}</span></div>
            <div><span className="text-gray-600">Failed:</span> <span className="ml-2 font-semibold text-red-600">{result.failed.length}</span></div>
          </div>
        </div>
      )}

      {/* Live Logs */}
      {logs.length > 0 && (
        <div className="mb-4 p-3 bg-gray-900 text-gray-100 rounded-lg font-mono text-xs max-h-40 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="py-0.5">{log}</div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}

      {/* Sources List */}
      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.name} className={`flex items-center justify-between p-4 border rounded-lg ${source.active ? 'hover:border-blue-300' : 'opacity-60'}`}>
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-shrink-0">{getStatusIcon(source)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{source.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${source.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {source.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {source.jobCount} jobs
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {source.jobCount} jobs
                  </span>
                  {source.lastScraped && (
                    <span className="text-xs text-gray-400">
                      Last: {new Date(source.lastScraped).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleScrapeSource(source.name)}
              disabled={scraping || !source.active}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Scrape
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-500">
        <span>Total Sources: {sources.length}</span>
        <span>Active: {sources.filter(s => s.active).length}</span>
        <span>Total Jobs: {sources.reduce((acc, s) => acc + s.jobCount, 0)}</span>
      </div>
    </div>
  );
}