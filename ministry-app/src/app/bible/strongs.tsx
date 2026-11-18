import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { bookName, reference, useBible } from '@/lib/bible';
import { entry, STRONGS_CREDIT, STRONGS_SIZE, usage, useStrongs } from '@/lib/strongs';
import { Button } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

type Part = 'all' | number;

/**
 * One Hebrew or Greek word (a Strong's number): the original word, how to say it, what it means, how the
 * King James Version translates it, and every verse where it is used.
 */
export default function StrongsWord() {
  const t = useTheme();
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  const { data, error, loading, retry } = useStrongs();
  const kjv = useBible('kjv');
  const [part, setPart] = useState<Part>('all');
  const e = data ? entry(data, id) : null;
  const use = useMemo(() => (data && e ? usage(data, id) : null), [data, e, id]);
  const verses = use ? use.verses.filter((v) => part === 'all' || v.book === part) : [];

  // Strong's own cross-references ("from H2616") open that word.
  const linked = (text: string) =>
    text.split(/([HG]\d+)/).map((p, i) =>
      i % 2 ? <Text key={i} onPress={() => router.push({ pathname: '/bible/strongs', params: { id: p } })} style={{ color: t.accent, fontWeight: '700' }}>{p}</Text> : p,
    );

  // The verse with the translated word(s) in bold.
  const marked = (text: string, words: string[]) => {
    const targets = words.map((w) => w.toLowerCase());
    const re = new RegExp(`(${targets.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
    return text.split(re).map((p, i) => (i % 2 ? <Text key={i} style={{ fontWeight: '800', color: t.accent }}>{p}</Text> : p));
  };

  if (loading || error || !data) {
    return (
      <View style={[styles.center, { backgroundColor: t.background }]}>
        <Stack.Screen options={{ title: id || 'Hebrew & Greek' }} />
        {error ? (
          <>
            <Text style={{ color: t.text, textAlign: 'center' }}>{error}</Text>
            <Button label="Try again" icon="refresh" onPress={retry} style={{ marginTop: space.md }} />
          </>
        ) : (
          <>
            <ActivityIndicator color={t.accent} />
            <Text style={{ color: t.textMuted, marginTop: space.sm, textAlign: 'center' }}>Getting the Hebrew and Greek words ({STRONGS_SIZE})…</Text>
          </>
        )}
      </View>
    );
  }
  if (!e || !use) {
    return (
      <View style={[styles.center, { backgroundColor: t.background }]}>
        <Text style={{ color: t.text }}>No entry for {id}.</Text>
      </View>
    );
  }

  const header = (
    <View style={{ marginBottom: space.md }}>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.kicker, { color: t.accent }]}>{e.language.toUpperCase()} · {e.id}</Text>
        <Text style={[styles.lemma, { color: t.text }]}>{e.lemma}</Text>
        <Text style={{ color: t.text, fontSize: 18, fontStyle: 'italic' }}>{e.transliteration}</Text>
        {!!e.pronunciation && <Text style={{ color: t.textMuted, marginTop: 2 }}>Say it: {e.pronunciation}</Text>}
        <Text style={[styles.label, { color: t.textMuted }]}>MEANING</Text>
        <Text style={{ color: t.text, fontSize: 16, lineHeight: 24 }}>{linked(e.definition)}</Text>
        {!!e.derivation && <Text style={{ color: t.textMuted, marginTop: space.sm, lineHeight: 21 }}>Comes {linked(e.derivation)}</Text>}
      </View>

      <Text style={[styles.label, { color: t.textMuted }]}>IN THE KING JAMES VERSION</Text>
      <Text style={{ color: t.text }}>
        Used <Text style={{ fontWeight: '800' }}>{use.occurrences}</Text> time{use.occurrences === 1 ? '' : 's'} in {use.verses.length} verse{use.verses.length === 1 ? '' : 's'}. Translated as:
      </Text>
      <View style={styles.wrap}>
        {use.renderings.slice(0, 24).map((r) => (
          <View key={r.word} style={[styles.pill, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Text style={{ color: t.text }}>{r.word} <Text style={{ color: t.accent, fontWeight: '800' }}>{r.count}</Text></Text>
          </View>
        ))}
      </View>

      <Text style={[styles.label, { color: t.textMuted }]}>WHERE IT APPEARS</Text>
      <View style={styles.wrap}>
        <Pressable onPress={() => setPart('all')} style={[styles.pill, { borderColor: part === 'all' ? t.primary : t.border, backgroundColor: part === 'all' ? t.primary : t.surface }]}>
          <Text style={{ color: part === 'all' ? '#FFFFFF' : t.text, fontWeight: '600' }}>All {use.occurrences}</Text>
        </Pressable>
        {use.byBook.map((n, b) => n > 0 && (
          <Pressable key={b} onPress={() => setPart(part === b ? 'all' : b)} style={[styles.pill, { borderColor: part === b ? t.primary : t.border, backgroundColor: part === b ? t.primary : t.surface }]}>
            <Text style={{ color: part === b ? '#FFFFFF' : t.text }}>{bookName(b, 'kjv')} <Text style={{ color: part === b ? '#FFFFFF' : t.accent, fontWeight: '800' }}>{n}</Text></Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: `${e.transliteration || e.id}` }} />
      <FlatList
        data={verses}
        keyExtractor={(v) => `${v.book}.${v.chapter}.${v.verse}`}
        contentContainerStyle={{ padding: space.md }}
        ListHeaderComponent={header}
        initialNumToRender={12}
        ListFooterComponent={<Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 18, marginTop: space.md }}>{STRONGS_CREDIT}</Text>}
        renderItem={({ item }) => {
          const text = kjv.data?.books[item.book]?.chapters[item.chapter - 1]?.[item.verse - 1] ?? '';
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/bible/read', params: { book: item.book, chapter: item.chapter, verse: item.verse } })}
              style={({ pressed }) => [styles.hit, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.8 }]}
            >
              <Text style={{ color: t.accent, fontWeight: '700', marginBottom: 4 }}>
                {reference(item.book, item.chapter, [item.verse])}  <Text style={{ color: t.textMuted, fontWeight: '400' }}>· {item.words.join(', ')}</Text>
              </Text>
              {!!text && <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 16, lineHeight: 24 }}>{marked(text, item.words)}</Text>}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  lemma: { fontSize: 40, marginTop: space.xs, fontFamily: fonts.serif },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: space.md, marginBottom: space.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  hit: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
});
