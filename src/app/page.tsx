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

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Wait for searchParams to be ready
  const params = await Promise.resolve(searchParams);
  
  const search = typeof params.search === 'string' 
    ? params.search 
    : Array.isArray(params.search)
    ? params.search[0]
    : undefined;

  const sortBy = typeof params.sortBy === 'string' ? params.sortBy : undefined;
  const order = typeof params.order === 'string' ? params.order as 'asc' | 'desc' : 'asc';
  const category = typeof params.category === 'string' ? params.category : undefined;

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
