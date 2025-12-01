/**
 * Centralized locale configuration for the application
 * This ensures consistency between LanguageSwitcher and admin translation management
 */

interface LocaleConfig {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LOCALES: readonly LocaleConfig[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ka', name: 'ქართული', flag: '🇬🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
] as const;


/**
 * Get locale configuration by code
 */
export function getLocaleConfig(code: string): LocaleConfig | undefined {
  return SUPPORTED_LOCALES.find(locale => locale.code === code);
}


/**
 * Get locales for admin translation management (without flags)
 */
export function getAdminLocales() {
  return SUPPORTED_LOCALES.map(({ code, name }) => ({ code, name }));
}