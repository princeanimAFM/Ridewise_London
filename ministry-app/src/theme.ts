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

/** One look's colours. The glass looks (Living Water) also set a gradient `backdrop`, `glass` and the colours of the two glows behind it. */
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

// Sample looks for the owner to choose from (November 2026). Each has a deep main colour, a soft second colour and a gentle
// third colour: a lighter, softer neighbour of the main colour on the colour wheel, so they go together instead of clashing.
// `gold` is that third colour on dark surfaces (and for buttons); `accent` is a deeper shade that reads on light backgrounds.
const forest = { primary: '#1E4A36', primaryLight: '#7FAE93', gold: '#A8CDB6', onPrimaryMuted: '#D4E3DA', deep: '8,26,18' }; // + sage
const brown = { primary: '#4E2F20', primaryLight: '#B98D6C', gold: '#D9AE98', onPrimaryMuted: '#EADCCF', deep: '30,18,12' }; // + clay
const purple = { primary: '#4A2470', primaryLight: '#B9A0DA', gold: '#CDB0E6', onPrimaryMuted: '#E5DCF1', deep: '22,10,36' }; // + orchid
const wine = { primary: '#6A1E2F', primaryLight: '#D99BA7', gold: '#E3B0B6', onPrimaryMuted: '#F1D9DE', deep: '36,9,15' }; // + dusty rose

// Looks built from a colour-pair chart: a main colour with the partner it goes with (November 2026).
const emerald = { primary: '#18794E', primaryLight: '#7FD1A5', gold: '#D4F3E2', onPrimaryMuted: '#D8EFE3', deep: '6,34,22' }; // + deep navy
const rust = { primary: '#A4481F', primaryLight: '#E39B75', gold: '#CBD3D5', onPrimaryMuted: '#F1DDD2', deep: '40,18,8' }; // + cool grey
const crimson = { primary: '#9B2D24', primaryLight: '#E08A82', gold: '#9CCBEA', onPrimaryMuted: '#F3DAD7', deep: '40,10,10' }; // + light sky blue

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

const looks = {
  emerald: {
    light: { ...emerald, background: '#F2F7F4', surface: '#FFFFFF', surfaceAlt: '#E3ECF4', text: '#0A1F33', textMuted: '#566A7A', border: '#D9E3EA', onPrimary: '#FFFFFF', accent: '#14365A' },
    dark: { ...emerald, background: '#0A1822', surface: '#10232F', surfaceAlt: '#17303D', text: '#EAF3EF', textMuted: '#9DB5B0', border: '#1F3A47', onPrimary: '#FFFFFF', accent: '#8FD5B0' },
  },
  rust: {
    light: { ...rust, background: '#F7F5F3', surface: '#FFFFFF', surfaceAlt: '#E8EDEE', text: '#22282A', textMuted: '#667075', border: '#E3E6E7', onPrimary: '#FFFFFF', accent: '#4F6166' },
    dark: { ...rust, background: '#141211', surface: '#1E1B1A', surfaceAlt: '#272B2C', text: '#F3F0EE', textMuted: '#AAB2B5', border: '#33383A', onPrimary: '#FFFFFF', accent: '#B7C3C6' },
  },
  crimson: {
    light: { ...crimson, background: '#FBF7F6', surface: '#FFFFFF', surfaceAlt: '#E6F1F9', text: '#2A1514', textMuted: '#7B6361', border: '#EEDDDB', onPrimary: '#FFFFFF', accent: '#2F78AB' },
    dark: { ...crimson, background: '#170D0D', surface: '#231414', surfaceAlt: '#1F2A33', text: '#F8EEEE', textMuted: '#C7ABAA', border: '#402626', onPrimary: '#FFFFFF', accent: '#9CCBEA' },
  },
  forest: {
    light: { ...forest, background: '#F6F4EE', surface: '#FFFFFF', surfaceAlt: '#E7F0EA', text: '#17211B', textMuted: '#5E6B63', border: '#DDE5DF', onPrimary: '#FFFFFF', accent: '#3B7A5C' },
    dark: { ...forest, background: '#0C1410', surface: '#141F19', surfaceAlt: '#1F2F27', text: '#EEF3EF', textMuted: '#9DB0A4', border: '#27382E', onPrimary: '#FFFFFF', accent: '#A8CDB6' },
  },
  brown: {
    light: { ...brown, background: '#FAF6F1', surface: '#FFFFFF', surfaceAlt: '#F6EAE3', text: '#2A1D16', textMuted: '#7A6657', border: '#E9DCCE', onPrimary: '#FFFFFF', accent: '#9C5A3E' },
    dark: { ...brown, background: '#15100C', surface: '#211812', surfaceAlt: '#2B211B', text: '#F5EDE6', textMuted: '#BDA998', border: '#3A2C22', onPrimary: '#FFFFFF', accent: '#D9AE98' },
  },
  purple: {
    light: { ...purple, background: '#F8F6FB', surface: '#FFFFFF', surfaceAlt: '#F0E8F8', text: '#1E1529', textMuted: '#6B6078', border: '#E3DAEE', onPrimary: '#FFFFFF', accent: '#7B4DAA' },
    dark: { ...purple, background: '#110C18', surface: '#1A1424', surfaceAlt: '#261C33', text: '#F3EFF8', textMuted: '#B3A8C3', border: '#322646', onPrimary: '#FFFFFF', accent: '#CDB0E6' },
  },
  wine: {
    light: { ...wine, background: '#FBF6F6', surface: '#FFFFFF', surfaceAlt: '#F9E9EB', text: '#2A1318', textMuted: '#7D6066', border: '#EEDCE0', onPrimary: '#FFFFFF', accent: '#A33C50' },
    dark: { ...wine, background: '#170C0F', surface: '#231317', surfaceAlt: '#301C21', text: '#F8EEF0', textMuted: '#C4A9AF', border: '#40242A', onPrimary: '#FFFFFF', accent: '#E3B0B6' },
  },
  // Living Water: deep ocean gradients, glass panels, glowing cyan highlights and a floating tab bar (inspired by Tide Guide).
  // `backdrop` is the gradient behind every screen; `glass` turns on the panel sheen, wave shapes and floating bar.
  // Day is the ocean (teal to deep blue); night is the same sea after dark (indigo).
  tide: {
    light: {
      primary: '#1B7FD0', primaryLight: '#8FD6F5', gold: '#8BE6F7', onPrimaryMuted: '#DCEEFB', deep: '4,22,52',
      background: '#0D5C9E', surface: 'rgba(255,255,255,0.11)', surfaceAlt: 'rgba(255,255,255,0.08)', text: '#FFFFFF', textMuted: 'rgba(226,240,255,0.76)',
      border: 'rgba(255,255,255,0.22)', onPrimary: '#FFFFFF', accent: '#7EDDF5',
      backdrop: ['#1289B4', '#0D66AC', '#0A3F82', '#08265A'], glass: true, glow: '120,225,250', glow2: '90,140,255',
    },
    dark: {
      primary: '#3F66E0', primaryLight: '#9DB4FF', gold: '#A9C4FF', onPrimaryMuted: '#DDE6FF', deep: '5,10,40',
      background: '#131E5C', surface: 'rgba(255,255,255,0.08)', surfaceAlt: 'rgba(255,255,255,0.06)', text: '#F2F5FF', textMuted: 'rgba(210,222,250,0.72)',
      border: 'rgba(255,255,255,0.16)', onPrimary: '#FFFFFF', accent: '#9CC2FF',
      backdrop: ['#2B2A82', '#1B2A7E', '#101C5A', '#080F33'], glass: true, glow: '130,150,255', glow2: '170,110,255',
    },
  },
  // Living Water, sky edition: the same glass, over real sky photographs. Day is clear blue with white clouds; night is stars, the Milky Way and a full moon.
  sky: {
    light: {
      primary: '#2272D6', primaryLight: '#A4D4FF', gold: '#CDE9FF', onPrimaryMuted: '#E4F1FF', deep: '8,32,78',
      background: '#1E64B8', surface: 'rgba(255,255,255,0.15)', surfaceAlt: 'rgba(255,255,255,0.11)', text: '#FFFFFF', textMuted: 'rgba(232,243,255,0.80)',
      border: 'rgba(255,255,255,0.28)', onPrimary: '#FFFFFF', accent: '#B6E0FF',
      backdrop: ['#0B4A9C', '#0D4E9F', '#0C4287', '#0A2F68'], glass: true, glow: '255,246,228', glow2: '120,178,255',
    },
    dark: {
      primary: '#4A63D8', primaryLight: '#A9B8FF', gold: '#C9D4FF', onPrimaryMuted: '#E0E6FF', deep: '6,9,34',
      background: '#161C58', surface: 'rgba(255,255,255,0.09)', surfaceAlt: 'rgba(255,255,255,0.065)', text: '#F2F5FF', textMuted: 'rgba(214,224,252,0.74)',
      border: 'rgba(255,255,255,0.17)', onPrimary: '#FFFFFF', accent: '#B4C6FF',
      backdrop: ['#0D1440', '#0C1340', '#0A0F31', '#070A1F'], glass: true, glow: '205,218,255', glow2: '120,130,230',
    },
  },
  // Evening Glow: warm brown and copper glass with a peach glow, like the light just after sunset. No yellow.
  dusk: {
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
  },
  // Glass looks for every colour (November 2026): the same glass over a real scene in that colour, bright by day, dark by night.
  // AFM Green: sunlight through green leaves, with gold highlights.
  golden: {
    light: glassTheme({ primary: '#2F7A45', primaryLight: '#A5DAA8', gold: '#F0D27A', accent: '#F0D27A', onPrimaryMuted: '#E6F0E0', deep: '10,26,12', background: '#27401C', backdrop: ['#44521F', '#34501F', '#24401E', '#142B17'], glow: '255,215,120', glow2: '110,190,120' }),
    dark: glassTheme({ night: true, primary: '#2C6B43', primaryLight: '#93D3A6', gold: '#E4C76E', accent: '#E4C76E', onPrimaryMuted: '#DCEBDD', deep: '5,16,9', background: '#0F1F13', backdrop: ['#243018', '#1A2814', '#101B0E', '#080F08'], glow: '255,214,120', glow2: '80,160,110' }),
  },
  // Forest Green & Sage: pines in mist.
  mist: {
    light: glassTheme({ primary: '#2F6150', primaryLight: '#B5D9C2', gold: '#D5EBDB', accent: '#C3E3CD', onPrimaryMuted: '#E4EFE7', deep: '9,28,22', background: '#3A5A4C', backdrop: ['#4C6F63', '#3E6054', '#2E4C41', '#1D3229'], glow: '210,235,220', glow2: '110,170,150' }),
    dark: glassTheme({ night: true, primary: '#2D5B4A', primaryLight: '#A2CDB5', gold: '#C2DECB', accent: '#B9D9C4', onPrimaryMuted: '#DDEBE2', deep: '4,14,11', background: '#14221E', backdrop: ['#34484B', '#1F302F', '#14211F', '#09100F'], glow: '160,205,190', glow2: '90,130,125' }),
  },
  // Royal Purple & Orchid: violet and orchid clouds; a crescent moon at night.
  twilight: {
    light: glassTheme({ primary: '#6B42B8', primaryLight: '#D2BDF5', gold: '#EBCFF8', accent: '#E4C8F5', onPrimaryMuted: '#EDE3F8', deep: '26,12,52', background: '#4C3A8C', backdrop: ['#7A62B8', '#624AA6', '#493589', '#2E2260'], glow: '255,200,240', glow2: '140,120,255' }),
    dark: glassTheme({ night: true, primary: '#5B40A8', primaryLight: '#BDAAEC', gold: '#DCC6F3', accent: '#D4BFF0', onPrimaryMuted: '#E3DCF4', deep: '10,8,30', background: '#1C1A44', backdrop: ['#3B3A66', '#2B2954', '#1C1A3C', '#100E26'], glow: '190,170,250', glow2: '110,110,220' }),
  },
  // Wine & Dusty Rose: rose clouds; a wine-dark sky with the moon at night.
  rose: {
    light: glassTheme({ tint: '255,236,240', text: '#FFF6F8', primary: '#8F3050', primaryLight: '#F2B8C6', gold: '#F8D0D8', accent: '#F6C6D0', onPrimaryMuted: '#F8E3E8', deep: '40,10,24', background: '#6A2C4C', backdrop: ['#85486E', '#6F3A5E', '#552B49', '#361A2E'], glow: '255,190,210', glow2: '200,120,180' }),
    dark: glassTheme({ night: true, tint: '255,232,238', text: '#FBF1F4', primary: '#7C2C48', primaryLight: '#E6A8B8', gold: '#F0C2CC', accent: '#EBB8C3', onPrimaryMuted: '#F2DDE2', deep: '16,8,16', background: '#241724', backdrop: ['#33223A', '#291A30', '#1B1122', '#0F0A14'], glow: '230,150,180', glow2: '150,100,200' }),
  },
  // Emerald & Navy: emerald water by day; the northern lights over a navy sky at night.
  aurora: {
    light: glassTheme({ primary: '#14845F', primaryLight: '#93E6C4', gold: '#D2F7E8', accent: '#A8F0D2', onPrimaryMuted: '#DFF6EC', deep: '3,34,38', background: '#0E6E66', backdrop: ['#1B9C88', '#118577', '#0E6264', '#0A3E52'], glow: '170,255,225', glow2: '80,170,230' }),
    dark: glassTheme({ night: true, primary: '#188A66', primaryLight: '#86E8BE', gold: '#BDF5DC', accent: '#9BEFCB', onPrimaryMuted: '#DDF5EA', deep: '3,12,32', background: '#0A2346', backdrop: ['#0A2C48', '#0A2040', '#081734', '#050C20'], glow: '110,240,175', glow2: '60,130,230' }),
  },
  // Burnt Orange & Slate: slate cloud lit orange; a dark storm with an orange rim at night.
  storm: {
    light: glassTheme({ primary: '#B5521F', primaryLight: '#F2AB7C', gold: '#FFC9A3', accent: '#FFB27F', onPrimaryMuted: '#F6E2D6', deep: '28,22,32', background: '#44485E', backdrop: ['#6A6680', '#575971', '#40445A', '#282C3C'], glow: '255,170,110', glow2: '150,160,200' }),
    dark: glassTheme({ night: true, primary: '#A24A1F', primaryLight: '#F0A474', gold: '#FFC49C', accent: '#FFAE78', onPrimaryMuted: '#F1DED2', deep: '8,12,14', background: '#162024', backdrop: ['#4A3626', '#2C2C28', '#1B2225', '#0F1518'], glow: '255,160,100', glow2: '110,140,150' }),
  },
  // Deep Red & Sky: red cloud in a blue evening sky; crimson dusk with stars at night.
  redsky: {
    light: glassTheme({ primary: '#B2342C', primaryLight: '#F29A92', gold: '#A9D4F2', accent: '#A9D4F2', onPrimaryMuted: '#F6DDDA', deep: '36,10,18', background: '#42305F', backdrop: ['#2F5088', '#40457A', '#4D2F5A', '#32142A'], glow: '255,150,130', glow2: '120,170,240' }),
    dark: glassTheme({ night: true, primary: '#A02D2B', primaryLight: '#F09A94', gold: '#A3CDEB', accent: '#A3CDEB', onPrimaryMuted: '#F2DAD8', deep: '18,4,8', background: '#240E14', backdrop: ['#2A101C', '#230C16', '#18080F', '#0D0508'], glow: '255,110,100', glow2: '100,140,220' }),
  },
  // Today's AFM Green and Church Blue with a soft third colour instead of gold / light blue (the originals stay as they are).
  greenSeafoam: {
    light: { ...light, gold: '#B5DCC4', surfaceAlt: '#E4F2EA', accent: '#2A7766' },
    dark: { ...dark, gold: '#B5DCC4', surfaceAlt: '#1F2E26', accent: '#B5DCC4' },
  },
  blueAqua: {
    light: { ...blueLight, gold: '#8DD0D8', surfaceAlt: '#E2F1F4', accent: '#1B7482' },
    dark: { ...blueDark, gold: '#8DD0D8', surfaceAlt: '#1C2A3B', accent: '#8DD0D8' },
  },
} satisfies Record<string, { light: Theme; dark: Theme }>;

const themes: Record<Colour, { light: Theme; dark: Theme }> = { green: { light, dark }, blue: { light: blueLight, dark: blueDark }, ...looks };

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
