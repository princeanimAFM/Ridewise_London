import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BOOKS } from '@/content/bible';
import { bookName, reference } from '@/lib/bible';
import { chapterCommentary, COMMENTARY_CREDIT, sectionLabel, useCommentary } from '@/lib/commentary';
import { RichText } from '@/components/RichText';
import { Button, Screen } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** Matthew Henry's commentary on one chapter: its outline, then each part. */
export default function Commentary() {
  const t = useTheme();
  const params = useLocalSearchParams<{ book: string; chapter: string }>();
  const book = Math.min(Math.max(Number(params.book) || 0, 0), BOOKS.length - 1);
  const chapter = Math.max(Number(params.chapter) || 1, 1);
  const count = BOOKS[book][2];
  const c = useCommentary();
  const data = c.data ? chapterCommentary(c.data, book, chapter) : null;
  const read = (verse?: number) => router.push({ pathname: '/bible/read', params: { book, chapter, verse: verse ?? '' } });
  const go = (ch: number) => router.replace({ pathname: '/bible/commentary', params: { book, chapter: ch } });

  return (
    <Screen>
      <Stack.Screen options={{ title: `Commentary · ${reference(book, chapter)}` }} />
      <Text style={[styles.kicker, { color: t.accent }]}>COMMENTARY</Text>
      <Text style={[styles.title, { color: t.text }]}>{reference(book, chapter)}</Text>

      {c.error ? (
        <View style={{ gap: space.sm }}>
          <Text style={{ color: t.textMuted }}>{c.error}</Text>
          <Button label="Try again" icon="refresh" onPress={c.retry} style={{ alignSelf: 'flex-start' }} />
        </View>
      ) : !data ? (
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <ActivityIndicator color={t.accent} />
          <Text style={{ color: t.textMuted }}>Downloading the commentary (once only; then it works offline)…</Text>
        </View>
      ) : (
        <>
          {data.outline.length > 0 && (
            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.label, { color: t.textMuted }]}>IN THIS CHAPTER</Text>
              {data.outline.map((o, i) => (
                <Pressable key={i} onPress={() => read(o.from)} style={styles.part}>
                  <Text style={{ color: t.text, flex: 1, lineHeight: 21 }}>{o.title}</Text>
                  <Text style={{ color: t.accent, fontWeight: '700' }}>{o.from === o.to ? `v${o.from}` : `v${o.from}–${o.to}`}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {data.sections.map((s, i) => (
            <View key={i} style={{ marginTop: space.lg }}>
              <Pressable onPress={() => read(s.from)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space.sm }}>
                <Text style={[styles.h2, { color: t.text }]}>{sectionLabel(s)}</Text>
                <Ionicons name="book-outline" size={16} color={t.accent} />
              </Pressable>
              <RichText body={s.text} style={[styles.body, { color: t.text }]} />
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
            {chapter > 1 && <Button label={`${bookName(book)} ${chapter - 1}`} icon="chevron-back" variant="outline" onPress={() => go(chapter - 1)} style={{ flex: 1 }} />}
            {chapter < count && <Button label={`${bookName(book)} ${chapter + 1}`} icon="chevron-forward" variant="outline" onPress={() => go(chapter + 1)} style={{ flex: 1 }} />}
          </View>
          <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 18, marginTop: space.md }}>{COMMENTARY_CREDIT} Tap a heading to read those verses.</Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontFamily: fonts.serif, fontSize: 30, fontWeight: '700', marginBottom: space.md },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, gap: space.sm },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  part: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  h2: { fontFamily: fonts.serif, fontSize: 20, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 25, marginBottom: space.md },
});
