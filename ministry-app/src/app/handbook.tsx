import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { handbook } from '@/content/handbook';
import { MiniPlayer } from '@/components/MiniPlayer';
import { Body, Chip, IconName } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

type SectionKey = 'faq' | 'scripture' | 'slogans' | 'conduct';
const sections: { key: SectionKey; label: string; icon: IconName }[] = [
  { key: 'faq', label: 'FAQs', icon: 'help-circle-outline' },
  { key: 'scripture', label: 'Anchor Scripture', icon: 'book-outline' },
  { key: 'slogans', label: 'Slogans', icon: 'megaphone-outline' },
  { key: 'conduct', label: 'Code of Conduct', icon: 'shield-checkmark-outline' },
];

function Expandable({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const t = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.cardHead} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={[styles.cardTitle, { color: t.text }]}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={t.textMuted} />
      </Pressable>
      {open && <View style={styles.cardBody}>{children}</View>}
    </View>
  );
}

export default function Handbook() {
  const t = useTheme();
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef<Partial<Record<SectionKey, number>>>({});
  const jump = (k: SectionKey) => scroll.current?.scrollTo({ y: Math.max(0, (offsets.current[k] ?? 0) - space.sm), animated: true });
  const mark = (k: SectionKey) => (e: { nativeEvent: { layout: { y: number } } }) => {
    offsets.current[k] = e.nativeEvent.layout.y;
  };

  let ruleNo = 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <View style={styles.maxWidth}>
          <View style={[styles.cover, { backgroundColor: t.primary }]}>
            <Text style={[styles.kicker, { color: t.gold }]}>{handbook.subtitle.toUpperCase()}</Text>
            <Text style={styles.coverTitle}>{handbook.title}</Text>
            <Text style={styles.motto}>{handbook.motto}</Text>
          </View>

          <View style={styles.toc}>
            {sections.map((s) => (
              <Chip key={s.key} label={s.label} active={false} onPress={() => jump(s.key)} />
            ))}
          </View>

          <Pressable onPress={() => router.push('/about')} style={[styles.missionLink, { backgroundColor: t.surfaceAlt }]}>
            <Ionicons name="flag-outline" size={18} color={t.accent} />
            <Text style={{ color: t.text, flex: 1, fontWeight: '600' }}>Mission Statement</Text>
            <Text style={{ color: t.accent, fontWeight: '600' }}>Read →</Text>
          </Pressable>

          <View onLayout={mark('faq')}>
            <Text style={[styles.h2, { color: t.text }]}>Frequently Asked Questions</Text>
            {handbook.faqs.map((f, i) => (
              <Expandable key={f.q} title={f.q} defaultOpen={i === 0}>
                {f.a.map((p, j) => (
                  <Body key={j} style={j === 0 && p.startsWith('“') ? { ...styles.para, fontStyle: 'italic', color: t.textMuted } : styles.para}>
                    {p}
                  </Body>
                ))}
              </Expandable>
            ))}
          </View>

          <View onLayout={mark('scripture')}>
            <Text style={[styles.h2, { color: t.text }]}>Anchor Scripture</Text>
            <View style={[styles.scripture, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.reference, { color: t.accent }]}>{handbook.anchorScripture.reference.toUpperCase()}</Text>
              <Text style={[styles.verses, { color: t.text }]}>
                {handbook.anchorScripture.verses.map((v, i) => (
                  <Text key={i}>
                    <Text style={[styles.verseNo, { color: t.accent }]}>{i + 1} </Text>
                    {v}{' '}
                  </Text>
                ))}
              </Text>
            </View>
          </View>

          <View onLayout={mark('slogans')}>
            <Text style={[styles.h2, { color: t.text }]}>Slogans of the AFM</Text>
            {handbook.slogans.map((s) => {
              const [call, response] = s.split('…');
              return (
                <View key={s} style={[styles.slogan, { backgroundColor: t.primary }]}>
                  <Text style={styles.call}>{call}…</Text>
                  <Text style={[styles.response, { color: t.gold }]}>{response}</Text>
                </View>
              );
            })}
          </View>

          <View onLayout={mark('conduct')}>
            <Text style={[styles.h2, { color: t.text }]}>Code of Conduct</Text>
            {handbook.codeOfConduct.map((g) => {
              const start = ruleNo + 1;
              ruleNo += g.rules.length;
              return (
                <Expandable key={g.title} title={`${g.title}  ·  ${start}–${ruleNo}`}>
                  {g.rules.map((r, i) => (
                    <View key={i} style={styles.rule}>
                      <Text style={[styles.ruleNo, { color: t.accent }]}>{start + i}.</Text>
                      <Body style={{ flex: 1 }}>{r}</Body>
                    </View>
                  ))}
                </Expandable>
              );
            })}
          </View>

          <Text style={[styles.footer, { color: t.textMuted }]}>{handbook.footer}</Text>
        </View>
      </ScrollView>
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  maxWidth: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  cover: { borderRadius: radius.lg, padding: space.lg, alignItems: 'center', gap: space.xs },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  coverTitle: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', textAlign: 'center' },
  motto: { color: '#DCE8DC', fontStyle: 'italic', textAlign: 'center' },
  toc: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  missionLink: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, marginTop: space.md },
  h2: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', marginTop: space.xl, marginBottom: space.sm },
  card: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: space.sm, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  cardBody: { paddingHorizontal: space.md, paddingBottom: space.md },
  para: { marginBottom: space.sm },
  scripture: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: space.md },
  reference: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: space.sm },
  verses: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 28 },
  verseNo: { fontSize: 12, fontWeight: '700' },
  slogan: { borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  call: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 19, fontWeight: '700' },
  response: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  rule: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  ruleNo: { fontWeight: '700', fontSize: 16, lineHeight: 24, minWidth: 28, fontVariant: ['tabular-nums'] },
  footer: { textAlign: 'center', fontStyle: 'italic', marginTop: space.lg },
});
