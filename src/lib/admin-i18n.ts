import { cookies } from "next/headers";
import { getArtistData } from "@/lib/artist-data";
import { getTenantId } from "@/lib/tenant";

// Server-side translation helper for admin functions
async function getAdminTranslations(locale?: string) {
  // Get locale from cookie if not provided
  if (!locale) {
    const cookieStore = await cookies();
    locale = cookieStore.get("locale")?.value;
  }

  if (!locale) {
    throw new Error("[admin-i18n] Missing locale for admin translations.");
  }

  const adminMessages = await import(`../../messages/ui/admin/${locale}.json`);
  return adminMessages.default;
}

// Helper to get email translations specifically
export async function getEmailTranslations(locale?: string) {
  const translations = await getAdminTranslations(locale);
  return translations.Email;
}

// Resolve localized site name from UI messages.
// Fails fast when locale/message keys are missing.
export async function getLocalizedSiteName(locale?: string): Promise<string> {
  if (!locale) {
    const cookieStore = await cookies();
    locale = cookieStore.get("locale")?.value;
  }

  if (!locale) {
    throw new Error(
      "[admin-i18n] Missing locale for localized site name resolution.",
    );
  }

  const uiMessages = await import(`../../messages/ui/${locale}.json`);
  const siteNameTemplate = uiMessages.default?.Site?.name;

  if (typeof siteNameTemplate !== "string" || siteNameTemplate.length === 0) {
    throw new Error(
      `[admin-i18n] Missing messages/ui/${locale}.json -> Site.name`,
    );
  }

  const tenantId = await getTenantId();
  const artistData = await getArtistData(tenantId, locale);

  if (!artistData.name || typeof artistData.name !== "string") {
    throw new Error(
      `[admin-i18n] Missing artist name for tenant "${tenantId}" and locale "${locale}".`,
    );
  }

  return siteNameTemplate.replace("{artistName}", artistData.name);
}
