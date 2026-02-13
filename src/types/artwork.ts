type ArtCategory = "origami" | "crochet" | "paintings" | "fingernails";

export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: ArtCategory;
  dimensions?: string;
  medium?: string;
  year?: number;
}

export interface CategorySection {
  id: ArtCategory;
  title: string;
  description: string;
  artworks: Artwork[];
}
