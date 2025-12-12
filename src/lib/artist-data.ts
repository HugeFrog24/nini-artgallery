import { ArtistData, ArtistTranslations } from "@/types/admin";

/**
 * Get artist data for a specific locale using hybrid approach
 * This version is edge-compatible and doesn't use Node.js fs operations
 * Priority: user translations > primary language > static translations
 */
export async function getArtistData(
  locale: string,
): Promise<{ name: string; description: string }> {
  try {
    // Try to load user data from data/ directory
    const [artistData, artistTranslations] = await Promise.all([
      import("../../data/artist.json"),
      import("../../data/artist-translations.json"),
    ]);

    const userArtistData = artistData.default as ArtistData;
    const userTranslations = artistTranslations.default as ArtistTranslations;

    // Check if we have a translation for the requested locale
    if (userTranslations[locale]) {
      return {
        name: userTranslations[locale].name,
        description: userTranslations[locale].description,
      };
    }

    // Fall back to primary language from artist.json
    if (userArtistData.name && userArtistData.description) {
      return {
        name: userArtistData.name,
        description: userArtistData.description,
      };
    }
  } catch (error) {
    // If user data is not available, fall back to static translations
    console.warn(
      "User artist data not available, falling back to static translations:",
      error,
    );
  }

  // Final fallback: static translations
  const staticTranslation = await getStaticArtistTranslation(locale);
  return staticTranslation;
}

/**
 * Get static artist translation from messages/artist/ (fallback for Weblate/Tolgee)
 * This uses dynamic imports which work in edge runtime
 */
export async function getStaticArtistTranslation(
  locale: string,
): Promise<{ name: string; description: string }> {
  const translation = await import(`../../messages/artist/${locale}.json`);
  return translation.default;
}
