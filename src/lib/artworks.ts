import "server-only";

import { promises as fs } from "fs";
import { CategorySection, Artwork } from "@/types/artwork";
import { tenantDataPath } from "@/lib/tenant";

// Interface for base artwork data (before translation)
interface BaseArtwork {
  id: string;
  imageUrl: string;
  category: string;
  mediumKey: string;
  dimensions: string;
  year: number;
}

interface BaseCategorySection {
  id: string;
  artworks: BaseArtwork[];
}

interface ArtworksBaseData {
  categorySections: BaseCategorySection[];
}

/**
 * Load the base artwork data for a tenant from
 * `data/tenants/{tenantId}/artworks-base.json`.
 */
async function loadBaseArtworks(
  tenantId: string,
): Promise<BaseCategorySection[]> {
  const filePath = tenantDataPath(tenantId, "artworks-base.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data: ArtworksBaseData = JSON.parse(raw);
  return data.categorySections;
}

// Utility function to merge base artwork data with translations
// Note: This function expects a translation function to be passed in
export async function mergeArtworksWithTranslations(
  tenantId: string,
  t: (key: string) => string,
): Promise<CategorySection[]> {
  const baseSections = await loadBaseArtworks(tenantId);

  return baseSections.map((section) => ({
    id: section.id as CategorySection["id"],
    title: t(`Categories.${section.id}.title`),
    description: t(`Categories.${section.id}.description`),
    artworks: section.artworks.map((artwork) => ({
      id: artwork.id,
      imageUrl: artwork.imageUrl,
      category: artwork.category as Artwork["category"],
      dimensions: artwork.dimensions,
      year: artwork.year,
      title: t(`Artworks.${artwork.id}.title`),
      description: t(`Artworks.${artwork.id}.description`),
      medium: t(`Mediums.${artwork.mediumKey}`),
    })),
  }));
}

// Get base artwork data (without translations)
export async function getBaseArtworks(
  tenantId: string,
): Promise<BaseCategorySection[]> {
  return loadBaseArtworks(tenantId);
}

// Utility function to filter artworks
function filterArtworks(
  sections: CategorySection[],
  category?: string,
  year?: string,
  medium?: string,
  search?: string,
): CategorySection[] {
  return sections
    .map((section) => {
      // If category is specified and doesn't match, skip this section
      if (category && section.id !== category) {
        return null;
      }

      let filteredArtworks = section.artworks;

      // Filter by year
      if (year) {
        filteredArtworks = filteredArtworks.filter(
          (art) => art.year === parseInt(year),
        );
      }

      // Filter by medium
      if (medium) {
        filteredArtworks = filteredArtworks.filter((art) =>
          art.medium?.toLowerCase().includes(medium.toLowerCase()),
        );
      }

      // Filter by search term (in title or description)
      if (search) {
        const searchLower = search.toLowerCase();
        filteredArtworks = filteredArtworks.filter(
          (art) =>
            art.title.toLowerCase().includes(searchLower) ||
            art.description.toLowerCase().includes(searchLower),
        );
      }

      if (filteredArtworks.length === 0) {
        return null;
      }

      return {
        ...section,
        artworks: filteredArtworks,
      };
    })
    .filter((section): section is CategorySection => section !== null);
}

// Utility function to sort artworks
function sortArtworks(
  sections: CategorySection[],
  sortBy?: string,
  order: "asc" | "desc" = "asc",
): CategorySection[] {
  return sections.map((section) => ({
    ...section,
    artworks: [...section.artworks].sort((a, b) => {
      let comparison: number;
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "year":
          comparison = (a.year || 0) - (b.year || 0);
          break;
        default:
          return 0;
      }
      return order === "asc" ? comparison : -comparison;
    }),
  }));
}

interface GetArtworksOptions {
  category?: string;
  year?: string;
  medium?: string;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

// Legacy function - now expects pre-translated sections
export async function getArtworks(
  sections: CategorySection[],
  options: GetArtworksOptions = {},
): Promise<CategorySection[]> {
  const { category, year, medium, search, sortBy, order = "asc" } = options;

  // Apply filters
  let filteredSections = filterArtworks(
    sections,
    category,
    year,
    medium,
    search,
  );

  // Apply sorting
  if (sortBy) {
    filteredSections = sortArtworks(filteredSections, sortBy, order);
  }

  return filteredSections;
}
