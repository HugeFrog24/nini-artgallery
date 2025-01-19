import rawArtworksData from './artworks.json';
import { CategorySection } from '@/types/artwork';

// Type assertion for the imported JSON data
const artworksData: { categorySections: CategorySection[] } = rawArtworksData as {
  categorySections: CategorySection[];
};

// Utility function to filter artworks
function filterArtworks(
  sections: CategorySection[],
  category?: string,
  year?: string,
  medium?: string,
  search?: string
): CategorySection[] {
  return sections
    .map(section => {
      // If category is specified and doesn't match, skip this section
      if (category && section.id !== category) {
        return null;
      }

      let filteredArtworks = section.artworks;

      // Filter by year
      if (year) {
        filteredArtworks = filteredArtworks.filter(
          art => art.year === parseInt(year)
        );
      }

      // Filter by medium
      if (medium) {
        filteredArtworks = filteredArtworks.filter(
          art => art.medium?.toLowerCase().includes(medium.toLowerCase())
        );
      }

      // Filter by search term (in title or description)
      if (search) {
        const searchLower = search.toLowerCase();
        filteredArtworks = filteredArtworks.filter(
          art =>
            art.title.toLowerCase().includes(searchLower) ||
            art.description.toLowerCase().includes(searchLower)
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
  order: 'asc' | 'desc' = 'asc'
): CategorySection[] {
  return sections.map(section => ({
    ...section,
    artworks: [...section.artworks].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'year':
          comparison = (a.year || 0) - (b.year || 0);
          break;
        default:
          return 0;
      }
      return order === 'asc' ? comparison : -comparison;
    }),
  }));
}

interface GetArtworksOptions {
  category?: string;
  year?: string;
  medium?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export async function getArtworks(options: GetArtworksOptions = {}) {
  const { category, year, medium, search, sortBy, order = 'asc' } = options;
  
  let sections = artworksData.categorySections;

  // Apply filters
  sections = filterArtworks(sections, category, year, medium, search);

  // Apply sorting
  if (sortBy) {
    sections = sortArtworks(sections, sortBy, order);
  }

  return sections;
}