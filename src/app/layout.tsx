import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ThemeSelector from "@/components/theme/ThemeSelector";
import Header from "@/components/Header";
import { Suspense } from "react";
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages, getTranslations} from 'next-intl/server';
import { getSiteKeywords } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

// Generate metadata using translations
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const siteName = t('Site.name', { artistName: t('Artist.name') });
  const siteDescription = t('Site.description');
  
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL!),
    title: {
      template: `%s | ${siteName}`,
      default: `${siteName} | ${siteDescription}`,
    },
    description: t('Site.longDescription', { artistName: t('Artist.name') }),
    keywords: getSiteKeywords(),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      title: siteName,
      description: siteDescription,
      siteName: siteName,
      images: [{
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: `${siteName} Preview`,
        type: 'image/png'
      }]
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDescription,
      images: [{
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: `${siteName} Preview`,
        type: 'image/png'
      }]
    },
    alternates: {
      canonical: "/",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <body className={`${inter.className} h-full`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <Suspense fallback={<div className="h-32 bg-white dark:bg-gray-900" />}>
              <Header />
            </Suspense>
            <div
              className="min-h-full pt-40 bg-gray-50 dark:bg-gray-900"
              role="region"
              aria-label="Art gallery content"
            >
              {children}
              <ThemeSelector />
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
