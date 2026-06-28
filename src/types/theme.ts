export type AccentColor = "pink" | "orange" | "green";
export type ColorScheme = "light" | "dark" | "system";

export interface ThemeConfig {
  accent: AccentColor;
  colorScheme: ColorScheme;
}

export interface ThemeContextType {
  theme: ThemeConfig;
  setAccentColor: (color: AccentColor) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  resolvedColorScheme: "light" | "dark";
  systemPrefersDark: boolean;
}

export const ACCENT_COLORS: Record<AccentColor, { preview: string }> = {
  pink: {
    preview: "#ec4899", // pink-500
  },
  orange: {
    preview: "#f97316", // orange-500
  },
  green: {
    preview: "#84cc16", // lime-500
  },
};

export const COLOR_SCHEMES: Record<ColorScheme, { icon: string }> = {
  light: {
    icon: "☀️",
  },
  dark: {
    icon: "🌙",
  },
  system: {
    icon: "💻",
  },
};

// ── Derived key tuples (single source of truth for Zod, Sets, prompts) ──

/** Typed tuple of accent color keys — usable with z.enum() and Set(). */
export const ACCENT_COLOR_KEYS = Object.keys(ACCENT_COLORS) as [
  AccentColor,
  ...AccentColor[],
];

/** Typed tuple of color scheme keys — usable with z.enum() and Set(). */
export const COLOR_SCHEME_KEYS = Object.keys(COLOR_SCHEMES) as [
  ColorScheme,
  ...ColorScheme[],
];

/** The only two values a resolved (non-"system") color scheme can have. */
export const RESOLVED_COLOR_SCHEMES = ["light", "dark"] as const;
export type ResolvedColorScheme = (typeof RESOLVED_COLOR_SCHEMES)[number];

// ── Client-supplied theme validation ──────────────────────────────

const VALID_ACCENTS = new Set<string>(ACCENT_COLOR_KEYS);
const VALID_COLOR_SCHEMES = new Set<string>(COLOR_SCHEME_KEYS);
const VALID_RESOLVED = new Set<string>(RESOLVED_COLOR_SCHEMES);

/** Shape of a validated client-supplied theme (string values, not typed enums). */
export interface ClientTheme {
  accent: string;
  colorScheme: string;
  resolvedColorScheme: string;
}

/** Validate and sanitise a client-supplied theme, falling back to safe defaults. */
export function parseClientTheme(raw: unknown): ClientTheme {
  const defaults: ClientTheme = {
    accent: ACCENT_COLOR_KEYS[0],
    colorScheme: COLOR_SCHEME_KEYS[0],
    resolvedColorScheme: RESOLVED_COLOR_SCHEMES[0],
  };
  if (!raw || typeof raw !== "object") return defaults;

  const obj = raw as Record<string, unknown>;
  return {
    accent:
      typeof obj.accent === "string" && VALID_ACCENTS.has(obj.accent)
        ? obj.accent
        : defaults.accent,
    colorScheme:
      typeof obj.colorScheme === "string" &&
      VALID_COLOR_SCHEMES.has(obj.colorScheme)
        ? obj.colorScheme
        : defaults.colorScheme,
    resolvedColorScheme:
      typeof obj.resolvedColorScheme === "string" &&
      VALID_RESOLVED.has(obj.resolvedColorScheme)
        ? obj.resolvedColorScheme
        : defaults.resolvedColorScheme,
  };
}
