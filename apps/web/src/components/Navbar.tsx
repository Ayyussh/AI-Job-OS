'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AIStatus } from './AIStatus';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Jobs' },
    { href: '/resume', label: 'Resume' },
    { href: '/applications', label: 'Applications' },
    { href: '/scraping', label: 'Scraping' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition">
            AI Job OS
          </Link>
          
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <AIStatus />
          </div>
        </div>
      </div>
    </nav>
  );
}