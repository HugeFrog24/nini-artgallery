'use client';

import { useState, useCallback, useEffect } from 'react';
import { CategorySection } from '@/types/artwork';
import SearchHeader from './SearchHeader';
import SectionContainer from './SectionContainer';

interface GalleryContainerProps {
  initialSections: CategorySection[];
}

export default function GalleryContainer({ initialSections }: GalleryContainerProps) {
  const [sections, setSections] = useState<CategorySection[]>(initialSections);

  const handleSearch = useCallback((newSections: CategorySection[]) => {
    console.log('handleSearch called with:', newSections);
    setSections(newSections);
  }, []);

  // Update sections when initialSections change (e.g., on page load)
  useEffect(() => {
    console.log('initialSections changed:', initialSections);
    setSections(initialSections);
  }, [initialSections]);

  console.log('Current sections state:', sections);

  return (
    <main className="min-h-screen bg-gray-50">
      <SearchHeader onSearch={handleSearch} />
      
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <section className="prose prose-sm max-w-none">
          <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
            <div className="border-l-4 border-pink-200 pl-4 mb-6">
              <div className="text-gray-800 leading-relaxed">
                <span className="text-2xl font-medium block mb-2">Hi! I&apos;m Nini.</span>
                <p>
                  A cute Georgian girl with a passion for art and design.
                  I love expressing my creativity through different mediums - from paper folding
                  to nail designs. Each piece I create carries a bit of my soul and the warmth
                  of my homeland. When I&apos;m not crafting something new, you can find me dreaming up
                  my next artistic adventure! ✨
                </p>
              </div>
            </div>
            <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
              <p className="text-gray-800 italic leading-relaxed">
                To my Tibik! Every color I pick has your smile in it. Every origami fold holds our hugs.
                I put pieces of our love in each artwork - so everyone can see you belong to me!
                Your support makes my hands create better, but these creations are just to keep
                you closer. No one else can inspire my art like you do. No one else can have your
                hugs or see your special smile. You are my art, my inspiration, my everything.
                No running away from my gallery of love! ❤️
              </p>
            </div>
          </div>
        </section>
      </div>
      
      <div className="max-w-7xl mx-auto px-2 space-y-8">
        {sections.length > 0 ? (
          sections.map((section) => (
            <SectionContainer 
              key={section.id}
              section={section}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No artworks found matching your search.</p>
          </div>
        )}
      </div>
    </main>
  );
}