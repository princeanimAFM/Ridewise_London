import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BOOKS } from '@/content/bible';
import {
  HIGHLIGHTS,
  reference,
  setBiblePrefs,
  TRANSLATIONS,
  updateMarks,
  useBible,
  useBiblePrefs,
  useMarks,
  verseKey,
  type HighlightColour,
} from '@/lib/bible';
import { shareText } from '@/lib/links';
import { useContent } from '@/lib/liveContent';
import { Button } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

const isDarkColour = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 128;
};

/** One chapter. Tap verses to highlight, bookmark, copy or share them. */
export default function Reader() {
  const t = useTheme();
  const ministry = useContent();
  const params = useLocalSearchParams<{ book: string; chapter: string; verse?: string }>();
  const book = Math.min(Math.max(Number(params.book) || 0, 0), BOOKS.length - 1);
  const chapter = Math.min(Math.max(Number(params.chapter) || 1, 1), BOOKS[book][2]);
  const target = Number(params.verse) || 0;

  const prefs = useBiblePrefs();
  const marks = useMarks();
  const { data, error, loading, retry } = useBible(prefs.translation);
  const verses = data?.books[book]?.chapters[chapter - 1] ?? [];
  const dark = isDarkColour(t.background);

  const [selected, setSelected] = useState<number[]>([]);
  const [showSize, setShowSize] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const positions = useRef<Record<number, number>>({});
  const scrolled = useRef(false);

  useEffect(() => {
    setBiblePrefs({ last: { book, chapter } });
    setSelected([]);
    scrolled.current = false;
    positions.current = {};
    if (!target) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [book, chapter, target]);

  const onVerseLayout = (v: number, y: number) => {
    positions.current[v] = y;
    if (v === target && !scrolled.current) {
      scrolled.current = true;
      setTimeout(() => scroll.current?.scrollTo({ y: Math.max(y - 80, 0), animated: true }), 50);
    }
  };

  const open = (b: number, c: number) => router.replace({ pathname: '/bible/read', params: { book: b, chapter: c } });
  const prev = chapter > 1 ? [book, chapter - 1] : book > 0 ? [book - 1, BOOKS[book - 1][2]] : null;
  const next = chapter < BOOKS[book][2] ? [book, chapter + 1] : book < BOOKS.length - 1 ? [book + 1, 1] : null;

  const keys = selected.map((v) => verseKey(book, chapter, v));
  const allBookmarked = keys.length > 0 && keys.every((k) => marks[k]?.bookmark);
  const selectionText = useMemo(() => {
    const sorted = [...selected].sort((a, b) => a - b);
    const body = sorted.map((v) => (sorted.length > 1 ? `${v} ${verses[v - 1]}` : verses[v - 1])).join(' ');
    return `“${body}”\n— ${reference(book, chapter, sorted)} (${TRANSLATIONS[prefs.translation].short})`;
  }, [selected, verses, book, chapter, prefs.translation]);

  const toggle = (v: number) => setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  const highlight = (colour: HighlightColour | null) => {
    updateMarks(keys, { colour });
    setSelected([]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: reference(book, chapter),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable
                hitSlop={8}
                onPress={() => router.push('/bible/versions')}
                style={styles.headerChip}
                accessibilityLabel="Change Bible version"
              >
                <Text style={styles.headerChipText}>{TRANSLATIONS[prefs.translation].short}</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={() => setShowSize((s) => !s)} accessibilityLabel="Text size">
                <Text style={styles.aa}>Aa</Text>
              </Pressable>
            </View>
          ),
        }}
      />

      {showSize && (
        <View style={[styles.sizeBar, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={{ color: t.textMuted }}>Text size</Text>
          <Pressable onPress={() => setBiblePrefs({ size: Math.max(14, prefs.size - 2) })} style={[styles.sizeBtn, { borderColor: t.border }]}>
            <Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>A−</Text>
          </Pressable>
          <Text style={{ color: t.text, width: 28, textAlign: 'center' }}>{prefs.size}</Text>
          <Pressable onPress={() => setBiblePrefs({ size: Math.min(30, prefs.size + 2) })} style={[styles.sizeBtn, { borderColor: t.border }]}>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>A+</Text>
          </Pressable>
        </View>
      )}

      <ScrollView ref={scroll} contentContainerStyle={styles.page}>
        <View style={styles.maxWidth}>
          <Text style={[styles.heading, { color: t.text }]}>{reference(book, chapter)}</Text>
          {loading && (
            <View style={{ alignItems: 'center', marginTop: space.xl }}>
              <ActivityIndicator color={t.accent} />
              <Text style={{ color: t.textMuted, marginTop: space.sm, textAlign: 'center' }}>
                Downloading the {TRANSLATIONS[prefs.translation].name}. This happens once; after that it works offline.
              </Text>
            </View>
          )}
          {!!error && (
            <View style={{ marginTop: space.lg }}>
              <Text style={{ color: t.text, textAlign: 'center' }}>{error}</Text>
              <Button label="Try again" icon="refresh" onPress={retry} style={{ marginTop: space.md }} />
            </View>
          )}
          {verses.map((text, i) => {
            const v = i + 1;
            if (!text) return null;
            const mark = marks[verseKey(book, chapter, v)];
            const isSelected = selected.includes(v);
            const bg = mark?.colour ? HIGHLIGHTS[mark.colour][dark ? 'dark' : 'light'] : v === target ? t.surfaceAlt : 'transparent';
            return (
              <Pressable key={v} onPress={() => toggle(v)} onLayout={(e) => onVerseLayout(v, e.nativeEvent.layout.y)}>
                <Text
                  style={[
                    styles.verse,
                    { color: t.text, fontSize: prefs.size, lineHeight: Math.round(prefs.size * 1.6), backgroundColor: bg },
                    isSelected && { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: t.accent },
                  ]}
                >
                  <Text style={[styles.num, { color: t.accent, fontSize: Math.round(prefs.size * 0.65) }]}>{v} </Text>
                  {text}
                  {mark?.bookmark ? <Text style={{ color: t.accent }}>  ★</Text> : null}
                </Text>
              </Pressable>
            );
          })}
          {!!verses.length && (
            <Text style={{ color: t.textMuted, fontSize: 12, marginTop: space.lg, textAlign: 'center' }}>
              {TRANSLATIONS[prefs.translation].name}. {TRANSLATIONS[prefs.translation].credit}
            </Text>
          )}
        </View>
      </ScrollView>

      {selected.length > 0 ? (
        <View style={[styles.bar, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.barRow}>
            <Text style={{ color: t.text, fontWeight: '700', flex: 1 }} numberOfLines={1}>
              {reference(book, chapter, selected)}
            </Text>
            <Pressable onPress={() => setSelected([])} hitSlop={10}>
              <Ionicons name="close" size={22} color={t.textMuted} />
            </Pressable>
          </View>
          <View style={styles.barRow}>
            {(Object.keys(HIGHLIGHTS) as HighlightColour[]).map((c) => (
              <Pressable key={c} onPress={() => highlight(c)} accessibilityLabel={`Highlight ${c}`} style={[styles.swatch, { backgroundColor: HIGHLIGHTS[c].light }]} />
            ))}
            <Pressable onPress={() => highlight(null)} accessibilityLabel="Remove highlight" style={[styles.swatch, styles.clear, { borderColor: t.border }]}>
              <Ionicons name="close" size={16} color={t.textMuted} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => { updateMarks(keys, { bookmark: !allBookmarked }); setSelected([]); }} hitSlop={6} style={styles.action}>
              <Ionicons name={allBookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={t.accent} />
            </Pressable>
            <Pressable onPress={async () => { await Clipboard.setStringAsync(selectionText); setSelected([]); }} hitSlop={6} style={styles.action}>
              <Ionicons name="copy-outline" size={22} color={t.accent} />
            </Pressable>
            <Pressable onPress={() => shareText(`${selectionText}\n\nShared from ${ministry.name}`)} hitSlop={6} style={styles.action}>
              <Ionicons name="share-social-outline" size={22} color={t.accent} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.nav, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Pressable disabled={!prev} onPress={() => prev && open(prev[0], prev[1])} style={[styles.navBtn, !prev && { opacity: 0.3 }]}>
            <Ionicons name="chevron-back" size={20} color={t.accent} />
            <Text style={{ color: t.text, fontWeight: '600' }} numberOfLines={1}>{prev ? reference(prev[0], prev[1]) : ''}</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/bible/[book]', params: { book } })} hitSlop={8}>
            <Ionicons name="grid-outline" size={20} color={t.textMuted} />
          </Pressable>
          <Pressable disabled={!next} onPress={() => next && open(next[0], next[1])} style={[styles.navBtn, { justifyContent: 'flex-end' }, !next && { opacity: 0.3 }]}>
            <Text style={{ color: t.text, fontWeight: '600' }} numberOfLines={1}>{next ? reference(next[0], next[1]) : ''}</Text>
            <Ionicons name="chevron-forward" size={20} color={t.accent} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginRight: space.sm },
  headerChip: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  headerChipText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  aa: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
  sizeBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  sizeBtn: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 4 },
  page: { padding: space.md, paddingBottom: space.xl * 2 },
  maxWidth: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  heading: { fontFamily: fonts.serif, fontSize: 26, fontWeight: '700', marginBottom: space.md },
  verse: { fontFamily: fonts.serif, paddingVertical: 3, paddingHorizontal: 4, borderRadius: 4 },
  num: { fontWeight: '700', fontFamily: undefined },
  bar: { borderTopWidth: StyleSheet.hairlineWidth, padding: space.md, gap: space.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  swatch: { width: 30, height: 30, borderRadius: 15 },
  clear: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  action: { paddingHorizontal: 6 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
});
