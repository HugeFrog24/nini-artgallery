/**
 * Centralized locale configuration for the application
 * This ensures consistency between LanguageSwitcher and admin translation management
 */

export interface LocaleConfig {
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

export type SupportedLocaleCode = typeof SUPPORTED_LOCALES[number]['code'];

/**
 * Get locale configuration by code
 */
export function getLocaleConfig(code: string): LocaleConfig | undefined {
  return SUPPORTED_LOCALES.find(locale => locale.code === code);
}

/**
 * Get all locale codes
 */
export function getLocaleCodes(): string[] {
  return SUPPORTED_LOCALES.map(locale => locale.code);
}

/**
 * Check if a locale code is supported
 */
export function isSupportedLocale(code: string): code is SupportedLocaleCode {
  return SUPPORTED_LOCALES.some(locale => locale.code === code);
}

/**
 * Get locales for admin translation management (without flags)
 */
export function getAdminLocales() {
  return SUPPORTED_LOCALES.map(({ code, name }) => ({ code, name }));
}