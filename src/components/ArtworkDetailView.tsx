"use client";

import { Artwork } from "@/types/artwork";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface ArtworkDetailViewProps {
  artwork: Artwork;
}

export default function ArtworkDetailView({ artwork }: ArtworkDetailViewProps) {
  const router = useRouter();
  const t = useTranslations();

  const handleBack = () => {
    router.back();
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label={t("ArtworkDetail.backToGalleryAriaLabel")}
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="text-sm font-medium">
            {t("ArtworkDetail.backToGallery")}
          </span>
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Artwork image */}
          <div className="space-y-4">
            <div
              className="aspect-square w-full rounded-lg shadow-lg"
              style={{ backgroundColor: artwork.imageUrl }}
              role="img"
              aria-label={`${artwork.title} - ${artwork.medium}`}
            />

            {/* Image caption */}
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("ArtworkDetail.categoryArtwork", {
                  category: t(`Categories.${artwork.category}.title`),
                })}
              </p>
            </div>
          </div>

          {/* Artwork details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {artwork.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {artwork.description}
              </p>
            </div>

            {/* Artwork metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t("ArtworkDetail.artworkDetails")}
              </h2>

              <dl className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("ArtworkDetail.category")}
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {t(`Categories.${artwork.category}.title`)}
                  </dd>
                </div>

                {artwork.medium && (
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t("Artwork.medium")}
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {artwork.medium}
                    </dd>
                  </div>
                )}

                {artwork.dimensions && (
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t("Artwork.dimensions")}
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {artwork.dimensions}
                    </dd>
                  </div>
                )}

                {artwork.year && (
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t("Artwork.year")}
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {artwork.year}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Additional actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t("ArtworkDetail.viewMoreArtworks")}
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: artwork.title,
                      text: artwork.description,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="flex-1 bg-accent-600 dark:bg-accent-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-700 dark:hover:bg-accent-600 transition-colors"
              >
                {t("ArtworkDetail.shareArtwork")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
