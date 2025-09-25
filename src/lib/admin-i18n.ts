import { cookies } from 'next/headers';

// Server-side translation helper for admin functions
export async function getAdminTranslations(locale?: string) {
  // Get locale from cookie if not provided
  if (!locale) {
    const cookieStore = await cookies();
    locale = cookieStore.get('locale')?.value || 'en';
  }

  try {
    const adminMessages = await import(`../../messages/ui/admin/${locale}.json`);
    return adminMessages.default;
  } catch {
    // Fallback to English if locale not found
    const adminMessages = await import(`../../messages/ui/admin/en.json`);
    return adminMessages.default;
  }
}

// Helper to get email translations specifically
export async function getEmailTranslations(locale?: string) {
  const translations = await getAdminTranslations(locale);
  return translations.Email;
}