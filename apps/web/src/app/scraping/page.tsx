import { ScrapingDashboard } from '@/components/ScrapingDashboard';

export default function ScrapingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Job Scraping Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage automated job scraping from all sources
        </p>
      </div>
      
      <ScrapingDashboard />
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">ℹ️ About Scraping</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Jobs are automatically scraped every 6 hours</li>
          <li>• You can manually trigger scraping for all sources or individual sources</li>
          <li>• Each source has its own scraper implementation</li>
          <li>• New jobs are added, existing jobs are updated</li>
        </ul>
      </div>
    </div>
  );
}