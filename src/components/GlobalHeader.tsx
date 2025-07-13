'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getSiteConfig } from '@/lib/config';

export default function GlobalHeader() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const siteConfig = getSiteConfig();

  // Initialize search term from URL params
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    setSearchTerm(currentSearch);
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide header when scrolling down and past a threshold
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchTerm.trim();
    
    setIsLoading(true);
    try {
      // If we're not on the home page, navigate to home with search
      if (pathname !== '/') {
        if (trimmedSearch) {
          await router.push(`/?search=${encodeURIComponent(trimmedSearch)}`);
        } else {
          await router.push('/');
        }
      } else {
        // If we're on the home page, update search params
        const params = new URLSearchParams(searchParams.toString());
        if (trimmedSearch) {
          params.set('search', trimmedSearch);
        } else {
          params.delete('search');
        }
        await router.push(`/?${params.toString()}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50
        bg-white dark:bg-gray-900 shadow-sm py-4 px-4
        transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 hover:text-accent-600 transition-colors">
              {siteConfig.siteName}
            </h1>
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-300">{siteConfig.siteSubheading}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={siteConfig.searchPlaceholder}
              className="block w-full pl-4 pr-24 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-300 focus:ring-1 focus:ring-accent-500 focus:border-accent-500 sm:text-sm transition-colors"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 animate-spin mr-3" aria-hidden="true" />
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