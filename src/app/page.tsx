import { Metadata } from "next";
import { CategorySection } from "@/types/artwork";
import GalleryContainer from "@/components/GalleryContainer";
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: "Nini's Art Gallery | Multi-disciplinary Art Collection",
  description: "Explore Nini's diverse collection featuring origami, crochet items, paintings, and nail art designs. Each piece showcases unique creativity and craftsmanship.",
  keywords: ["art gallery", "origami", "crochet", "paintings", "nail art", "handmade", "crafts"],
};

export default async function Home({
  searchParams: rawSearchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get initial data from API
  const headersList = await headers();
  const searchParams = await rawSearchParams;
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  
  const url = new URL('/api/artworks', `${protocol}://${host}`);
  if (search) {
    url.searchParams.set('search', search);
  }

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch artworks');
  }

  const categorySections: CategorySection[] = await response.json();
  return <GalleryContainer initialSections={categorySections} />;
}
