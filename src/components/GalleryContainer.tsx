"use client";

import { useState } from "react";
import { CategorySection } from "@/types/artwork";
import { PersonalMessage } from "@/types/config";
import SectionContainer from "./SectionContainer";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

// Function to determine time-based greeting
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 18) {
    return "afternoon";
  } else if (hour >= 18 && hour < 22) {
    return "evening";
  } else {
    return "default";
  }
}

interface GalleryContainerProps {
  initialSections: CategorySection[];
  /** Personal message loaded server-side from the tenant's data directory. */
  personalMessage: PersonalMessage;
}

export default function GalleryContainer({
  initialSections,
  personalMessage,
}: GalleryContainerProps) {
  const [isNoteVisible, setIsNoteVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  // Use translations for UI elements (artist greeting/description)
  const t = useTranslations();

  const handleCloseNote = () => {
    setIsAnimatingOut(true);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsNoteVisible(false);
      setIsAnimatingOut(false);
    }, 300); // Match the animation duration
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <section className="prose prose-sm max-w-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-4 transition-colors">
            <div className="border-l-4 border-accent-200 pl-4 mb-6">
              <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                {/* Artist greeting and description are translatable UI content */}
                <span className="text-2xl font-medium block mb-2">
                  {t(`greeting.${getTimeBasedGreeting()}`)}{" "}
                  {t("introduction", { name: t("Artist.name") })}
                </span>
                <p>{t("Artist.description")}</p>
              </div>
            </div>
            {/* Personal message uses original data, NOT translations
                Reasoning: This is Nini's personal message to Tibik - it's her authentic voice
                and personal content, not a UI element that should be translated */}
            {personalMessage.enabled && isNoteVisible && (
              <div
                className={`
                bg-accent-50 dark:bg-accent-500/10 rounded-lg p-4 border border-accent-100 dark:border-accent-500/20 relative transition-all duration-300 ease-in-out
                ${isAnimatingOut ? "max-h-0 opacity-0 scale-y-0 transform origin-top py-0 border-0 overflow-hidden" : "opacity-100 scale-y-100"}
              `}
              >
                {personalMessage.dismissible && (
                  <button
                    onClick={handleCloseNote}
                    className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    aria-label={t("Common.closeBroadcastMessage")}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
                {personalMessage.recipient && (
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 pr-8">
                    {personalMessage.recipient}
                  </h3>
                )}
                <p className="text-gray-800 dark:text-gray-200 italic leading-relaxed pr-8 text-justify">
                  {personalMessage.message}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="max-w-7xl mx-auto px-2 space-y-8">
        {initialSections.length > 0 ? (
          initialSections.map((section) => (
            <SectionContainer key={section.id} section={section} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {t("Search.noResults")}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
