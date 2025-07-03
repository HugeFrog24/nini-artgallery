export type AccentColor = 'pink' | 'orange' | 'green';

export interface ThemeConfig {
  accent: AccentColor;
}

export interface ThemeContextType {
  theme: ThemeConfig;
  setAccentColor: (color: AccentColor) => void;
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