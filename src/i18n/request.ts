import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

export default getRequestConfig(async () => {
  // Language detection strategy: Use cookie-based locale storage
  // Reasoning: Simple, persistent across sessions, works without routing changes
  // Alternative approaches considered:
  // - URL-based routing (/en/, /de/, /es/) - rejected for simplicity
  // - Browser language detection - rejected as it doesn't persist user choice
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'en';

  // Load UI, artwork, artist, and admin messages separately for better organization
  // This structure is Weblate-friendly and separates content types
  const [uiMessages, artworkMessages, artistMessages, adminMessages] = await Promise.all([
    import(`../../messages/ui/${locale}.json`),
    import(`../../messages/artworks/${locale}.json`),
    import(`../../messages/artist/${locale}.json`),
    import(`../../messages/ui/admin/${locale}.json`)
  ]);

  return {
    locale,
    messages: {
      ...uiMessages.default,
      ...artworkMessages.default,
      Artist: artistMessages.default,
      admin: adminMessages.default
    }
  };
});