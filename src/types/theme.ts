export type AccentColor = 'pink' | 'orange' | 'green';
export type ColorScheme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  accent: AccentColor;
  colorScheme: ColorScheme;
}

export interface ThemeContextType {
  theme: ThemeConfig;
  setAccentColor: (color: AccentColor) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  resolvedColorScheme: 'light' | 'dark';
  systemPrefersDark: boolean;
}

export const ACCENT_COLORS: Record<AccentColor, { preview: string }> = {
  pink: {
    preview: '#ec4899', // pink-500
  },
  orange: {
    preview: '#f97316', // orange-500
  },
  green: {
    preview: '#84cc16', // lime-500
  },
};

export const COLOR_SCHEMES: Record<ColorScheme, { icon: string }> = {
  light: {
    icon: '☀️',
  },
  dark: {
    icon: '🌙',
  },
  system: {
    icon: '💻',
  },
};