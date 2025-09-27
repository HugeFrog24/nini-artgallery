import {getRequestConfig} from 'next-intl/server';
import { getArtistData } from '@/lib/artist-data';

export default getRequestConfig(async ({ locale }) => {
  // Language detection strategy: URL-based routing (/en/, /de/, /es/)
  // The locale is now provided by Next.js routing system through the [locale] parameter
  // This provides better SEO, shareable URLs, and automatic Open Graph localization
  
  // Ensure we have a valid locale, fallback to 'en' if undefined
  const validLocale = locale || 'en';
  
  // Load UI, artwork, and admin messages separately for better organization
  // This structure is Weblate-friendly and separates content types
  const [uiMessages, artworkMessages, adminMessages] = await Promise.all([
    import(`../../messages/ui/${validLocale}.json`),
    import(`../../messages/artworks/${validLocale}.json`),
    import(`../../messages/ui/admin/${validLocale}.json`)
  ]);

  // Get artist data using hybrid approach (user data + translations + static fallback)
  const artistData = await getArtistData(validLocale);

  return {
    locale: validLocale,
    messages: {
      ...uiMessages.default,
      ...artworkMessages.default,
      Artist: artistData,
      admin: adminMessages.default
    }
  };
});