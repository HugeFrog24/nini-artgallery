"use client";

import { useState, useEffect, useRef } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UserIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import { useHeaderHeightCSS } from "@/hooks/useHeaderHeight";

interface HeaderProps {
  // Optional props for controlled mode (like SearchHeader)
  currentSearch?: string;
  onSearch?: (searchTerm: string) => void;
  isLoading?: boolean;
}

export default function Header({
  currentSearch,
  onSearch,
  isLoading: externalLoading,
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [internalLoading, setInternalLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  useHeaderHeightCSS(headerRef);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations();

  // Determine if we're in controlled mode (SearchHeader behavior) or autonomous mode (GlobalHeader behavior)
  const isControlled = currentSearch !== undefined && onSearch !== undefined;
  const isLoading = externalLoading ?? internalLoading;

  // Initialize search term
  useEffect(() => {
    if (isControlled) {
      setSearchTerm(currentSearch || "");
    } else {
      const urlSearch = searchParams.get("search") || "";
      setSearchTerm(urlSearch);
    }
  }, [isControlled, currentSearch, searchParams]);

  // Check admin auth status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/session");
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAdminEmail(data.email || null);
        }
      } catch {
        // Silently fail - just show the login button
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  // Scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide header when scrolling down and past a threshold
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchTerm.trim();

    if (isControlled) {
      // Controlled mode: use provided onSearch callback
      onSearch!(trimmedSearch);
    } else {
      // Autonomous mode: handle navigation ourselves
      setInternalLoading(true);
      try {
        // Check if we're on the localized home page
        const isOnHomePage = pathname === `/${locale}`;

        if (!isOnHomePage) {
          // Navigate to localized home with search
          if (trimmedSearch) {
            router.push(
              `/${locale}?search=${encodeURIComponent(trimmedSearch)}`,
            );
          } else {
            router.push(`/${locale}`);
          }
        } else {
          // If we're on the home page, update search params
          const params = new URLSearchParams(searchParams.toString());
          if (trimmedSearch) {
            params.set("search", trimmedSearch);
          } else {
            params.delete("search");
          }
          router.push(`/${locale}?${params.toString()}`);
        }
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      setIsAuthenticated(false);
      setAdminEmail(null);
      setIsUserMenuOpen(false);
      setIsLoggingOut(false);
      router.push(`/${locale}/admin/login`);
    }
  };

  return (
    <header
      ref={headerRef}
      className={`
        fixed top-0 left-0 right-0 z-50
        bg-white dark:bg-gray-900 shadow-sm py-4 px-4
        transition-all duration-300 ease-in-out
        ${isVisible ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top row: Login and Language Switcher */}
        <div className="flex justify-end items-center">
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">
                    {adminEmail || t("Common.dashboard")}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1 z-50">
                    <Link
                      href={`/${locale}/admin`}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t("Common.dashboard")}
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
                    >
                      {t("Common.logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/${locale}/admin/login`}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                {t("Common.login")}
              </Link>
            )}
            <LanguageSwitcher />
          </div>
        </div>

        {/* Second row: Title and Description */}
        <div className="text-center">
          <Link href={`/${locale}`} className="inline-block">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 hover:text-accent-600 transition-colors">
              {t("Site.name", { artistName: t("Artist.name") })}
            </h1>
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("Site.subheading")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              id="search" // Unique identifier for accessibility and form handling
              name="search" // Form field name for browser autofill and form submission
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("Search.placeholder")}
              className="block w-full pl-4 pr-24 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-300 focus:ring-1 focus:ring-accent-500 focus:border-accent-500 sm:text-sm transition-colors"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              {isLoading ? (
                <ArrowPathIcon
                  className="h-5 w-5 text-gray-400 dark:text-gray-500 animate-spin mr-3"
                  aria-hidden="true"
                />
              ) : (
                <button
                  type="submit"
                  className="h-full px-4 py-2 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 transition-colors duration-200 focus:outline-none rounded-r-md"
                  aria-label={t("Search.searchLabel")}
                >
                  <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </header>
  );
}
