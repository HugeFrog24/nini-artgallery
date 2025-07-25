import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSiteConfig } from "@/lib/config";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ThemeSelector from "@/components/theme/ThemeSelector";
import GlobalHeader from "@/components/GlobalHeader";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });
const siteConfig = getSiteConfig();

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    template: `%s | ${siteConfig.siteName}`,
    default: `${siteConfig.siteName} | ${siteConfig.siteDescription}`,
  },
  description: siteConfig.siteLongDescription,
  keywords: siteConfig.siteKeywords,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: siteConfig.siteName,
    description: siteConfig.siteDescription,
    siteName: siteConfig.siteName,
    images: [{
      url: '/api/og',
      width: 1200,
      height: 630,
      alt: `${siteConfig.siteName} Preview`,
      type: 'image/png'
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.siteName,
    description: siteConfig.siteDescription,
    images: [{
      url: '/api/og',
      width: 1200,
      height: 630,
      alt: `${siteConfig.siteName} Preview`,
      type: 'image/png'
    }]
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <ThemeProvider>
          <Suspense fallback={<div className="h-32 bg-white dark:bg-gray-900" />}>
            <GlobalHeader />
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
      </body>
    </html>
  );
}
