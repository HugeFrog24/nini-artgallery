import "server-only";

import { promises as fs } from "fs";
import { ArtistData, ArtistTranslations } from "@/types/admin";
import { tenantDataPath, tenantMessagePath } from "@/lib/tenant";

/**
 * Get artist data for a specific locale.
 *
 * Priority: locale-specific translation → tenant primary language.
 *
 * Fails fast on missing/corrupt tenant files — these are not optional.
 * A missing locale translation is expected (not every tenant has every
 * locale), so we fall back to the tenant's primary language.
 */
export async function getArtistData(
  tenantId: string,
  locale: string,
): Promise<{ name: string; description: string }> {
  // These reads MUST succeed — tenant data files are required.
  // Let errors propagate (ENOENT, bad JSON) so callers see them immediately.
  const [artistRaw, translationsRaw] = await Promise.all([
    fs.readFile(tenantDataPath(tenantId, "artist.json"), "utf-8"),
    fs.readFile(
      tenantDataPath(tenantId, "artist-translations.json"),
      "utf-8",
    ),
  ]);

  const artistData: ArtistData = JSON.parse(artistRaw);
  const translations: ArtistTranslations = JSON.parse(translationsRaw);

  // Best case: we have a translation for the requested locale
  if (translations[locale]) {
    return {
      name: translations[locale].name,
      description: translations[locale].description,
    };
  }

  // Fall back to the tenant's primary language (always present in artist.json)
  return {
    name: artistData.name,
    description: artistData.description,
  };
}

/**
 * Get static artist translation from messages/artist/{tenantId}/{locale}.json.
 * Fails fast if the file is missing — caller should handle.
 */
export async function getStaticArtistTranslation(
  tenantId: string,
  locale: string,
): Promise<{ name: string; description: string }> {
  const filePath = tenantMessagePath("artist", tenantId, `${locale}.json`);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}
