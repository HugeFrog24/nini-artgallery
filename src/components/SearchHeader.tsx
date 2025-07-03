'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getSiteConfig } from '@/lib/config';

interface SearchHeaderProps {
  currentSearch: string;
  onSearch: (searchTerm: string) => void;
  isLoading: boolean;
}

export default function SearchHeader({ currentSearch, onSearch, isLoading }: SearchHeaderProps) {
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const siteConfig = getSiteConfig();

  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  return (
    <header className="bg-white shadow-sm py-4 px-4 mb-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 hover:text-accent-600 transition-colors">
              {siteConfig.siteName}
            </h1>
          </Link>
          <p className="text-sm text-gray-600">{siteConfig.siteSubheading}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={siteConfig.searchPlaceholder}
              className="block w-full pl-4 pr-24 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin mr-3" aria-hidden="true" />
              ) : (
                <button
                  type="submit"
                  className="h-full px-4 py-2 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 transition-colors duration-200 focus:outline-none rounded-r-md"
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </header>
  );
}