/**
 * Centralized locale configuration for the application
 * This ensures consistency between PreferencesMenu and admin translation management
 */

interface LocaleConfig {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LOCALES: readonly LocaleConfig[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ka", name: "ქართული", flag: "🇬🇪" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
] as const;

/**
 * Get locale configuration by code
 */
export function getLocaleConfig(code: string): LocaleConfig | undefined {
  return SUPPORTED_LOCALES.find((locale) => locale.code === code);
}

/**
 * Get locales for admin translation management (without flags)
 */
export function getAdminLocales() {
  return SUPPORTED_LOCALES.map(({ code, name }) => ({ code, name }));
}

// ── Derived key tuple (usable with z.enum(), tool schemas, etc.) ───

/** Typed tuple of locale codes — usable with z.enum() and Set(). */
export const LOCALE_KEYS = SUPPORTED_LOCALES.map((l) => l.code) as [
  string,
  ...string[],
];

// ── Derived look-ups (shared by API routes, components, etc.) ─────

/** Set of supported locale codes for fast validation. */
export const supportedLocaleCodes: ReadonlySet<string> = new Set(
  SUPPORTED_LOCALES.map((l) => l.code),
);

/** Map locale code → human-readable language name (for LLM prompts). */
export const localeToLanguageName: Readonly<Record<string, string>> =
  Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l.code, l.name]));

/**
 * Map app locale codes to explicit BCP-47 tags for the Web Speech API.
 * Many speech engines are more reliable with full tags (e.g. "en-US")
 * than short codes (e.g. "en").
 */
export function toSpeechLang(locale: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    de: "de-DE",
    es: "es-ES",
    tr: "tr-TR",
    ru: "ru-RU",
    ka: "ka-GE",
  };
  return map[locale] ?? "en-US";
}
