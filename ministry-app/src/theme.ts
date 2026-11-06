import { Platform, useColorScheme } from 'react-native';
import { useAppearance } from '@/lib/appearance';

// AFM green, the app's own colours and the default.
const green = {
  primary: '#2D6A3E', // AFM green (deepened from the original #7FC784 for readability)
  primaryLight: '#7FC784', // original AFM Hub green
  gold: '#C9A227',
  onPrimaryMuted: '#DCE8DC', // soft text on the primary colour
  deep: '10,28,18', // near-black green for photo shades, as "r,g,b"
};

const light = {
  ...green,
  background: '#F5F7F3',
  surface: '#FFFFFF',
  surfaceAlt: '#E8F0E6',
  text: '#1A1A1A',
  textMuted: '#6B6660',
  border: '#DDE5DA',
  onPrimary: '#FFFFFF',
  accent: '#A8841A', // darker gold, readable on light backgrounds
};

const dark: typeof light = {
  ...green,
  background: '#0E1510',
  surface: '#172019',
  surfaceAlt: '#213024',
  text: '#F3F1EC',
  textMuted: '#A3B0A5',
  border: '#2A3A2D',
  onPrimary: '#FFFFFF',
  accent: '#D9B64A',
};

// The church's blue and white, matching theafmchurch.org.
const blue = {
  primary: '#0A3A80',
  primaryLight: '#A9CCFF',
  gold: '#A9CCFF', // highlights stay light blue instead of gold
  onPrimaryMuted: '#DCE6F3',
  deep: '6,22,51',
};

const blueLight: typeof light = {
  ...blue,
  background: '#F4F7FC',
  surface: '#FFFFFF',
  surfaceAlt: '#E6EEF9',
  text: '#0E2340',
  textMuted: '#5B6B84',
  border: '#DCE6F3',
  onPrimary: '#FFFFFF',
  accent: '#1552B5',
};

const blueDark: typeof light = {
  ...blue,
  background: '#0B1220',
  surface: '#131C2E',
  surfaceAlt: '#1C2940',
  text: '#F1F4F9',
  textMuted: '#A3B1C6',
  border: '#26344D',
  onPrimary: '#FFFFFF',
  accent: '#7FB2FF',
};

export type Theme = typeof light;

const themes = { green: { light, dark }, blue: { light: blueLight, dark: blueDark } };

/** The colours for this member's chosen look (Owner dashboard and every screen use these). */
export function useTheme(): Theme {
  const { mode, colour } = useAppearance();
  const system = useColorScheme();
  const isDark = mode === 'auto' ? system === 'dark' : mode === 'dark';
  return themes[colour][isDark ? 'dark' : 'light'];
}

/** A shade of the theme's near-black, e.g. shade(t, 0.5) → "rgba(10,28,18,0.5)". */
export const shade = (t: Theme, alpha: number) => `rgba(${t.deep},${alpha})`;

export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
};

export const radius = { sm: 8, md: 14, lg: 20 };
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
