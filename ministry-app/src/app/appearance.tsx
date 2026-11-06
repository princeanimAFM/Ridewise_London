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

const colours: { value: Colour; label: string; note: string; swatch: [string, string] }[] = [
  { value: 'green', label: 'AFM Green', note: 'The AFM HUB’s own colours', swatch: ['#2D6A3E', '#C9A227'] },
  { value: 'blue', label: 'Church Blue & White', note: 'The colours of The AFM Church', swatch: ['#0A3A80', '#A9CCFF'] },
];

/** Each member picks light or dark and green or blue. Saved on this phone only. */
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
            <View style={{ flex: 1, backgroundColor: c.swatch[0] }} />
            <View style={{ flex: 1, backgroundColor: c.swatch[1] }} />
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
