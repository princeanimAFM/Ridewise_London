import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { setAppearance, useAppearance, type Colour, type Mode } from '@/lib/appearance';
import { Body, Screen, SectionHeader } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

const modes: { value: Mode; label: string; note: string; icon: 'phone-portrait-outline' | 'sunny-outline' | 'moon-outline' }[] = [
  { value: 'auto', label: 'Automatic', note: 'Follows your phone’s light or dark setting', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', note: 'Always light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', note: 'Always dark, easier on the eyes at night', icon: 'moon-outline' },
];

const colours: { value: Colour; label: string; note: string; swatch: [string, string, string] }[] = [
  { value: 'green', label: 'AFM Green', note: 'The AFM HUB’s own colours', swatch: ['#2D6A3E', '#C9A227', '#E8F0E6'] },
  { value: 'blue', label: 'Church Blue & White', note: 'The colours of The AFM Church', swatch: ['#0A3A80', '#A9CCFF', '#E6EEF9'] },
  { value: 'greenSeafoam', label: 'AFM Green & Seafoam', note: 'AFM green with a soft seafoam', swatch: ['#2D6A3E', '#B5DCC4', '#E4F2EA'] },
  { value: 'blueAqua', label: 'Church Blue & Aqua', note: 'Church blue with a soft aqua', swatch: ['#0A3A80', '#8DD0D8', '#E2F1F4'] },
  { value: 'forest', label: 'Forest Green & Sage', note: 'Deep forest green with soft sage', swatch: ['#1E4A36', '#A8CDB6', '#E8DCC4'] },
  { value: 'brown', label: 'Mahogany & Clay', note: 'Rich brown with warm clay', swatch: ['#4E2F20', '#D9AE98', '#F0D2B0'] },
  { value: 'purple', label: 'Royal Purple & Orchid', note: 'Royal purple with soft orchid', swatch: ['#4A2470', '#CDB0E6', '#E4D6F6'] },
  { value: 'wine', label: 'Wine & Dusty Rose', note: 'Deep wine red with dusty rose', swatch: ['#6A1E2F', '#E3B0B6', '#F5D3C8'] },
  { value: 'emerald', label: 'Emerald & Navy', note: 'Emerald green with deep navy', swatch: ['#18794E', '#14365A', '#D4F3E2'] },
  { value: 'rust', label: 'Burnt Orange & Slate', note: 'Burnt orange with cool grey', swatch: ['#A4481F', '#CBD3D5', '#E8EDEE'] },
  { value: 'crimson', label: 'Deep Red & Sky', note: 'Deep red with light sky blue', swatch: ['#9B2D24', '#9CCBEA', '#E6F1F9'] },
  { value: 'tide', label: 'Living Water · Ocean', note: 'Glass and blue sea water, bright by day, deep by night', swatch: ['#0D66AC', '#8BE6F7', '#13A0C8'] },
  { value: 'sky', label: 'Living Water · Sky', note: 'Glass and open sky, clouds by day, stars by night', swatch: ['#2272D6', '#CDE9FF', '#62B0F5'] },
  { value: 'dusk', label: 'Evening Glow', note: 'Warm brown and copper glass, sunset by day, dusk by night', swatch: ['#4A2C26', '#FFB78C', '#D8763F'] },
  { value: 'golden', label: 'AFM Green · Golden Forest', note: 'Glass over sunlit green leaves, a moonlit wood at night', swatch: ['#2F7A45', '#F0D27A', '#D9E8C8'] },
  { value: 'mist', label: 'Forest Green & Sage · Misty Pines', note: 'Glass over pines in mist, a moonlit wood at night', swatch: ['#2F6150', '#C3E3CD', '#9CB5A6'] },
  { value: 'twilight', label: 'Royal Purple & Orchid · Twilight', note: 'Glass over violet clouds, a crescent moon and stars at night', swatch: ['#6B42B8', '#E4C8F5', '#F1D8EE'] },
  { value: 'rose', label: 'Wine & Dusty Rose · Rose Clouds', note: 'Glass over rose clouds, a wine-dark sky with the moon at night', swatch: ['#8F3050', '#F6C6D0', '#E7A8C0'] },
  { value: 'aurora', label: 'Emerald & Navy · Aurora', note: 'Glass over emerald water, northern lights at night', swatch: ['#14845F', '#0A2C48', '#A8F0D2'] },
  { value: 'storm', label: 'Burnt Orange & Slate · Storm Light', note: 'Glass over slate clouds lit orange, a dark storm at night', swatch: ['#B5521F', '#40445A', '#FFB27F'] },
  { value: 'redsky', label: 'Deep Red & Sky · Red Sky', note: 'Glass over a red evening sky, crimson dusk and stars at night', swatch: ['#B2342C', '#A9D4F2', '#2F5088'] },
];

/** Each member picks light or dark and one of the colour looks. Saved on this phone only. */
export default function AppearanceScreen() {
  const t = useTheme();
  const { mode, colour } = useAppearance();

  const option = (selected: boolean, onPress: () => void, left: ReactNode, label: string, note: string) => (
    <Pressable
      key={label}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: t.surface, borderColor: selected ? t.accent : t.border, borderWidth: selected ? 2 : StyleSheet.hairlineWidth },
        pressed && { opacity: 0.85 },
      ]}
    >
      {left}
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{label}</Text>
        <Text style={{ color: t.textMuted, marginTop: 2 }}>{note}</Text>
      </View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? t.accent : t.textMuted} />
    </Pressable>
  );

  return (
    <Screen>
      <Body muted>Choose how the app looks on this phone. It only changes your own app.</Body>

      <SectionHeader title="Colour" />
      {colours.map((c) =>
        option(
          colour === c.value,
          () => setAppearance({ colour: c.value }),
          <View style={styles.swatch}>
            <View style={{ flex: 2, backgroundColor: c.swatch[0] }} />
            <View style={{ flex: 1, backgroundColor: c.swatch[2] }} />
            <View style={{ flex: 2, backgroundColor: c.swatch[1] }} />
          </View>,
          c.label,
          c.note,
        ),
      )}

      <SectionHeader title="Light or dark" />
      {modes.map((m) =>
        option(mode === m.value, () => setAppearance({ mode: m.value }), <Ionicons name={m.icon} size={24} color={t.accent} style={{ width: 36 }} />, m.label, m.note),
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, marginBottom: space.sm },
  swatch: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', flexDirection: 'row' },
});
