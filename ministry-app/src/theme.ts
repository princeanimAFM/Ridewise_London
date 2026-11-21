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

// Sample looks for the owner to choose from (November 2026). Each has a deep main colour, a soft second colour and a bold
// third colour (the "pop", never yellow) that carries the highlights, icons, links, play buttons and progress bars.
// `gold` is the pop on dark surfaces (and for buttons); `accent` is a deeper pop that reads on light backgrounds.
const forest = { primary: '#1E4A36', primaryLight: '#7FAE93', gold: '#FF8FB1', onPrimaryMuted: '#D4E3DA', deep: '8,26,18' }; // + blush pink
const brown = { primary: '#4E2F20', primaryLight: '#B98D6C', gold: '#6EC6F5', onPrimaryMuted: '#EADCCF', deep: '30,18,12' }; // + sky blue
const purple = { primary: '#4A2470', primaryLight: '#B9A0DA', gold: '#4EE0B5', onPrimaryMuted: '#E5DCF1', deep: '22,10,36' }; // + mint
const wine = { primary: '#6A1E2F', primaryLight: '#D99BA7', gold: '#33C9BA', onPrimaryMuted: '#F1D9DE', deep: '36,9,15' }; // + turquoise

const looks = {
  forest: {
    light: { ...forest, background: '#F6F4EE', surface: '#FFFFFF', surfaceAlt: '#FBE9EF', text: '#17211B', textMuted: '#5E6B63', border: '#E8DDE0', onPrimary: '#FFFFFF', accent: '#C2335F' },
    dark: { ...forest, background: '#0C1410', surface: '#141F19', surfaceAlt: '#22302A', text: '#EEF3EF', textMuted: '#9DB0A4', border: '#27382E', onPrimary: '#FFFFFF', accent: '#FF8FB1' },
  },
  brown: {
    light: { ...brown, background: '#FAF6F1', surface: '#FFFFFF', surfaceAlt: '#E4F2FB', text: '#2A1D16', textMuted: '#7A6657', border: '#E9DCCE', onPrimary: '#FFFFFF', accent: '#1D78A8' },
    dark: { ...brown, background: '#15100C', surface: '#211812', surfaceAlt: '#2A2A2E', text: '#F5EDE6', textMuted: '#BDA998', border: '#3A2C22', onPrimary: '#FFFFFF', accent: '#6EC6F5' },
  },
  purple: {
    light: { ...purple, background: '#F8F6FB', surface: '#FFFFFF', surfaceAlt: '#DFF7EF', text: '#1E1529', textMuted: '#6B6078', border: '#E3DAEE', onPrimary: '#FFFFFF', accent: '#0C8561' },
    dark: { ...purple, background: '#110C18', surface: '#1A1424', surfaceAlt: '#1F2B33', text: '#F3EFF8', textMuted: '#B3A8C3', border: '#322646', onPrimary: '#FFFFFF', accent: '#4EE0B5' },
  },
  wine: {
    light: { ...wine, background: '#FBF6F6', surface: '#FFFFFF', surfaceAlt: '#DDF4F1', text: '#2A1318', textMuted: '#7D6066', border: '#EEDCE0', onPrimary: '#FFFFFF', accent: '#0C8076' },
    dark: { ...wine, background: '#170C0F', surface: '#231317', surfaceAlt: '#1D2D2E', text: '#F8EEF0', textMuted: '#C4A9AF', border: '#40242A', onPrimary: '#FFFFFF', accent: '#33C9BA' },
  },
  // Today's AFM Green and Church Blue with a bold third colour instead of gold / light blue (the originals stay as they are).
  greenCoral: {
    light: { ...light, gold: '#FF8C73', surfaceAlt: '#FDE9E3', accent: '#CC4126' },
    dark: { ...dark, gold: '#FF8C73', surfaceAlt: '#2A2A22', accent: '#FF9A82' },
  },
  blueOrange: {
    light: { ...blueLight, gold: '#FF8A33', surfaceAlt: '#FFEBDA', accent: '#C25A0A' },
    dark: { ...blueDark, gold: '#FF8A33', surfaceAlt: '#2A2A33', accent: '#FFA05C' },
  },
} satisfies Record<string, { light: typeof light; dark: typeof light }>;

export type Theme = typeof light;

const themes = { green: { light, dark }, blue: { light: blueLight, dark: blueDark }, ...looks };

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
