import { Metadata } from "next";
import { notFound } from "next/navigation";
import { mergeArtworksWithTranslations } from "@/lib/artworks";
import ArtworkDetailView from "@/components/ArtworkDetailView";
import { CategorySection, Artwork } from "@/types/artwork";
import { getTranslations } from "next-intl/server";
import { getSiteKeywords } from "@/lib/config";
import { getTenantId } from "@/lib/tenant";

interface ArtworkPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: ArtworkPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const tenantId = await getTenantId();

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
  const sections: CategorySection[] = await mergeArtworksWithTranslations(
    tenantId,
    translateFn,
  );
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

  const siteName = t("Site.name", { artistName: t("Artist.name") });
  const siteKeywords = await getSiteKeywords(tenantId);

  return {
    title: artwork.title,
    description: artwork.description,
    keywords: [artwork.title, artwork.category, artwork.medium, ...siteKeywords]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      title: artwork.title,
      description: artwork.description,
      type: "article",
      siteName: siteName,
      locale: locale === "en" ? "en_US" : locale,
      authors: [t("Artist.name")],
    },
    twitter: {
      card: "summary",
      title: artwork.title,
      description: artwork.description,
    },
    authors: [{ name: t("Artist.name") }],
    category: t(`Categories.${artwork.category}.title`),
  };
}

// Artwork pages are fully dynamic in multi-tenant mode — tenant resolution
// requires headers() which is incompatible with static generation.
export const dynamic = "force-dynamic";

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { locale, id } = await params;
  const tenantId = await getTenantId();

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
  const sections: CategorySection[] = await mergeArtworksWithTranslations(
    tenantId,
    translateFn,
  );
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
