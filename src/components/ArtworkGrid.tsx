"use client";

import { Artwork } from "@/types/artwork";
import ArtworkCard from "./ArtworkCard";
import { useTranslations } from "next-intl";

interface ArtworkGridProps {
  artworks: Artwork[];
  category: string;
}

export default function ArtworkGrid({ artworks, category }: ArtworkGridProps) {
  const t = useTranslations();

  return (
    <div
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2"
      aria-label={t("Gallery.categoryGallery", { category })}
    >
      {artworks.map((artwork) => (
        <ArtworkCard key={artwork.id} artwork={artwork} />
      ))}
    </div>
  );
}
