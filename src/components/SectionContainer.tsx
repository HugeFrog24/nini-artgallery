"use client";

import { useState, useMemo } from "react";
import { CategorySection, Artwork } from "@/types/artwork";
import SectionHeader from "./SectionHeader";
import ArtworkGrid from "./ArtworkGrid";

interface SectionContainerProps {
  section: CategorySection;
}

export default function SectionContainer({ section }: SectionContainerProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    order: "asc" | "desc";
  } | null>(null);

  const sortedArtworks = useMemo(() => {
    if (!sortConfig) return section.artworks;

    return [...section.artworks].sort((a: Artwork, b: Artwork) => {
      const aValue = a[sortConfig.key as keyof Artwork];
      const bValue = b[sortConfig.key as keyof Artwork];

      if (aValue === undefined || bValue === undefined) return 0;

      const comparison =
        typeof aValue === "string" && typeof bValue === "string"
          ? aValue.localeCompare(bValue)
          : aValue < bValue ? -1 : aValue > bValue ? 1 : 0;

      return sortConfig.order === "asc" ? comparison : -comparison;
    });
  }, [section.artworks, sortConfig]);

  const handleSort = (sortBy: string, order: "asc" | "desc") => {
    setSortConfig({ key: sortBy, order });
  };

  return (
    <section
      aria-labelledby={`heading-${section.id}`}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm transition-colors"
    >
      <SectionHeader
        id={section.id}
        title={section.title}
        description={section.description}
        onSort={handleSort}
      />
      <ArtworkGrid artworks={sortedArtworks} categoryId={section.id} />
    </section>
  );
}
