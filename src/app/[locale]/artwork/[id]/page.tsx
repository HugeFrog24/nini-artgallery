import { Metadata } from "next";
import { notFound } from "next/navigation";
import { mergeArtworksWithTranslations } from "@/lib/artworks";
import ArtworkDetailView from "@/components/ArtworkDetailView";
import { CategorySection, Artwork } from "@/types/artwork";
import { getTranslations } from "next-intl/server";
import { getSiteKeywords } from "@/lib/config";
import { SUPPORTED_LOCALES } from "@/lib/locales";

interface ArtworkPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  
  // For metadata generation, use getTranslations with locale
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
  
  // Get translated sections directly
  const sections: CategorySection[] = mergeArtworksWithTranslations(translateFn);
  let artwork: Artwork | null = null;
  for (const section of sections) {
    artwork = section.artworks.find((art: Artwork) => art.id === id) || null;
    if (artwork) break;
  }

  if (!artwork) {
    return {
      title: "Artwork Not Found",
      description: "The requested artwork could not be found.",
    };
  }

  const siteName = t('Site.name', { artistName: t('Artist.name') });
  const siteKeywords = getSiteKeywords();
  
  return {
    title: `${artwork.title} | ${siteName}`,
    description: artwork.description,
    keywords: [
      artwork.title,
      artwork.category,
      artwork.medium,
      ...siteKeywords,
    ].filter(Boolean).join(", "),
    openGraph: {
      title: `${artwork.title} | ${siteName}`,
      description: artwork.description,
      type: "article",
      images: artwork.imageUrl ? [
        {
          url: artwork.imageUrl,
          width: 800,
          height: 600,
          alt: artwork.title,
        }
      ] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${artwork.title} | ${siteName}`,
      description: artwork.description,
      images: artwork.imageUrl ? [artwork.imageUrl] : undefined,
    },
  };
}

export async function generateStaticParams() {
  // Generate params for all locale/artwork combinations
  const { getBaseArtworks } = await import('@/lib/artworks');
  const baseSections = getBaseArtworks();
  const artworks = baseSections.flatMap(section => section.artworks);
  
  const params = [];
  for (const locale of SUPPORTED_LOCALES) {
    for (const artwork of artworks) {
      params.push({
        locale: locale.code,
        id: artwork.id,
      });
    }
  }
  
  return params;
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { locale, id } = await params;
  
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
  
  // Get translated sections directly
  const sections: CategorySection[] = mergeArtworksWithTranslations(translateFn);
  let artwork: Artwork | null = null;
  for (const section of sections) {
    artwork = section.artworks.find((art: Artwork) => art.id === id) || null;
    if (artwork) break;
  }

  if (!artwork) {
    notFound();
  }

  return <ArtworkDetailView artwork={artwork} />;
}