"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Cog6ToothIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useTheme } from "./theme/ThemeProvider";
import { SUPPORTED_LOCALES, getLocaleConfig } from "@/lib/locales";
import {
  ACCENT_COLORS,
  COLOR_SCHEMES,
  type AccentColor,
  type ColorScheme,
} from "@/types/theme";

/**
 * Unified preferences dropdown with accordion sections.
 *
 * Replaces the standalone LanguageSwitcher and floating ThemeSelector
 * with a single "Start Menu"-style panel in the header.
 *
 * Sections:
 *  - Language  (locale picker)
 *  - Theme     (color scheme + accent color)
 */
export default function PreferencesMenu() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setAccentColor, setColorScheme, systemPrefersDark } =
    useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  // Find the current locale config for the trigger badge
  const currentLocale = getLocaleConfig(locale);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        aria-label={t("Preferences.title")}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Cog6ToothIcon className="h-5 w-5" />
        {currentLocale && <span>{currentLocale.flag}</span>}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150"
          role="menu"
          aria-label={t("Preferences.title")}
        >
          {/* ── Language section ─────────────────────────────────── */}
          <div>
            <button
              onClick={() => toggleSection("language")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              aria-expanded={openSection === "language"}
            >
              <span>{t("Preferences.language")}</span>
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${openSection === "language" ? "rotate-180" : ""}`}
              />
            </button>

            {openSection === "language" && (
              <div className="px-2 pb-2">
                {SUPPORTED_LOCALES.map((lang) => {
                  const isSelected = lang.code === locale;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isSelected
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                      role="menuitem"
                    >
                      <span>{lang.flag}</span>
                      <span className="flex-1 text-left">{lang.name}</span>
                      {isSelected && (
                        <div className="w-2 h-2 bg-accent-500 rounded-full flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* ── Theme section ────────────────────────────────────── */}
          <div>
            <button
              onClick={() => toggleSection("theme")}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              aria-expanded={openSection === "theme"}
            >
              <span>{t("Preferences.theme")}</span>
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${openSection === "theme" ? "rotate-180" : ""}`}
              />
            </button>

            {openSection === "theme" && (
              <div className="px-2 pb-2 space-y-2">
                {/* Appearance (color scheme) */}
                <div>
                  <div className="px-2 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("Theme.appearance")}
                  </div>
                  {Object.entries(COLOR_SCHEMES).map(([key, info]) => {
                    const scheme = key as ColorScheme;
                    const isSelected = theme.colorScheme === scheme;
                    return (
                      <button
                        key={scheme}
                        onClick={() => { setColorScheme(scheme); setIsOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          isSelected
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                        role="menuitem"
                      >
                        <span className="text-base flex-shrink-0">
                          {info.icon}
                        </span>
                        <span className="flex-1 text-left">
                          {t(`Theme.schemes.${scheme}`)}
                        </span>
                        {scheme === "system" && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            (
                            {systemPrefersDark
                              ? t("Theme.dark")
                              : t("Theme.light")}
                            )
                          </span>
                        )}
                        {isSelected && (
                          <div className="w-2 h-2 bg-accent-500 rounded-full flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Accent color */}
                <div>
                  <div className="px-2 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("Theme.accentColor")}
                  </div>
                  {Object.entries(ACCENT_COLORS).map(([key, info]) => {
                    const color = key as AccentColor;
                    const isSelected = theme.accent === color;
                    return (
                      <button
                        key={color}
                        onClick={() => { setAccentColor(color); setIsOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          isSelected
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                        role="menuitem"
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0"
                          style={{ backgroundColor: info.preview }}
                          aria-hidden="true"
                        />
                        <span className="flex-1 text-left">
                          {t(`Theme.colors.${color}`)}
                        </span>
                        {isSelected && (
                          <div className="w-2 h-2 bg-accent-500 rounded-full flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
