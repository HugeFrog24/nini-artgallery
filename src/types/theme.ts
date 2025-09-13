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

export const ACCENT_COLORS: Record<AccentColor, { name: string; preview: string }> = {
  pink: {
    name: 'Pink',
    preview: '#ec4899', // pink-500
  },
  orange: {
    name: 'Orange',
    preview: '#f97316', // orange-500
  },
  green: {
    name: 'Light Green',
    preview: '#84cc16', // lime-500
  },
};

export const COLOR_SCHEMES: Record<ColorScheme, { name: string; icon: string }> = {
  light: {
    name: 'Light',
    icon: '☀️',
  },
  dark: {
    name: 'Dark',
    icon: '🌙',
  },
  system: {
    name: 'System',
    icon: '💻',
  },
};