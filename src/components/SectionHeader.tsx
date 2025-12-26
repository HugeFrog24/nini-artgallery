"use client";

import { useState } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

interface SectionHeaderProps {
  id: string;
  title: string;
  description: string;
  onSort: (sortBy: string, order: "asc" | "desc") => void;
}

export default function SectionHeader({
  id,
  title,
  description,
  onSort,
}: SectionHeaderProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    order: "asc" | "desc";
  } | null>(null);
  const t = useTranslations();

  const handleSort = (key: string) => {
    const isAsc = sortConfig?.key === key && sortConfig.order === "asc";
    const newOrder = isAsc ? "desc" : "asc";
    setSortConfig({ key, order: newOrder });
    onSort(key, newOrder);
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return null;
    }
    return sortConfig.order === "asc" ? (
      <ArrowUpIcon className="h-4 w-4" />
    ) : (
      <ArrowDownIcon className="h-4 w-4" />
    );
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <h2
          id={`heading-${id}`}
          className="text-xl font-semibold text-gray-900 dark:text-white"
        >
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleSort("title")}
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={t("Sort.sortByTitle")}
          >
            {t("Sort.title")}
            {getSortIcon("title")}
          </button>
          <button
            onClick={() => handleSort("year")}
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={t("Sort.sortByYear")}
          >
            {t("Sort.year")}
            {getSortIcon("year")}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
