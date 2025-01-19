import { Artwork } from "@/types/artwork";
import ArtworkCard from "./ArtworkCard";

interface ArtworkGridProps {
  artworks: Artwork[];
  category: string;
}

export default function ArtworkGrid({ artworks, category }: ArtworkGridProps) {
  return (
    <div 
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2"
      aria-label={`${category} gallery`}
    >
      {artworks.map((artwork) => (
        <ArtworkCard key={artwork.id} artwork={artwork} />
      ))}
    </div>
  );
}