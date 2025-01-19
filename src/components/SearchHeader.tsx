'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CategorySection } from '@/types/artwork';

interface SearchHeaderProps {
  onSearch: (sections: CategorySection[]) => void;
}

export default function SearchHeader({ onSearch }: SearchHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(false);

  // Initial load - always perform search to show all items or filtered results
  useEffect(() => {
    const query = searchParams.get('search') || '';
    setSearchTerm(query);
    performSearch(query);
  }, []); // Only run on mount

  const performSearch = async (value: string) => {
    setIsLoading(true);
    try {
      const trimmedValue = value.trim();
      
      // Create params for API request
      const params = new URLSearchParams();
      if (trimmedValue) {
        params.set('search', trimmedValue);
      }

      // Always fetch results (empty search = show all)
      const response = await fetch(`/api/artworks?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch artworks');
      const filteredSections = await response.json();
      
      // Update sections
      onSearch(filteredSections);
      
      // Update URL - only include search in URL if we have a value
      const newPath = trimmedValue ? `/?${params.toString()}` : '/';
      router.replace(newPath, { scroll: false });
    } catch (error) {
      console.error('Error searching artworks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  return (
    <header className="bg-white shadow-sm py-4 px-4 mb-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Nini&apos;s Art Gallery</h1>
          <p className="text-sm text-gray-600">A multi-disciplinary collection of artworks</p>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search artworks..."
              className="block w-full pl-10 pr-24 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin mr-3" aria-hidden="true" />
              ) : (
                <button
                  type="submit"
                  className="h-full px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 focus:outline-none"
                >
                  Search
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </header>
  );
}