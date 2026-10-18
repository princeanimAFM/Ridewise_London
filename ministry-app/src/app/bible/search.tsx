import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { parseReference, reference, searchBible, TRANSLATIONS, useBible, useBiblePrefs } from '@/lib/bible';
import { Button } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** Word search across the whole Bible in the chosen translation. */
export default function BibleSearch() {
  const t = useTheme();
  const params = useLocalSearchParams<{ q?: string }>();
  const [input, setInput] = useState(params.q ?? '');
  const [query, setQuery] = useState(params.q ?? '');
  const prefs = useBiblePrefs();
  const { data, error, loading, retry } = useBible(prefs.translation);
  // A reference like "John 3:16" or "Yohane 3:16" opens the verse instead of searching.
  // Waits for the version to load so book names in its own language are known.
  const ref = useMemo(() => (data ? parseReference(query) : null), [data, query]);
  useEffect(() => {
    if (ref) router.replace({ pathname: '/bible/read', params: { book: ref.book, chapter: ref.chapter, verse: ref.verse ?? '' } });
  }, [ref]);
  const result = useMemo(() => (data && !ref ? searchBible(data, query) : null), [data, query, ref]);
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);

  const submit = () => {
    const q = input.trim();
    setQuery(q);
  };

  // Bold the searched words inside each verse.
  const marked = (text: string) => {
    if (!words.length) return text;
    const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
    return text.split(re).map((part, i) =>
      i % 2 ? <Text key={i} style={{ fontWeight: '800', color: t.accent }}>{part}</Text> : part,
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Ionicons name="search" size={18} color={t.textMuted} />
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={submit}
          returnKeyType="search"
          autoFocus={!params.q}
          placeholder="Search a word, or go to John 3:16"
          placeholderTextColor={t.textMuted}
          style={[styles.input, { color: t.text }]}
        />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={t.accent} />
          <Text style={{ color: t.textMuted, marginTop: space.sm, textAlign: 'center' }}>Downloading the Bible (once only)…</Text>
        </View>
      )}
      {!!error && (
        <View style={styles.center}>
          <Text style={{ color: t.text, textAlign: 'center' }}>{error}</Text>
          <Button label="Try again" icon="refresh" onPress={retry} style={{ marginTop: space.md }} />
        </View>
      )}

      {result && (
        <FlatList
          data={result.hits}
          keyExtractor={(h) => `${h.book}.${h.chapter}.${h.verse}`}
          contentContainerStyle={{ padding: space.md, paddingTop: 0 }}
          ListHeaderComponent={
            query ? (
              <Text style={{ color: t.textMuted, marginBottom: space.sm }}>
                {result.hits.length ? `${result.more ? 'First ' : ''}${result.hits.length} verse${result.hits.length === 1 ? '' : 's'} in the ${TRANSLATIONS[prefs.translation].short}` : `No verses found for “${query}”.`}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/bible/read', params: { book: item.book, chapter: item.chapter, verse: item.verse } })}
              style={({ pressed }) => [styles.hit, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.8 }]}
            >
              <Text style={{ color: t.accent, fontWeight: '700', marginBottom: 4 }}>{reference(item.book, item.chapter, [item.verse])}</Text>
              <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 16, lineHeight: 24 }}>{marked(item.text)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md, margin: space.md },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  center: { alignItems: 'center', padding: space.lg },
  hit: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
});
