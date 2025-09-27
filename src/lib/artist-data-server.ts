import 'server-only';

import { promises as fs } from 'fs';
import path from 'path';
import { ArtistData, ArtistTranslations } from '@/types/admin';

// Cache for artist data to avoid repeated file reads
let artistDataCache: ArtistData | null = null;
let artistTranslationsCache: ArtistTranslations | null = null;

/**
 * Read the primary artist data from data/artist.json
 */
export async function readUserArtistData(): Promise<ArtistData> {
  if (artistDataCache) {
    return artistDataCache;
  }

  const filePath = path.join(process.cwd(), 'data', 'artist.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  artistDataCache = JSON.parse(fileContent);
  return artistDataCache!;
}

/**
 * Read user-provided translations from data/artist-translations.json
 */
export async function readUserArtistTranslations(): Promise<ArtistTranslations> {
  if (artistTranslationsCache) {
    return artistTranslationsCache;
  }

  const filePath = path.join(process.cwd(), 'data', 'artist-translations.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  artistTranslationsCache = JSON.parse(fileContent);
  return artistTranslationsCache!;
}

/**
 * Get static artist translation from messages/artist/ (fallback for Weblate/Tolgee)
 */
export async function getStaticArtistTranslation(locale: string): Promise<{ name: string; description: string }> {
  const filePath = path.join(process.cwd(), 'messages', 'artist', `${locale}.json`);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

/**
 * Write artist data to data/artist.json
 */
export async function writeUserArtistData(data: Omit<ArtistData, 'defaultLanguage'>): Promise<void> {
  const userData = await readUserArtistData();
  const updatedData: ArtistData = {
    ...data,
    defaultLanguage: userData.defaultLanguage
  };

  const filePath = path.join(process.cwd(), 'data', 'artist.json');
  await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
  
  // Clear cache to force reload
  artistDataCache = null;
}

/**
 * Write user translations to data/artist-translations.json
 */
export async function writeUserArtistTranslations(translations: ArtistTranslations): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'artist-translations.json');
  await fs.writeFile(filePath, JSON.stringify(translations, null, 2), 'utf-8');
  
  // Clear cache to force reload
  artistTranslationsCache = null;
}

/**
 * Clear caches (useful for testing or when data changes)
 */
export function clearArtistDataCache(): void {
  artistDataCache = null;
  artistTranslationsCache = null;
}