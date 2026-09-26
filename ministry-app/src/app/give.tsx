import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useContent } from '@/lib/liveContent';
import { openLink } from '@/lib/links';
import { PhotoHero } from '@/components/PhotoHero';
import { Body, Screen } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

export default function Give() {
  const ministry = useContent();
  const t = useTheme();
  const [copied, setCopied] = useState('');
  const copy = async (id: string, value: string) => {
    try {
      await Clipboard.setStringAsync(value);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? '' : c)), 2000);
    } catch {
      // clipboard unavailable: the value is selectable text
    }
  };

  return (
    <Screen>
      <PhotoHero source={ministry.photos.biography} height={240} position="top" style={styles.hero}>
        <Text style={[styles.kicker, { color: t.gold }]}>{ministry.themeOfTheYear.title.toUpperCase()}</Text>
        <Text style={styles.title}>Give an Offering</Text>
      </PhotoHero>
      <Body style={{ marginBottom: space.md }}>{ministry.giving.intro}</Body>

      {ministry.giving.methods.map((m) => (
        <View key={m.id} style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: t.accent }]}>{m.label.toUpperCase()}</Text>
            <Text selectable style={[styles.value, { color: t.text }]}>
              {m.value}
            </Text>
            {!!m.note && <Text style={{ color: t.textMuted, marginTop: 2 }}>{m.note}</Text>}
          </View>
          <Pressable onPress={() => copy(m.id, m.value)} hitSlop={8} accessibilityLabel={`Copy ${m.label}`} style={[styles.icon, { backgroundColor: t.surfaceAlt }]}>
            <Ionicons name={copied === m.id ? 'checkmark' : 'copy-outline'} size={20} color={t.primary} />
          </Pressable>
          {!!m.url && (
            <Pressable onPress={() => openLink(m.url)} hitSlop={8} accessibilityLabel={`Open ${m.label}`} style={[styles.icon, { backgroundColor: t.primary }]}>
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      ))}
      {!!copied && <Text style={{ color: t.primary, textAlign: 'center', fontWeight: '700' }}>Copied</Text>}
      <Body muted style={{ marginTop: space.md, fontSize: 14 }}>
        For questions about giving, email {ministry.contact.email}.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, marginBottom: space.md },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: space.sm },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  value: { fontSize: 18, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
