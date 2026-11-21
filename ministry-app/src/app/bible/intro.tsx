import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BOOKS } from '@/content/bible';
import { BOOK_INTROS } from '@/content/bookIntros';
import { bookName, reference, useBible, useBiblePrefs } from '@/lib/bible';
import { Screen } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** Introduction to a book: author, date, audience, background, purpose, themes, key verse and outline. */
export default function BookIntroduction() {
  const t = useTheme();
  const { book } = useLocalSearchParams<{ book: string }>();
  const b = Math.min(Math.max(Number(book) || 0, 0), BOOKS.length - 1);
  const intro = BOOK_INTROS[b];
  const prefs = useBiblePrefs();
  const { data } = useBible(prefs.translation);
  const keyText = data?.books[b]?.chapters[intro.key[0] - 1]?.[intro.key[1] - 1];
  const read = (chapter: number, verse?: number) => router.push({ pathname: '/bible/read', params: { book: b, chapter, verse: verse ?? '' } });

  const fact = (icon: 'person-outline' | 'calendar-outline' | 'people-outline', label: string, value: string) => (
    <View style={styles.fact}>
      <Ionicons name={icon} size={18} color={t.accent} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: t.textMuted }]}>{label}</Text>
        <Text style={{ color: t.text, lineHeight: 21 }}>{value}</Text>
      </View>
    </View>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: `About ${bookName(b)}` }} />
      <Text style={[styles.kicker, { color: t.accent }]}>{b < 39 ? 'OLD TESTAMENT' : 'NEW TESTAMENT'} · INTRODUCTION</Text>
      <Text style={[styles.title, { color: t.text }]}>{bookName(b)}</Text>

      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        {fact('person-outline', 'WRITTEN BY', intro.author)}
        {fact('calendar-outline', 'WHEN', intro.date)}
        {fact('people-outline', 'WRITTEN TO', intro.audience)}
      </View>

      <Text style={[styles.h2, { color: t.text }]}>Background</Text>
      <Text style={[styles.body, { color: t.text }]}>{intro.background}</Text>

      <Text style={[styles.h2, { color: t.text }]}>Why it was written</Text>
      <Text style={[styles.body, { color: t.text }]}>{intro.purpose}</Text>

      <Text style={[styles.h2, { color: t.text }]}>Main themes</Text>
      <View style={styles.wrap}>
        {intro.themes.map((th) => (
          <View key={th} style={[styles.pill, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Text style={{ color: t.text }}>{th}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.h2, { color: t.text }]}>Key verse</Text>
      <Pressable onPress={() => read(intro.key[0], intro.key[1])} style={({ pressed }) => [styles.key, { borderColor: t.accent, backgroundColor: t.surface }, pressed && { opacity: 0.8 }]}>
        {!!keyText && <Text style={{ color: t.text, fontFamily: fonts.serif, fontSize: 17, lineHeight: 26 }}>“{keyText}”</Text>}
        <Text style={{ color: t.accent, fontWeight: '700', marginTop: 4 }}>{reference(b, intro.key[0], [intro.key[1]])} ›</Text>
      </Pressable>

      <Text style={[styles.h2, { color: t.text }]}>Outline</Text>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, padding: 0 }]}>
        {intro.outline.map(([title, from, to], i) => (
          <Pressable key={title} onPress={() => read(from)}
            style={({ pressed }) => [styles.part, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }, pressed && { backgroundColor: t.surfaceAlt }]}>
            <Text style={{ color: t.text, flex: 1 }}>{title}</Text>
            <Text style={{ color: t.accent, fontWeight: '700' }}>{from === to ? `Ch ${from}` : `Ch ${from}–${to}`}</Text>
            <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => read(1)} style={({ pressed }) => [styles.start, { backgroundColor: t.primary }, pressed && { opacity: 0.85 }]}>
        <Ionicons name="book-outline" size={18} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Start reading {bookName(b)}</Text>
      </Pressable>
      <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 18, marginTop: space.md }}>
        Introductions written for The AFM HUB from the traditional view of each book. Dates are approximate; where scholars differ, it is noted.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontFamily: fonts.serif, fontSize: 32, fontWeight: '700', marginBottom: space.md },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, gap: space.md },
  fact: { flexDirection: 'row', gap: space.sm },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  h2: { fontFamily: fonts.serif, fontSize: 20, fontWeight: '700', marginTop: space.lg, marginBottom: space.sm },
  body: { fontSize: 16, lineHeight: 25 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  key: { borderLeftWidth: 4, borderRadius: radius.sm, padding: space.md },
  part: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md },
  start: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, borderRadius: radius.md, padding: space.md, marginTop: space.lg },
});
