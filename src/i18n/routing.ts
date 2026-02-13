import { defineRouting } from "next-intl/routing";
import { SUPPORTED_LOCALES } from "@/lib/locales";

const locales = SUPPORTED_LOCALES.map((l) => l.code);

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localeCookie: {
    name: "locale",
    maxAge: 60 * 60 * 24 * 365, // 1 year, matching current LanguageSwitcher
  },
});
