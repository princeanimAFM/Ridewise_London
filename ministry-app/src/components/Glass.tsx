import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';

/*
 * Building blocks for the "glass" looks (Evening Glow, Sunset, Aurora): a gradient behind every screen, panels that catch the light,
 * soft waves on hero pictures and a floating tab bar. Everything is made of translucent colours, gradients and rounded
 * shapes (no blur or drawing library), so it also works on phones that already have the app installed.
 */

/** The height of the floating tab bar, and how far it floats above the bottom edge of the screen. */
export const FLOATING_BAR = 64;
export const floatingBarBottom = (safeBottom: number) => Math.max(safeBottom, 8) + 6;
/** How much room a tab screen leaves at the bottom so nothing hides behind the floating bar. */
export const floatingBarSpace = (safeBottom: number) => FLOATING_BAR + floatingBarBottom(safeBottom) + 10;

/** A soft round glow: stacked translucent circles fade out towards the edge, so it needs no blur. */
function Glow({ size, rgb, strength, style }: { size: number; rgb: string; strength: number; style: ViewStyle }) {
  const rings = 9;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      {Array.from({ length: rings }, (_, i) => {
        const d = size * (1 - i / rings);
        return (
          <View
            key={i}
            style={{ position: 'absolute', width: d, height: d, left: (size - d) / 2, top: (size - d) / 2, borderRadius: d / 2, backgroundColor: `rgba(${rgb},${(strength / rings).toFixed(3)})` }}
          />
        );
      })}
    </View>
  );
}

/** A faint glass bubble: a ring of light with a soft fill, like a drop of water floating behind the content. */
function Bubble({ size, style }: { size: number; style: ViewStyle }) {
  return (
    <View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }, style]}
    >
      <LinearGradient colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
    </View>
  );
}

/** The gradient behind every screen in a glass look. It runs straight down so the header can start with its first colour. */
export function Backdrop() {
  const t = useTheme();
  if (!t.backdrop) return null;
  const stops = t.backdrop;
  const locations = stops.map((_, i) => i / (stops.length - 1)) as unknown as readonly [number, number, ...number[]];
  const glow = t.glow ?? '120,220,250';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={stops} locations={locations} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      <Glow size={440} rgb={glow} strength={0.2} style={{ top: 70, right: -190 }} />
      <Glow size={420} rgb={t.glow2 ?? '110,140,255'} strength={0.15} style={{ bottom: 40, left: -190 }} />
      <Bubble size={230} style={{ top: 190, left: -120 }} />
      <Bubble size={320} style={{ bottom: 90, right: -170 }} />
    </View>
  );
}

/** A faint sweep of light across a panel (brighter at the top left), so it looks like glass rather than a flat tint. */
export function Sheen() {
  const t = useTheme();
  if (!t.glass) return null;
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

/** Soft layered swells along the bottom of a hero picture, each with a thin rim of light along its crest. */
export function Waves({ height = 76 }: { height?: number }) {
  const t = useTheme();
  if (!t.glass) return null;
  const glow = t.glow ?? '120,220,250';
  const swells: { left: DimensionValue; width: DimensionValue; top: number; fill: number; rim: number }[] = [
    { left: '-45%', width: '135%', top: 0.34, fill: 0.26, rim: 0.4 },
    { left: '18%', width: '140%', top: 0.56, fill: 0.2, rim: 0.32 },
    { left: '-80%', width: '175%', top: 0.76, fill: 0.16, rim: 0.26 },
  ];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height, overflow: 'hidden' }}>
      {swells.map((w, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: w.left,
            width: w.width,
            top: height * w.top,
            height: height * 1.1,
            overflow: 'hidden',
            borderTopLeftRadius: '50%' as unknown as number,
            borderTopRightRadius: '50%' as unknown as number,
            borderTopWidth: 1.5,
            borderTopColor: `rgba(255,255,255,${w.rim})`,
          }}
        >
          <LinearGradient colors={[`rgba(${glow},${w.fill})`, `rgba(${glow},0.02)`]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
        </View>
      ))}
    </View>
  );
}

/** The frosted pill behind the floating tab bar. */
export function GlassBar() {
  const t = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: FLOATING_BAR / 2, overflow: 'hidden', backgroundColor: `rgba(${t.deep},0.9)` }]}>
      <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.03)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
    </View>
  );
}
