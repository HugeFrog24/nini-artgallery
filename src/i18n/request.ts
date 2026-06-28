import { promises as fs } from "fs";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { getArtistData } from "@/lib/artist-data";
import { getTenantId, tenantMessagePath } from "@/lib/tenant";

export default getRequestConfig(async ({ requestLocale }) => {
  // The locale is resolved by the next-intl middleware from the URL prefix,
  // locale cookie, or accept-language negotiation. It should always be present.
  const locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    throw new Error(
      `[i18n/request] Invalid or missing locale "${locale}". ` +
        "The next-intl middleware should have resolved this before reaching here.",
    );
  }

  // Resolve the tenant from the proxy-injected header.
  // Falls back to the default tenant during static prerendering.
  const tenantId = await getTenantId();

  // Load UI and admin messages (shared across all tenants — static import paths)
  // Load artwork messages (tenant-scoped — read via fs)
  const [uiMessages, adminMessages, artworkMessagesRaw] = await Promise.all([
    import(`../../messages/ui/${locale}.json`),
    import(`../../messages/ui/admin/${locale}.json`),
    fs.readFile(
      tenantMessagePath("artworks", tenantId, `${locale}.json`),
      "utf-8",
    ),
  ]);

  const artworkMessages = JSON.parse(artworkMessagesRaw);

  // Get artist data using hybrid approach (user data + translations + static fallback)
  const artistData = await getArtistData(tenantId, locale);

  return {
    locale,
    messages: {
      ...uiMessages.default,
      ...artworkMessages,
      Artist: artistData,
      admin: adminMessages.default,
    },
  };
});
