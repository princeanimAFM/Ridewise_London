import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { bookName, concordance, reference, TRANSLATIONS, useBible, useBiblePrefs, wordsOf, type Concordance } from '@/lib/bible';
import { Button } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

type Part = 'all' | 'ot' | 'nt' | number;

/**
 * Concordance: every place a word appears in the chosen version, how many times, and where
 * (Old and New Testament, and book by book). "Starts with" also finds other forms (love → loved, loveth).
 */
export default function BibleConcordance() {
  const t = useTheme();
  const params = useLocalSearchParams<{ word?: string }>();
  const [input, setInput] = useState(params.word ?? '');
  const [word, setWord] = useState(params.word ?? '');
  const [startsWith, setStartsWith] = useState(false);
  const [part, setPart] = useState<Part>('all');
  const [form, setForm] = useState<string | null>(null);
  const prefs = useBiblePrefs();
  const { data, error, loading, retry } = useBible(prefs.translation);
  const [found, setFound] = useState<{ key: string; result: Concordance } | null>(null);
  const key = data && word.trim() ? `${prefs.translation}|${word.trim()}|${startsWith}` : null;

  // The first look-up builds the word list for the version (about a second on a phone), so it runs after the
  // screen has drawn and shows a spinner meanwhile.
  useEffect(() => {
    if (!data || !key) return;
    const id = setTimeout(() => setFound({ key, result: concordance(data, word, startsWith) }), 30);
    return () => clearTimeout(id);
  }, [data, key, word, startsWith]);
  const result = key && found?.key === key ? found.result : null;
  const working = !!key && !result;

  const submit = () => { setWord(input.trim()); setPart('all'); setForm(null); };

  const hits = useMemo(() => {
    if (!result) return [];
    return result.hits.filter((h) => {
      if (part === 'ot' && h.book >= 39) return false;
      if (part === 'nt' && h.book < 39) return false;
      if (typeof part === 'number' && h.book !== part) return false;
      if (form && !wordsOf(h.text).some((w) => w.toLowerCase() === form)) return false;
      return true;
    });
  }, [result, part, form]);

  const ot = result ? result.byBook.slice(0, 39).reduce((a, b) => a + b, 0) : 0;
  const nt = result ? result.byBook.slice(39).reduce((a, b) => a + b, 0) : 0;
  const books = result ? result.byBook.map((n, b) => ({ b, n })).filter((x) => x.n > 0) : [];

  // Bold the word (or its forms) inside each verse.
  const marked = (text: string) => {
    if (!result) return text;
    const target = form ?? result.word;
    return text.split(/([A-Za-zÀ-ɏɐ-ʯḀ-ỿ̀-ͯ]+)/).map((part, i) => {
      const fold = (s: string) => (s.normalize ? s.normalize('NFD') : s).replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ɛ/g, 'e').replace(/ɔ/g, 'o');
      const hit = i % 2 === 1 && (startsWith && !form ? fold(part).startsWith(fold(target)) : fold(part) === fold(target));
      return hit ? <Text key={i} style={{ fontWeight: '800', color: t.accent }}>{part}</Text> : part;
    });
  };

  const chip = (label: string, on: boolean, onPress: () => void, key?: string) => (
    <Pressable key={key ?? label} onPress={onPress} style={[styles.chip, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary : t.surface }]}>
      <Text style={{ color: on ? '#FFFFFF' : t.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );

  const header = result && (
    <View style={{ marginBottom: space.sm }}>
      <Text style={[styles.title, { color: t.text }]}>
        {result.occurrences ? `“${result.word}”${startsWith ? ' and its forms' : ''}` : `No verses with “${word}”`}
      </Text>
      {!!result.occurrences && (
        <Text style={{ color: t.textMuted, marginTop: 2 }}>
          {result.occurrences} time{result.occurrences === 1 ? '' : 's'} in {result.hits.length} verse{result.hits.length === 1 ? '' : 's'} · {TRANSLATIONS[prefs.translation].short}
        </Text>
      )}
      {!result.occurrences && !startsWith && (
        <Button label={`Try words starting with “${word}”`} variant="outline" icon="search" onPress={() => setStartsWith(true)} style={{ marginTop: space.sm, alignSelf: 'flex-start' }} />
      )}
      {!!result.occurrences && (
        <>
          {startsWith && result.forms.length > 1 && (
            <>
              <Text style={[styles.label, { color: t.textMuted }]}>FORMS OF THE WORD</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {chip('All forms', !form, () => setForm(null))}
                {result.forms.map((f) => chip(`${f.word} ${f.count}`, form === f.word, () => setForm(form === f.word ? null : f.word), f.word))}
              </ScrollView>
            </>
          )}
          <Text style={[styles.label, { color: t.textMuted }]}>WHERE IT APPEARS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {chip(`Whole Bible ${result.occurrences}`, part === 'all', () => setPart('all'))}
            {ot > 0 && chip(`Old Testament ${ot}`, part === 'ot', () => setPart('ot'))}
            {nt > 0 && chip(`New Testament ${nt}`, part === 'nt', () => setPart('nt'))}
          </ScrollView>
          <View style={styles.bookGrid}>
            {books.map(({ b, n }) => (
              <Pressable key={b} onPress={() => setPart(part === b ? 'all' : b)}
                style={[styles.book, { borderColor: part === b ? t.primary : t.border, backgroundColor: part === b ? t.primary : t.surface }]}>
                <Text numberOfLines={1} style={{ color: part === b ? '#FFFFFF' : t.text, fontSize: 13, flexShrink: 1 }}>{bookName(b)}</Text>
                <Text style={{ color: part === b ? '#FFFFFF' : t.accent, fontWeight: '800', fontSize: 13 }}>{n}</Text>
              </Pressable>
            ))}
          </View>
          {hits.length !== result.hits.length && (
            <Text style={{ color: t.textMuted, marginTop: space.sm }}>Showing {hits.length} verse{hits.length === 1 ? '' : 's'}</Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ padding: space.md, paddingBottom: 0 }}>
        <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="library-outline" size={18} color={t.textMuted} />
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={submit}
            returnKeyType="search"
            autoFocus={!params.word}
            autoCapitalize="none"
            placeholder="A word, e.g. grace, faith, covenant"
            placeholderTextColor={t.textMuted}
            style={[styles.input, { color: t.text }]}
          />
          {!!input && (
            <Pressable onPress={submit} hitSlop={8} accessibilityLabel="Look up">
              <Ionicons name="arrow-forward-circle" size={26} color={t.accent} />
            </Pressable>
          )}
        </View>
        <View style={[styles.chips, { paddingTop: space.sm }]}>
          {chip('Exact word', !startsWith, () => { setStartsWith(false); setForm(null); })}
          {chip('Starts with', startsWith, () => { setStartsWith(true); setForm(null); })}
        </View>
      </View>

      {(loading || working) && (
        <View style={styles.center}>
          <ActivityIndicator color={t.accent} />
          <Text style={{ color: t.textMuted, marginTop: space.sm, textAlign: 'center' }}>{loading ? 'Downloading the Bible (once only)…' : 'Searching every verse…'}</Text>
        </View>
      )}
      {!!error && (
        <View style={styles.center}>
          <Text style={{ color: t.text, textAlign: 'center' }}>{error}</Text>
          <Button label="Try again" icon="refresh" onPress={retry} style={{ marginTop: space.md }} />
        </View>
      )}
      {!word && !loading && (
        <Text style={{ color: t.textMuted, padding: space.md, lineHeight: 21 }}>
          Type a word to see every verse it appears in, how many times, and in which books. Use “Starts with” to include other forms, such as love, loved, loveth and lovely.
        </Text>
      )}

      {result && !working && (
        <FlatList
          data={hits}
          keyExtractor={(h) => `${h.book}.${h.chapter}.${h.verse}`}
          contentContainerStyle={{ padding: space.md }}
          ListHeaderComponent={header || undefined}
          initialNumToRender={15}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/bible/read', params: { book: item.book, chapter: item.chapter, verse: item.verse } })}
              style={({ pressed }) => [styles.hit, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.8 }]}
            >
              <Text style={{ color: t.accent, fontWeight: '700', marginBottom: 4 }}>
                {reference(item.book, item.chapter, [item.verse])}{item.times > 1 ? `  ·  ${item.times} times` : ''}
              </Text>
              <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 16, lineHeight: 24 }}>{marked(item.text)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  chips: { flexDirection: 'row', gap: space.sm },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: space.md, marginBottom: space.xs },
  title: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700' },
  bookGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.sm },
  book: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6, maxWidth: '48%' },
  center: { alignItems: 'center', padding: space.lg },
  hit: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
});
