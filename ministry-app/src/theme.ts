import { Platform, useColorScheme } from 'react-native';
import { useAppearance, type Colour } from '@/lib/appearance';

// AFM green, the app's own colours and the default.
const green = {
  primary: '#2D6A3E', // AFM green (deepened from the original #7FC784 for readability)
  primaryLight: '#7FC784', // original AFM Hub green
  gold: '#C9A227',
  onPrimaryMuted: '#DCE8DC', // soft text on the primary colour
  deep: '10,28,18', // near-black green for photo shades, as "r,g,b"
};

/** One look's colours. The glass looks (Evening Glow, Sunset, Aurora) also set a gradient `backdrop`, `glass` and the colours of the two glows behind it. */
export type Theme = typeof light & { backdrop?: readonly [string, string, ...string[]]; glass?: boolean; glow?: string; glow2?: string };

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

/**
 * A glass look in one colour family: translucent panels over a gradient (`backdrop`) with two soft glows. `night` makes the panels
 * a little clearer and the text a little softer; `tint` is the colour the panels are tinted with (white, or a warm or rosy white).
 */
function glassTheme(c: {
  primary: string; primaryLight: string; gold: string; accent: string; onPrimaryMuted: string; deep: string; background: string;
  backdrop: readonly [string, string, ...string[]]; glow: string; glow2: string; night?: boolean; tint?: string; text?: string;
}): Theme {
  const tint = c.tint ?? '255,255,255';
  const n = !!c.night;
  return {
    primary: c.primary, primaryLight: c.primaryLight, gold: c.gold, onPrimaryMuted: c.onPrimaryMuted, deep: c.deep,
    background: c.background, surface: `rgba(${tint},${n ? 0.08 : 0.13})`, surfaceAlt: `rgba(${tint},${n ? 0.06 : 0.09})`,
    text: c.text ?? (n ? '#F4F6FB' : '#FFFFFF'), textMuted: `rgba(${tint === '255,255,255' ? '230,238,250' : tint},${n ? 0.72 : 0.78})`,
    border: `rgba(${tint},${n ? 0.16 : 0.24})`, onPrimary: '#FFFFFF', accent: c.accent,
    backdrop: c.backdrop, glass: true, glow: c.glow, glow2: c.glow2,
  };
}

// The glass looks the owner chose (November 2026). Each has a gradient behind every screen (`backdrop`), glass panels, soft glows,
// a floating tab bar and a scene behind the Home and Sermons pictures, bright by day (light mode) and dark by night (dark mode).

// Evening Glow: warm brown and copper glass with a peach glow, like the light just after sunset. No yellow.
// Sunset is the same look over a real sunset photograph (stars and a crescent moon at night); Evening Glow's sunset is drawn.
const eveningGlow: { light: Theme; dark: Theme } = {
  light: {
    primary: '#B5562F', primaryLight: '#F2A47F', gold: '#FFCBA6', onPrimaryMuted: '#F6E1D4', deep: '30,14,12',
    background: '#3A2321', surface: 'rgba(255,236,222,0.12)', surfaceAlt: 'rgba(255,236,222,0.085)', text: '#FFF6EE', textMuted: 'rgba(250,228,214,0.76)',
    border: 'rgba(255,226,205,0.24)', onPrimary: '#FFFFFF', accent: '#FFB78C',
    backdrop: ['#4A2C26', '#3B2424', '#2B1B1E', '#1B1216'], glass: true, glow: '255,168,120', glow2: '214,112,120',
  },
  dark: {
    primary: '#9C4A55', primaryLight: '#E9A4A4', gold: '#F5C6B8', onPrimaryMuted: '#F0DAD6', deep: '14,8,12',
    background: '#1F1419', surface: 'rgba(255,236,226,0.075)', surfaceAlt: 'rgba(255,236,226,0.055)', text: '#FBF1EC', textMuted: 'rgba(238,214,206,0.72)',
    border: 'rgba(255,226,214,0.15)', onPrimary: '#FFFFFF', accent: '#F0B1A8',
    backdrop: ['#2A1B22', '#211620', '#170F18', '#0E0A10'], glass: true, glow: '238,150,140', glow2: '150,100,200',
  },
};

// Aurora (emerald and navy): emerald water by day; the northern lights over a navy sky at night.
const aurora = {
  light: glassTheme({ primary: '#14845F', primaryLight: '#93E6C4', gold: '#D2F7E8', accent: '#A8F0D2', onPrimaryMuted: '#DFF6EC', deep: '3,34,38', background: '#0E6E66', backdrop: ['#1B9C88', '#118577', '#0E6264', '#0A3E52'], glow: '170,255,225', glow2: '80,170,230' }),
  dark: glassTheme({ night: true, primary: '#188A66', primaryLight: '#86E8BE', gold: '#BDF5DC', accent: '#9BEFCB', onPrimaryMuted: '#DDF5EA', deep: '3,12,32', background: '#0A2346', backdrop: ['#0A2C48', '#0A2040', '#081734', '#050C20'], glow: '110,240,175', glow2: '60,130,230' }),
};

const themes: Record<Colour, { light: Theme; dark: Theme }> = {
  green: { light, dark },
  blue: { light: blueLight, dark: blueDark },
  dusk: eveningGlow,
  sunset: eveningGlow,
  aurora,
};

/** The colours for this member's chosen look (Owner dashboard and every screen use these). */
export function useIsDark(): boolean {
  const { mode } = useAppearance();
  const system = useColorScheme();
  return mode === 'auto' ? system === 'dark' : mode === 'dark';
}

export function useTheme(): Theme {
  const { colour } = useAppearance();
  const isDark = useIsDark();
  return themes[colour][isDark ? 'dark' : 'light'];
}

/** A shade of the theme's near-black, e.g. shade(t, 0.5) → "rgba(10,28,18,0.5)". */
export const shade = (t: Theme, alpha: number) => `rgba(${t.deep},${alpha})`;

/** A "#RRGGBB" colour with some see-through, e.g. withAlpha('#4A2C26', 0) → "rgba(74,44,38,0)" (fades to nothing without turning grey). */
export const withAlpha = (hex: string, alpha: number) =>
  `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${alpha})`;

export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
};

export const radius = { sm: 8, md: 14, lg: 20 };
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
