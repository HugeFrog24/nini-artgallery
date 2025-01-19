'use client';

import { CategorySection } from '@/types/artwork';
import SectionHeader from './SectionHeader';
import ArtworkGrid from './ArtworkGrid';

interface SectionContainerProps {
  section: CategorySection;
  onSort: (sortBy: string, order: 'asc' | 'desc') => void;
}

export default function SectionContainer({ section, onSort }: SectionContainerProps) {
  return (
    <section 
      aria-labelledby={`heading-${section.id}`}
      className="bg-white rounded-lg p-4 shadow-sm"
    >
      <SectionHeader
        id={section.id}
        title={section.title}
        description={section.description}
        onSort={onSort}
      />
      <ArtworkGrid 
        artworks={section.artworks} 
        category={section.title}
      />
    </section>
  );
}