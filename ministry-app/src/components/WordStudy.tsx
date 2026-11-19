import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookName, concordance, reference, TRANSLATIONS, useBible, useBiblePrefs, type Concordance } from '@/lib/bible';
import { entry, strongsId, useStrongs, verseWords } from '@/lib/strongs';
import { lookup, plain, useDictionary } from '@/lib/dictionary';
import { fonts, radius, space, useTheme } from '@/theme';

/** Splits a verse into words (odd parts) and the spaces and punctuation between them (even parts). */
export const WORD_SPLIT = /([A-Za-z\u00C0-\u024F\u0250-\u02AF\u1E00-\u1EFF\u0300-\u036F]+)/;

export type StudyWord = { word: string; book: number; chapter: number; verse: number };
type Part = 'all' | 'ot' | 'nt' | number;

/**
 * The concordance as a pop-up over the chapter being read: the word tapped, how often and where it
 * appears, its Hebrew or Greek word in this verse, and the verses. Tap a verse to go to it, or open the
 * full-screen concordance.
 */
export function WordStudy({ study, onClose, onGoTo }: { study: StudyWord | null; onClose: () => void; onGoTo: (book: number, chapter: number, verse: number) => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const prefs = useBiblePrefs();
  const { data } = useBible(prefs.translation);
  const strongs = useStrongs(!!study);
  const dict = useDictionary(!!study);
  const meaning = study && dict.data ? lookup(dict.data, study.word)[0] : undefined;
  const [found, setFound] = useState<{ key: string; result: Concordance } | null>(null);
  const [part, setPart] = useState<Part>('all');
  const key = study && data ? `${prefs.translation}|${study.word}` : null;

  // The first look-up builds the version's word list (about a second on a phone), so the sheet opens first.
  useEffect(() => {
    if (!study || !data || !key) return;
    const id = setTimeout(() => setFound({ key, result: concordance(data, study.word) }), 30);
    return () => clearTimeout(id);
  }, [study, data, key]);
  const result = key && found?.key === key ? found.result : null;
  // Back to the whole Bible each time a new word opens.
  const [shownKey, setShownKey] = useState(key);
  if (shownKey !== key) { setShownKey(key); setPart('all'); }

  const hits = useMemo(() => (result ? result.hits.filter((h) =>
    part === 'all' || (part === 'ot' ? h.book < 39 : part === 'nt' ? h.book >= 39 : h.book === part)) : []), [result, part]);

  // The Hebrew or Greek behind this word in this verse (King James words). Other versions: the verse's KJV words.
  const tags = study && strongs.data ? verseWords(strongs.data, study.book, study.chapter, study.verse) : [];
  const lower = study?.word.toLowerCase() ?? '';
  const match = prefs.translation === 'kjv' ? tags.find(([w]) => (w.toLowerCase().match(/[a-z]+/g) ?? ([] as string[])).includes(lower)) : undefined;
  const original = match && strongs.data ? entry(strongs.data, strongsId(match[1])) : null;

  const ot = result ? result.byBook.slice(0, 39).reduce((a, b) => a + b, 0) : 0;
  const nt = result ? result.byBook.slice(39).reduce((a, b) => a + b, 0) : 0;
  const books = result ? result.byBook.map((n, b) => ({ b, n })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n) : [];

  const full = () => { const w = study!.word; onClose(); router.push({ pathname: '/bible/concordance', params: { word: w } }); };
  const openEntry = (term: string) => { onClose(); router.push({ pathname: '/bible/dictionary', params: { term } }); };
  const openStrongs = (id: string) => { onClose(); router.push({ pathname: '/bible/strongs', params: { id } }); };

  const marked = (text: string) =>
    text.split(WORD_SPLIT).map((p, i) => (i % 2 && p.toLowerCase() === lower ? <Text key={i} style={{ fontWeight: '800', color: t.accent }}>{p}</Text> : p));
  const chip = (label: string, on: boolean, onPress: () => void, k: string) => (
    <Pressable key={k} onPress={onPress} style={[styles.chip, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary : t.background }]}>
      <Text style={{ color: on ? '#FFFFFF' : t.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={!!study} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: t.surface, height: Math.round(height * 0.72), paddingBottom: insets.bottom }]}>
          <View style={[styles.grab, { backgroundColor: t.border }]} />
          <View style={styles.top}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.word, { color: t.text }]}>“{study?.word}”</Text>
              <Text style={{ color: t.textMuted }}>
                {result ? (result.occurrences ? `${result.occurrences} times in ${result.hits.length} verses · ${TRANSLATIONS[prefs.translation].short}` : 'Not found in this version') : 'Searching every verse…'}
              </Text>
            </View>
            <Pressable onPress={full} hitSlop={8} style={[styles.full, { borderColor: t.border }]} accessibilityLabel="Open the full-screen concordance">
              <Ionicons name="expand-outline" size={16} color={t.accent} />
              <Text style={{ color: t.accent, fontWeight: '700', fontSize: 13 }}>Full screen</Text>
            </Pressable>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={t.textMuted} />
            </Pressable>
          </View>

          <FlatList
            data={hits}
            keyExtractor={(h) => `${h.book}.${h.chapter}.${h.verse}`}
            initialNumToRender={8}
            contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: space.lg }}
            ListHeaderComponent={
              <View>
                {meaning && (
                  <Pressable onPress={() => openEntry(meaning.term)} style={({ pressed }) => [styles.orig, { borderColor: t.border, backgroundColor: t.background }, pressed && { opacity: 0.8 }]}>
                    <Text style={{ color: t.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>BIBLE DICTIONARY · {meaning.term.toUpperCase()}</Text>
                    <Text style={{ color: t.text, lineHeight: 21, marginTop: 2 }} numberOfLines={3}>{plain(meaning.body)}</Text>
                    <Text style={{ color: t.accent, fontWeight: '700', marginTop: 4 }}>Read the entry ›</Text>
                  </Pressable>
                )}
                {original ? (
                  <Pressable onPress={() => openStrongs(original.id)} style={({ pressed }) => [styles.orig, { borderColor: t.accent, backgroundColor: t.background }, pressed && { opacity: 0.8 }]}>
                    <Text style={{ color: t.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>{original.language.toUpperCase()} IN THIS VERSE · {original.id}</Text>
                    <Text style={{ color: t.text, fontSize: 18, marginTop: 2 }}>
                      <Text style={{ fontFamily: fonts.serif, fontSize: 22 }}>{original.lemma}</Text>  <Text style={{ fontStyle: 'italic' }}>{original.transliteration}</Text>
                    </Text>
                    <Text style={{ color: t.text, lineHeight: 21, marginTop: 2 }} numberOfLines={3}>{original.definition}</Text>
                    <Text style={{ color: t.accent, fontWeight: '700', marginTop: 4 }}>Meaning and every use ›</Text>
                  </Pressable>
                ) : !strongs.data && strongs.loading && prefs.translation === 'kjv' ? (
                  <Text style={{ color: t.textMuted, marginBottom: space.sm }}>Getting the Hebrew and Greek…</Text>
                ) : prefs.translation !== 'kjv' && tags.length > 0 ? (
                  <View style={{ marginBottom: space.sm }}>
                    <Text style={[styles.label, { color: t.textMuted }]}>HEBREW & GREEK IN THIS VERSE (KJV WORDS)</Text>
                    <View style={styles.wrap}>
                      {tags.map(([w, n], i) => chip(`${w} · ${strongs.data!.dict[strongsId(n)]?.[1] ?? strongsId(n)}`, false, () => openStrongs(strongsId(n)), `${i}`))}
                    </View>
                  </View>
                ) : null}

                {!result && <ActivityIndicator color={t.accent} style={{ marginVertical: space.lg }} />}
                {!!result?.occurrences && (
                  <>
                    <View style={styles.wrap}>
                      {chip(`All ${result.occurrences}`, part === 'all', () => setPart('all'), 'all')}
                      {ot > 0 && chip(`Old Testament ${ot}`, part === 'ot', () => setPart('ot'), 'ot')}
                      {nt > 0 && chip(`New Testament ${nt}`, part === 'nt', () => setPart('nt'), 'nt')}
                    </View>
                    <View style={[styles.wrap, { marginTop: 6, marginBottom: space.sm }]}>
                      {books.slice(0, 12).map(({ b, n }) => chip(`${bookName(b)} ${n}`, part === b, () => setPart(part === b ? 'all' : b), `b${b}`))}
                      {books.length > 12 && chip(`All ${books.length} books ›`, false, full, 'more')}
                    </View>
                  </>
                )}
              </View>
            }
            renderItem={({ item }) => {
              const here = study && item.book === study.book && item.chapter === study.chapter && item.verse === study.verse;
              return (
                <Pressable
                  onPress={() => onGoTo(item.book, item.chapter, item.verse)}
                  style={({ pressed }) => [styles.hit, { borderColor: here ? t.accent : t.border, backgroundColor: t.background }, pressed && { opacity: 0.8 }]}
                >
                  <Text style={{ color: t.accent, fontWeight: '700', marginBottom: 2 }}>{reference(item.book, item.chapter, [item.verse])}{here ? '  · this verse' : ''}</Text>
                  <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 15, lineHeight: 22 }}>{marked(item.text)}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: 'hidden' },
  grab: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: space.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, paddingBottom: space.sm },
  word: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700' },
  full: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  orig: { borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: space.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  hit: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.sm, paddingHorizontal: space.md, marginBottom: space.sm },
});
