import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PhotoHero } from '@/components/PhotoHero';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useContent } from '@/lib/liveContent';
import { quoteOfTheDay } from '@/lib/content';
import { QuoteCard } from '@/components/QuoteCard';
import { Body, Screen, SectionHeader } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

export default function Quotes() {
  const ministry = useContent();
  const t = useTheme();
  const today = quoteOfTheDay();
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ministry.quotes.filter((x) => x.id !== today.id && (!q || x.text.toLowerCase().includes(q)));
  }, [query, today.id, ministry.quotes]);

  return (
    <Screen>
      <PhotoHero source={ministry.photos.quotes} height={260} position="top" style={styles.hero}>
        <Text style={[styles.kicker, { color: t.gold }]}>WORDS OF WISDOM</Text>
        <Text style={styles.title}>Quotes by AFM</Text>
        <Text style={styles.sub}>{ministry.quotes.length} quotes · tap Share to pass one on</Text>
      </PhotoHero>
      {!query && <QuoteCard quote={today} featured />}
      <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Ionicons name="search-outline" size={20} color={t.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${ministry.quotes.length} quotes…`}
          placeholderTextColor={t.textMuted}
          style={[styles.input, { color: t.text }]}
          clearButtonMode="while-editing"
        />
      </View>
      <SectionHeader title={query ? `${results.length} found` : 'All Quotes'} />
      {results.map((q) => (
        <QuoteCard key={q.id} quote={q} />
      ))}
      {results.length === 0 && <Body muted style={{ textAlign: 'center' }}>No quotes match your search.</Body>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, marginBottom: space.md },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 26, fontWeight: '700', marginTop: 2 },
  sub: { color: '#DCE8DC', marginTop: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, paddingVertical: 12, fontSize: 16 },
});
