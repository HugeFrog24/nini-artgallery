"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AccentColor,
  ColorScheme,
  ThemeConfig,
  ThemeContextType,
} from "@/types/theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>({
    accent: "pink",
    colorScheme: "system",
  });
  const [isClient, setIsClient] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  // Load theme from localStorage and detect system preference
  useEffect(() => {
    setIsClient(true);

    // Detect system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mediaQuery.matches);

    // Listen for system preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    // Load saved theme
    const savedTheme = localStorage.getItem("nini-gallery-theme");
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        // Ensure colorScheme exists for backward compatibility
        if (!parsedTheme.colorScheme) {
          parsedTheme.colorScheme = "system";
        }
        setTheme(parsedTheme);
      } catch {
        console.warn("Failed to parse saved theme, using default");
      }
    }

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Calculate resolved color scheme
  const resolvedColorScheme: "light" | "dark" =
    theme.colorScheme === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : theme.colorScheme;

  // Update CSS variables and dark mode class when theme changes
  useEffect(() => {
    if (!isClient) return;

    const root = document.documentElement;

    // Apply dark mode class
    if (resolvedColorScheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Define color mappings for each accent color
    const colorMappings = {
      pink: {
        "--accent-50": "oklch(0.971 0.014 343.198)", // pink-50
        "--accent-100": "oklch(0.948 0.028 342.258)", // pink-100
        "--accent-200": "oklch(0.899 0.061 343.231)", // pink-200
        "--accent-500": "oklch(0.656 0.241 354.308)", // pink-500
        "--accent-600": "oklch(0.592 0.249 0.584)", // pink-600
      },
      orange: {
        "--accent-50": "oklch(0.98 0.016 73.684)", // orange-50
        "--accent-100": "oklch(0.954 0.038 75.164)", // orange-100
        "--accent-200": "oklch(0.901 0.076 70.697)", // orange-200
        "--accent-500": "oklch(0.705 0.213 47.604)", // orange-500
        "--accent-600": "oklch(0.646 0.222 41.116)", // orange-600
      },
      green: {
        "--accent-50": "oklch(0.986 0.031 120.757)", // lime-50
        "--accent-100": "oklch(0.967 0.067 122.328)", // lime-100
        "--accent-200": "oklch(0.938 0.127 124.321)", // lime-200
        "--accent-500": "oklch(0.768 0.233 130.85)", // lime-500
        "--accent-600": "oklch(0.648 0.2 131.684)", // lime-600
      },
    };

    const colors = colorMappings[theme.accent];
    Object.entries(colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Save to localStorage
    localStorage.setItem("nini-gallery-theme", JSON.stringify(theme));
  }, [theme, resolvedColorScheme, isClient]);

  const setAccentColor = (color: AccentColor) => {
    setTheme((prev) => ({ ...prev, accent: color }));
  };

  const setColorScheme = (colorScheme: ColorScheme) => {
    setTheme((prev) => ({ ...prev, colorScheme }));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setAccentColor,
        setColorScheme,
        resolvedColorScheme,
        systemPrefersDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
