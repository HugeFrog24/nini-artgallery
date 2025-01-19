import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://ninis-art-gallery.com'),
  title: {
    template: "%s | Nini's Art Gallery",
    default: "Nini's Art Gallery | Multi-disciplinary Art Collection",
  },
  description: "Explore Nini's diverse art collection featuring origami, crochet items, paintings, and nail art designs. Each piece showcases unique creativity and craftsmanship.",
  keywords: ["art gallery", "origami", "crochet", "paintings", "nail art", "handmade", "crafts"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Nini's Art Gallery",
    description: "Multi-disciplinary Art Collection",
    siteName: "Nini's Art Gallery",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nini's Art Gallery",
    description: "Multi-disciplinary Art Collection",
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
