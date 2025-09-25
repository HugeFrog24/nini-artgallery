import { Metadata } from "next";
import GalleryContainer from "@/components/GalleryContainer";
import { getTranslations } from "next-intl/server";
import { getArtworks, mergeArtworksWithTranslations } from "@/lib/artworks";
import { getSiteKeywords } from "@/lib/config";

// Generate metadata using translations
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  
  return {
    title: `${t('Site.name', { artistName: t('Artist.name') })} | ${t('Site.description')}`,
    description: t('Site.longDescription', { artistName: t('Artist.name') }),
    keywords: getSiteKeywords(),
  };
}

// Mark the page as dynamic to ensure it's not statically optimized
export const dynamic = 'force-dynamic';
// Disable caching for this route
export const revalidate = 0;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await the searchParams since it's now a Promise in Next.js 15
  const params = await searchParams;
  
  const search = typeof params.search === 'string' 
    ? params.search 
    : Array.isArray(params.search)
    ? params.search[0]
    : undefined;

  const sortBy = typeof params.sortBy === 'string' ? params.sortBy : undefined;
  const order = typeof params.order === 'string' ? params.order as 'asc' | 'desc' : 'asc';
  const category = typeof params.category === 'string' ? params.category : undefined;

  // Use getTranslations directly in server component (proper Next.js approach)
  const t = await getTranslations();
  
  // Create translation function compatible with mergeArtworksWithTranslations
  const translateFn = (key: string) => {
    try {
      return t(key);
    } catch {
      // Always fail early - missing translations should never be tolerated
      const errorMessage = `Translation missing for key: ${key}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  // Get translated sections directly without API call
  const translatedSections = mergeArtworksWithTranslations(translateFn);
  
  // Apply filters and sorting
  const categorySections = await getArtworks(translatedSections, {
    category,
    search,
    sortBy,
    order
  });
  return <GalleryContainer initialSections={categorySections} />;
}
