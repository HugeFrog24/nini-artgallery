"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { SUPPORTED_LOCALES, getLocaleConfig } from "@/lib/locales";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLocale: string) => {
    // Navigate to the same path under the new locale.
    // The next-intl middleware handles cookie management automatically.
    router.replace(pathname, { locale: newLocale });
  };

  const currentLanguage = getLocaleConfig(locale) || SUPPORTED_LOCALES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        aria-label="Change language"
      >
        <GlobeAltIcon className="h-5 w-5" />
        <span>{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {SUPPORTED_LOCALES.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  handleLanguageChange(language.code);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-4 py-2 text-sm flex items-center space-x-3
                  ${
                    language.code === locale
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }
                  transition-colors
                `}
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
