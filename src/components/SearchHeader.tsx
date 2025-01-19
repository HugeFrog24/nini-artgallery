'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface SearchHeaderProps {
  currentSearch: string;
  onSearch: (searchTerm: string) => void;
  isLoading: boolean;
}

export default function SearchHeader({ currentSearch, onSearch, isLoading }: SearchHeaderProps) {
  const [searchTerm, setSearchTerm] = useState(currentSearch);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Nini&apos;s Art Gallery</h1>
          <p className="text-sm text-gray-600">A multi-disciplinary collection of artworks</p>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search artworks..."
              className="block w-full pl-4 pr-24 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin mr-3" aria-hidden="true" />
              ) : (
                <button
                  type="submit"
                  className="h-full px-4 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 transition-colors duration-200 focus:outline-none rounded-r-md"
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