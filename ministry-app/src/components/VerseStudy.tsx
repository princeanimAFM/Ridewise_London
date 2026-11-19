import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reference, useBible, useBiblePrefs, wordsOf } from '@/lib/bible';
import { CROSSREFS_CREDIT, refsFor, useCrossrefs, type CrossRef } from '@/lib/crossrefs';
import { strongsId, useStrongs, verseWords } from '@/lib/strongs';
import { Button } from './ui';
import { covers, useStudies } from '@/lib/studies';
import { fonts, radius, space, useTheme } from '@/theme';

export type StudyTab = 'refs' | 'studies' | 'original' | 'words';

/**
 * Study tools for the selected verses, in a sheet over the chapter: cross-references, the Hebrew and Greek
 * words, and the concordance for each word.
 */
export function VerseStudy({ book, chapter, verses, onClose, onGoTo }: {
  book: number;
  chapter: number;
  /** The selected verse numbers, or null when closed. */
  verses: number[] | null;
  onClose: () => void;
  onGoTo: (book: number, chapter: number, verse: number) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const prefs = useBiblePrefs();
  const [tab, setTab] = useState<StudyTab>('refs');
  const open = !!verses;
  const bible = useBible(prefs.translation);
  const crossrefs = useCrossrefs(open && tab === 'refs');
  const strongs = useStrongs(open && tab === 'original');
  const studies = useStudies({ book, chapter });
  const theseStudies = studies.items.filter((s) => covers(s, verses ?? []));

  const text = (b: number, c: number, v: number) => bible.data?.books[b]?.chapters[c - 1]?.[v - 1] ?? '';
  const refText = (r: CrossRef) => {
    if (r.toChapter) return `${text(r.book, r.chapter, r.verse)} …`;
    const last = r.toVerse ?? r.verse;
    const parts: string[] = [];
    for (let v = r.verse; v <= last && parts.length < 4; v++) parts.push(text(r.book, r.chapter, v));
    return parts.join(' ') + (last - r.verse >= 4 ? ' …' : '');
  };
  const refLabel = (r: CrossRef) =>
    r.toChapter ? `${reference(r.book, r.chapter, [r.verse])}–${r.toChapter}:${r.toVerse}` : reference(r.book, r.chapter, r.toVerse ? [r.verse, r.toVerse] : [r.verse]);

  const words = (() => {
    const seen = new Set<string>();
    return (verses ?? []).flatMap((v) => wordsOf(text(book, chapter, v))).filter((w) => {
      const k = w.toLowerCase();
      if (w.length < 2 || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  })();

  const go = (fn: () => void) => { onClose(); fn(); };
  const loading = (what: string) => (
    <View style={styles.row}>
      <ActivityIndicator color={t.accent} />
      <Text style={{ color: t.textMuted, flex: 1 }}>Getting the {what} (once; then it works offline)…</Text>
    </View>
  );
  const tabs: [StudyTab, string][] = [['refs', 'Cross-references'], ...(theseStudies.length ? [['studies', `Studies (${theseStudies.length})`] as [StudyTab, string]] : []), ['original', 'Hebrew & Greek'], ['words', 'Concordance']];

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: t.surface, maxHeight: Math.round(height * 0.78), paddingBottom: insets.bottom + space.sm }]}>
          <View style={[styles.grab, { backgroundColor: t.border }]} />
          <Text style={[styles.title, { color: t.text }]}>Study {verses ? reference(book, chapter, verses) : ''}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={styles.tabs}>
            {tabs.map(([k, label]) => (
              <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, { borderColor: tab === k ? t.primary : t.border, backgroundColor: tab === k ? t.primary : t.background }]}>
                <Text style={{ color: tab === k ? '#FFFFFF' : t.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: space.md, gap: space.sm }}>
            {tab === 'refs' && (
              crossrefs.data ? (() => {
                const list = (verses ?? []).flatMap((v) => refsFor(crossrefs.data!, book, chapter, v).map((r) => ({ from: v, r })));
                if (!list.length) return <Text style={{ color: t.textMuted }}>No cross-references for {verses && verses.length > 1 ? 'these verses' : 'this verse'}.</Text>;
                return (
                  <>
                    <Text style={{ color: t.textMuted }}>Other verses on the same subject, most helpful first. Tap one to read it.</Text>
                    {list.map(({ from, r }, i) => (
                      <Pressable key={`${from}.${i}`} onPress={() => onGoTo(r.book, r.chapter, r.verse)}
                        style={({ pressed }) => [styles.card, { borderColor: t.border, backgroundColor: t.background }, pressed && { opacity: 0.8 }]}>
                        <Text style={{ color: t.accent, fontWeight: '700' }}>
                          {refLabel(r)}{verses && verses.length > 1 ? <Text style={{ color: t.textMuted, fontWeight: '400' }}>  · from verse {from}</Text> : null}
                        </Text>
                        <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 15, lineHeight: 22, marginTop: 2 }} numberOfLines={4}>{refText(r)}</Text>
                      </Pressable>
                    ))}
                    <Text style={{ color: t.textMuted, fontSize: 12 }}>{CROSSREFS_CREDIT}</Text>
                  </>
                );
              })() : crossrefs.error ? (
                <Button label="Try again" icon="refresh" variant="outline" onPress={crossrefs.retry} style={{ alignSelf: 'flex-start' }} />
              ) : loading('cross-references, about 1 MB')
            )}

            {tab === 'studies' && theseStudies.map((s) => (
              <Pressable key={s.id} onPress={() => go(() => router.push({ pathname: '/bible/study', params: { id: s.id } }))}
                style={({ pressed }) => [styles.card, { borderColor: t.accent, backgroundColor: t.background }, pressed && { opacity: 0.8 }]}>
                <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 17, fontWeight: '700' }}>{s.title}</Text>
                {!!s.author && <Text style={{ color: t.textMuted, fontSize: 13 }}>{s.author}</Text>}
                <Text style={{ color: t.text, marginTop: 4, lineHeight: 21 }} numberOfLines={3}>{s.body}</Text>
              </Pressable>
            ))}

            {tab === 'original' && (
              strongs.data ? (
                <>
                  <Text style={{ color: t.textMuted }}>Tap a word for the original Hebrew or Greek, its meaning and everywhere it is used{prefs.translation === 'kjv' ? '' : ' (King James words)'}.</Text>
                  <View style={styles.wrap}>
                    {(verses ?? []).flatMap((v) => verseWords(strongs.data!, book, chapter, v).map(([w, n], i) => ({ w, n, key: `${v}.${i}` }))).map(({ w, n, key }) => {
                      const id = strongsId(n), e = strongs.data!.dict[id];
                      return (
                        <Pressable key={key} onPress={() => go(() => router.push({ pathname: '/bible/strongs', params: { id } }))}
                          style={({ pressed }) => [styles.word, { borderColor: t.accent, backgroundColor: t.background }, pressed && { opacity: 0.7 }]}>
                          <Text style={{ color: t.text, fontWeight: '700' }}>{w}</Text>
                          <Text style={{ color: t.textMuted, fontSize: 12 }}>{e ? `${e[1]} · ${id}` : id}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : strongs.error ? (
                <Button label="Try again" icon="refresh" variant="outline" onPress={strongs.retry} style={{ alignSelf: 'flex-start' }} />
              ) : loading('Hebrew and Greek words, 2 MB')
            )}

            {tab === 'words' && (
              <>
                <Text style={{ color: t.textMuted }}>Tap a word to see every verse it appears in, and how many times.</Text>
                <View style={styles.wrap}>
                  {words.map((w) => (
                    <Pressable key={w} onPress={() => go(() => router.push({ pathname: '/bible/concordance', params: { word: w } }))}
                      style={({ pressed }) => [styles.pill, { borderColor: t.border, backgroundColor: t.background }, pressed && { opacity: 0.7 }]}>
                      <Text style={{ color: t.text, fontWeight: '600' }}>{w}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: 'hidden' },
  grab: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: space.sm },
  title: { fontFamily: fonts.serif, fontSize: 20, fontWeight: '700', paddingHorizontal: space.md, paddingTop: space.sm },
  tabs: { gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm },
  tab: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.sm, paddingHorizontal: space.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  word: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
});
