import { Metadata } from "next";
import GalleryContainer from "@/components/GalleryContainer";
import { getTranslations } from "next-intl/server";
import { getArtworks, mergeArtworksWithTranslations } from "@/lib/artworks";
import { getSiteKeywords } from "@/lib/config";

interface HomeProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate metadata using translations
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
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

export default async function Home({ params, searchParams }: HomeProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  
  const search = typeof searchParamsResolved.search === 'string' 
    ? searchParamsResolved.search 
    : Array.isArray(searchParamsResolved.search)
    ? searchParamsResolved.search[0]
    : undefined;

  const sortBy = typeof searchParamsResolved.sortBy === 'string' ? searchParamsResolved.sortBy : undefined;
  const order = typeof searchParamsResolved.order === 'string' ? searchParamsResolved.order as 'asc' | 'desc' : 'asc';
  const category = typeof searchParamsResolved.category === 'string' ? searchParamsResolved.category : undefined;

  // Use getTranslations with locale parameter
  const t = await getTranslations({ locale });
  
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