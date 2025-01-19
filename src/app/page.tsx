import { Metadata } from "next";
import { CategorySection } from "@/types/artwork";
import GalleryContainer from "@/components/GalleryContainer";

export const metadata: Metadata = {
  title: "Nini's Art Gallery | Multi-disciplinary Art Collection",
  description: "Explore Nini's diverse collection featuring origami, crochet items, paintings, and nail art designs. Each piece showcases unique creativity and craftsmanship.",
  keywords: ["art gallery", "origami", "crochet", "paintings", "nail art", "handmade", "crafts"],
};

// Mark the page as dynamic to ensure it's not statically optimized
export const dynamic = 'force-dynamic';
// Disable caching for this route
export const revalidate = 0;

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function Home({ searchParams }: PageProps) {
  const search = typeof searchParams.search === 'string' 
    ? searchParams.search 
    : Array.isArray(searchParams.search)
    ? searchParams.search[0]
    : undefined;

  const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : undefined;
  const order = typeof searchParams.order === 'string' ? searchParams.order as 'asc' | 'desc' : 'asc';
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;

  const url = new URL('/api/artworks', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
  if (search) url.searchParams.set('search', search);
  if (sortBy) url.searchParams.set('sortBy', sortBy);
  if (order) url.searchParams.set('order', order);
  if (category) url.searchParams.set('category', category);

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch artworks');

  const categorySections: CategorySection[] = await response.json();
  return <GalleryContainer initialSections={categorySections} />;
}
