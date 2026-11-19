import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RichText } from '@/components/RichText';
import { byLetter, DICTIONARY_CREDIT, lookup, plain, searchDictionary, useDictionary, type DictEntry } from '@/lib/dictionary';
import { Button } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Bible dictionary: search or browse by letter; with `term`, shows that entry. */
export default function BibleDictionary() {
  const { term } = useLocalSearchParams<{ term?: string }>();
  return term ? <Entry term={term} /> : <Browse />;
}

function useData() {
  const dict = useDictionary();
  const t = useTheme();
  const status = dict.error ? (
    <View style={styles.center}>
      <Text style={{ color: t.textMuted, textAlign: 'center', marginBottom: space.md }}>{dict.error}</Text>
      <Button label="Try again" icon="refresh" onPress={dict.retry} />
    </View>
  ) : !dict.data ? (
    <View style={styles.center}>
      <ActivityIndicator color={t.accent} />
      <Text style={{ color: t.textMuted, marginTop: space.sm }}>Downloading the dictionary (once only)…</Text>
    </View>
  ) : null;
  return { data: dict.data, status };
}

function Browse() {
  const t = useTheme();
  const { data, status } = useData();
  const [q, setQ] = useState('');
  const [inside, setInside] = useState(false);
  const [letter, setLetter] = useState('A');
  const list = useMemo(() => (!data ? [] : q.trim() ? searchDictionary(data, q, inside) : byLetter(data, letter)), [data, q, inside, letter]);
  const open = (e: DictEntry) => router.push({ pathname: '/bible/dictionary', params: { term: e.term } });
  const chip = (label: string, on: boolean, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} style={[styles.chip, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary : t.surface }]}>
      <Text style={{ color: on ? '#FFFFFF' : t.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: 'Bible dictionary' }} />
      <View style={{ padding: space.md, paddingBottom: space.sm, gap: space.sm }}>
        <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="search" size={18} color={t.textMuted} />
          <TextInput value={q} onChangeText={setQ} autoCapitalize="none" returnKeyType="search" placeholder="A name, place or word, e.g. Bethel, ephod"
            placeholderTextColor={t.textMuted} style={[styles.input, { color: t.text }]} />
          {!!q && <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="Clear"><Ionicons name="close-circle" size={20} color={t.textMuted} /></Pressable>}
        </View>
        {q.trim() ? (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {chip('Names', !inside, () => setInside(false))}
            {chip('Inside the articles', inside, () => setInside(true))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6 }}>
            {LETTERS.map((l) => chip(l, letter === l, () => setLetter(l)))}
          </ScrollView>
        )}
      </View>
      {status ?? (
        <FlatList
          data={list}
          keyExtractor={(e, i) => `${e.term}${i}`}
          initialNumToRender={15}
          contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: space.xl }}
          ListEmptyComponent={<Text style={{ color: t.textMuted, textAlign: 'center', marginTop: space.lg }}>Nothing found. Try another spelling, or search inside the articles.</Text>}
          ListFooterComponent={<Text style={{ color: t.textMuted, fontSize: 12, marginTop: space.md }}>{DICTIONARY_CREDIT}</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.row, { borderColor: t.border, backgroundColor: t.surface }, pressed && { opacity: 0.8 }]}>
              <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 18, fontWeight: '700' }}>{item.term}</Text>
              <Text style={{ color: t.textMuted, lineHeight: 20 }} numberOfLines={2}>{plain(item.body)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function Entry({ term }: { term: string }) {
  const t = useTheme();
  const { data, status } = useData();
  const found = data ? lookup(data, term) : [];
  const share = (e: DictEntry) => Share.share({ message: `${e.term}\n\n${plain(e.body)}\n\n${DICTIONARY_CREDIT}\nThe AFM HUB` });

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: found[0]?.term ?? 'Bible dictionary' }} />
      {status ?? (
        <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
          <View style={styles.max}>
            {found.length === 0 && <Text style={{ color: t.textMuted }}>“{term}” isn’t in the dictionary.</Text>}
            {found.map((e, n) => (
              <View key={n} style={{ marginBottom: space.lg }}>
                <Text style={[styles.kicker, { color: t.accent }]}>BIBLE DICTIONARY{found.length > 1 ? ` · ${n + 1} OF ${found.length}` : ''}</Text>
                <Text style={[styles.title, { color: t.text }]}>{e.term}</Text>
                <RichText body={e.body} style={[styles.body, { color: t.text }]} />
                <Button label="Share" icon="share-outline" variant="outline" onPress={() => share(e)} style={{ alignSelf: 'flex-start', marginTop: space.sm }} />
              </View>
            ))}
            <Pressable onPress={() => router.push('/bible/dictionary')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="search" size={16} color={t.accent} />
              <Text style={{ color: t.accent, fontWeight: '700' }}>Search the dictionary</Text>
            </Pressable>
            <Text style={{ color: t.textMuted, fontSize: 12, marginTop: space.md }}>{DICTIONARY_CREDIT} Tap a reference to read it, or a name to open its entry.</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, minWidth: 34, alignItems: 'center' },
  row: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, gap: 2 },
  max: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontFamily: fonts.serif, fontSize: 30, fontWeight: '700', marginBottom: space.sm },
  body: { fontSize: 16, lineHeight: 25, marginBottom: space.md },
});
