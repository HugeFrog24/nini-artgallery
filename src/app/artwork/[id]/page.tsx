import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArtworkById, getAllArtworks } from "@/lib/artworks";
import { getSiteConfig } from "@/lib/config";
import ArtworkDetailView from "@/components/ArtworkDetailView";

const siteConfig = getSiteConfig();

interface ArtworkPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  const { id } = await params;
  const artwork = await getArtworkById(id);

  if (!artwork) {
    return {
      title: "Artwork Not Found",
      description: "The requested artwork could not be found.",
    };
  }

  return {
    title: `${artwork.title} | ${siteConfig.siteName}`,
    description: artwork.description,
    keywords: [
      artwork.title,
      artwork.category,
      artwork.medium,
      ...siteConfig.siteKeywords,
    ].filter(Boolean).join(", "),
    openGraph: {
      title: `${artwork.title} | ${siteConfig.siteName}`,
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
      title: `${artwork.title} | ${siteConfig.siteName}`,
      description: artwork.description,
      images: artwork.imageUrl ? [artwork.imageUrl] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const artworks = await getAllArtworks();
  return artworks.map((artwork) => ({
    id: artwork.id,
  }));
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { id } = await params;
  const artwork = await getArtworkById(id);

  if (!artwork) {
    notFound();
  }

  return <ArtworkDetailView artwork={artwork} />;
}