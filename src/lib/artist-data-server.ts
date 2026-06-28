import "server-only";

import { promises as fs } from "fs";
import { ArtistData, ArtistTranslations } from "@/types/admin";
import { tenantDataPath } from "@/lib/tenant";

// Cache for artist data to avoid repeated file reads — keyed by tenantId
const artistDataCache = new Map<string, ArtistData>();
const artistTranslationsCache = new Map<string, ArtistTranslations>();

/**
 * Read the primary artist data from data/tenants/{tenantId}/artist.json
 */
export async function readUserArtistData(
  tenantId: string,
): Promise<ArtistData> {
  const cached = artistDataCache.get(tenantId);
  if (cached) return cached;

  const filePath = tenantDataPath(tenantId, "artist.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const data: ArtistData = JSON.parse(fileContent);
  artistDataCache.set(tenantId, data);
  return data;
}

/**
 * Read user-provided translations from data/tenants/{tenantId}/artist-translations.json
 */
export async function readUserArtistTranslations(
  tenantId: string,
): Promise<ArtistTranslations> {
  const cached = artistTranslationsCache.get(tenantId);
  if (cached) return cached;

  const filePath = tenantDataPath(tenantId, "artist-translations.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const data: ArtistTranslations = JSON.parse(fileContent);
  artistTranslationsCache.set(tenantId, data);
  return data;
}

/**
 * Write artist data to data/tenants/{tenantId}/artist.json
 */
export async function writeUserArtistData(
  tenantId: string,
  data: Omit<ArtistData, "defaultLanguage">,
): Promise<void> {
  const userData = await readUserArtistData(tenantId);
  const updatedData: ArtistData = {
    ...data,
    defaultLanguage: userData.defaultLanguage,
  };

  const filePath = tenantDataPath(tenantId, "artist.json");
  await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), "utf-8");

  // Clear cache to force reload
  artistDataCache.delete(tenantId);
}

/**
 * Write user translations to data/tenants/{tenantId}/artist-translations.json
 */
export async function writeUserArtistTranslations(
  tenantId: string,
  translations: ArtistTranslations,
): Promise<void> {
  const filePath = tenantDataPath(tenantId, "artist-translations.json");
  await fs.writeFile(filePath, JSON.stringify(translations, null, 2), "utf-8");

  // Clear cache to force reload
  artistTranslationsCache.delete(tenantId);
}

/**
 * Clear caches (useful for testing or when data changes)
 */
export function clearArtistDataCache(tenantId?: string): void {
  if (tenantId) {
    artistDataCache.delete(tenantId);
    artistTranslationsCache.delete(tenantId);
  } else {
    artistDataCache.clear();
    artistTranslationsCache.clear();
  }
}
