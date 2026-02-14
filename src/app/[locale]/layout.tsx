import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { SUPPORTED_LOCALES } from "@/lib/locales";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ChatToggle from "@/components/ChatToggle";
import Header from "@/components/Header";
import LocaleHtmlLang from "@/components/LocaleHtmlLang";
import { Suspense } from "react";
import { getSiteKeywords } from "@/lib/config";
import { getTenantId } from "@/lib/tenant";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// Generate metadata using translations with locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const tenantId = await getTenantId();
  const siteName = t("Site.name", { artistName: t("Artist.name") });
  const siteDescription = t("Site.description");

  return {
    title: {
      template: `%s | ${siteName}`,
      default: `${siteName} | ${siteDescription}`,
    },
    description: t("Site.longDescription", { artistName: t("Artist.name") }),
    keywords: await getSiteKeywords(tenantId),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : locale,
      title: siteName,
      description: siteDescription,
      siteName: siteName,
    },
    twitter: {
      card: "summary",
      title: siteName,
      description: siteDescription,
    },
    authors: [{ name: t("Artist.name") }],
    creator: t("Artist.name"),
    category: "art gallery",
    alternates: {
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((loc) => [loc.code, `/${loc.code}`]),
      ),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  const isValidLocale = SUPPORTED_LOCALES.some(
    (supportedLocale) => supportedLocale.code === locale,
  );

  if (!isValidLocale) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <LocaleHtmlLang />
      <ThemeProvider>
        <Suspense fallback={<div className="h-32 bg-white dark:bg-gray-900" />}>
          <Header />
        </Suspense>
        <div
          className="min-h-full bg-gray-50 dark:bg-gray-900"
          style={{ paddingTop: "var(--header-height, 160px)" }}
          role="region"
          aria-label="Art gallery content"
        >
          {children}
          <ChatToggle />
        </div>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale: locale.code }));
}
