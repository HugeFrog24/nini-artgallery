'use client';

import { useState, useMemo } from 'react';
import { CategorySection, Artwork } from '@/types/artwork';
import SectionHeader from './SectionHeader';
import ArtworkGrid from './ArtworkGrid';

interface SectionContainerProps {
  section: CategorySection;
}

export default function SectionContainer({ section }: SectionContainerProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    order: 'asc' | 'desc';
  } | null>(null);

  const sortedArtworks = useMemo(() => {
    if (!sortConfig) return section.artworks;

    return [...section.artworks].sort((a: Artwork, b: Artwork) => {
      const aValue = a[sortConfig.key as keyof Artwork];
      const bValue = b[sortConfig.key as keyof Artwork];

      if (aValue === undefined || bValue === undefined) return 0;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      return sortConfig.order === 'asc' ? comparison : -comparison;
    });
  }, [section.artworks, sortConfig]);

  const handleSort = (sortBy: string, order: 'asc' | 'desc') => {
    setSortConfig({ key: sortBy, order });
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
        artworks={sortedArtworks}
        category={section.title}
      />
    </section>
  );
}