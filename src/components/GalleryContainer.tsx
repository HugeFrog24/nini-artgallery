'use client';

import { useState } from 'react';
import { CategorySection } from '@/types/artwork';
import SearchHeader from './SearchHeader';
import SectionContainer from './SectionContainer';
import { useRouter, useSearchParams } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getSiteConfig, getArtistProfile, getPersonalMessage } from '@/lib/config';

interface GalleryContainerProps {
  initialSections: CategorySection[];
}

export default function GalleryContainer({ initialSections }: GalleryContainerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isNoteVisible, setIsNoteVisible] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const siteConfig = getSiteConfig();
  const artistProfile = getArtistProfile();
  const personalMessage = getPersonalMessage();

  const updateSearchParams = async (updates: Record<string, string | undefined>) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      await router.push(`/?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <SearchHeader
        currentSearch={searchParams.get('search') || ''}
        onSearch={(term) => updateSearchParams({ search: term })}
        isLoading={isLoading}
      />
      
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <section className="prose prose-sm max-w-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-4 transition-colors">
            <div className="border-l-4 border-accent-200 pl-4 mb-6">
              <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                <span className="text-2xl font-medium block mb-2">{artistProfile.greeting}</span>
                <p>
                  {artistProfile.description}
                </p>
              </div>
            </div>
            {personalMessage.enabled && isNoteVisible && (
              <div className="bg-accent-50 dark:bg-accent-500/10 rounded-lg p-4 border border-accent-100 dark:border-accent-500/20 relative transition-colors">
                {personalMessage.dismissible && (
                  <button
                    onClick={() => setIsNoteVisible(false)}
                    className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    aria-label={personalMessage.ariaLabel}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
                <p className="text-gray-800 dark:text-gray-200 italic leading-relaxed pr-8">
                  {personalMessage.message}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      
      <div className="max-w-7xl mx-auto px-2 space-y-8">
        {initialSections.length > 0 ? (
          initialSections.map((section) => (
            <SectionContainer
              key={section.id}
              section={section}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{siteConfig.noResultsMessage}</p>
          </div>
        )}
      </div>
    </main>
  );
}