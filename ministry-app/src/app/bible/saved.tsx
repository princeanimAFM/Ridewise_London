import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HIGHLIGHTS, reference, useBible, useBiblePrefs, useMarks } from '@/lib/bible';
import { Body, Chip, Screen } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** Every highlighted or bookmarked verse, newest first. */
export default function SavedVerses() {
  const t = useTheme();
  const marks = useMarks();
  const prefs = useBiblePrefs();
  const { data } = useBible(prefs.translation);
  const [filter, setFilter] = useState<'all' | 'bookmarks' | 'highlights'>('all');

  const items = Object.entries(marks)
    .filter(([, m]) => (filter === 'bookmarks' ? m.bookmark : filter === 'highlights' ? m.colour : true))
    .sort((a, b) => b[1].at - a[1].at)
    .map(([key, m]) => {
      const [book, chapter, verse] = key.split('.').map(Number);
      return { key, m, book, chapter, verse, text: data?.books[book]?.chapters[chapter - 1]?.[verse - 1] ?? '' };
    });

  return (
    <Screen>
      <View style={styles.row}>
        <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Bookmarks" active={filter === 'bookmarks'} onPress={() => setFilter('bookmarks')} />
        <Chip label="Highlights" active={filter === 'highlights'} onPress={() => setFilter('highlights')} />
      </View>
      {!items.length && <Body muted>Nothing here yet. In the Bible, tap a verse to highlight or bookmark it.</Body>}
      {items.map((it) => (
        <Pressable
          key={it.key}
          onPress={() => router.push({ pathname: '/bible/read', params: { book: it.book, chapter: it.chapter, verse: it.verse } })}
          style={({ pressed }) => [styles.item, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.head}>
            {it.m.colour && <View style={[styles.dot, { backgroundColor: HIGHLIGHTS[it.m.colour].light }]} />}
            <Text style={{ color: t.accent, fontWeight: '700', flex: 1 }}>{reference(it.book, it.chapter, [it.verse])}</Text>
            {it.m.bookmark && <Ionicons name="bookmark" size={16} color={t.accent} />}
          </View>
          {!!it.text && <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 16, lineHeight: 24 }} numberOfLines={4}>{it.text}</Text>}
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  item: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
