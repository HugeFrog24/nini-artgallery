import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_FULL_TITLE, SITE_KEYWORDS, SITE_LONG_DESCRIPTION, SITE_NAME } from "@/constants/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://ninis-art-gallery.com'),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: SITE_FULL_TITLE,
  },
  description: SITE_LONG_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [{
      url: '/api/og',
      width: 1200,
      height: 630,
      alt: `${SITE_NAME} Preview`
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{
      url: '/api/og',
      width: 1200,
      height: 630,
      alt: `${SITE_NAME} Preview`
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
        <div 
          className="min-h-full"
          role="region"
          aria-label="Art gallery content"
        >
          {children}
        </div>
      </body>
    </html>
  );
}
