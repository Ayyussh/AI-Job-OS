import { ApplicationTracker } from '@/components/ApplicationTracker';

export default function ApplicationsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📋 Application Tracker</h1>
        <p className="text-gray-600 mt-2">
          Track and manage all your job applications in one place
        </p>
      </div>
      
      <ApplicationTracker />
    </div>
  );
}