'use client';

import { useState } from 'react';
import { CategorySection } from '@/types/artwork';
import { getArtworks } from '@/data/artworks';
import SectionHeader from './SectionHeader';
import ArtworkGrid from './ArtworkGrid';

interface SectionContainerProps {
  section: CategorySection;
}

export default function SectionContainer({ section }: SectionContainerProps) {
  const [artworks, setArtworks] = useState(section.artworks);

  const handleSort = async (sortBy: string, order: 'asc' | 'desc') => {
    const sortedSections = await getArtworks({ 
      category: section.id, 
      sortBy, 
      order 
    });
    
    // Since we filtered by category, we'll only get one section back
    if (sortedSections.length > 0) {
      setArtworks(sortedSections[0].artworks);
    }
  };

  return (
    <section 
      aria-labelledby={`heading-${section.id}`}
      className="bg-white rounded-lg p-4 shadow-sm"
    >
      <SectionHeader
        id={section.id}
        title={section.title}
        description={section.description}
        onSort={handleSort}
      />
      <ArtworkGrid 
        artworks={artworks} 
        category={section.title}
      />
    </section>
  );
}