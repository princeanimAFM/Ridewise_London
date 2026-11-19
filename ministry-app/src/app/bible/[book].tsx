import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BOOKS } from '@/content/bible';
import { Screen } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

/** Chapter numbers for one book. */
export default function BookChapters() {
  const t = useTheme();
  const { book } = useLocalSearchParams<{ book: string }>();
  const b = Math.min(Math.max(Number(book) || 0, 0), BOOKS.length - 1);
  const [, name, chapters] = BOOKS[b];

  return (
    <Screen>
      <Stack.Screen options={{ title: name }} />
      <Pressable onPress={() => router.push({ pathname: '/bible/intro', params: { book: b } })}
        style={({ pressed }) => [styles.intro, { backgroundColor: t.surface, borderColor: t.accent }, pressed && { opacity: 0.85 }]}>
        <Ionicons name="information-circle-outline" size={22} color={t.accent} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Introduction to {name}</Text>
          <Text style={{ color: t.textMuted, fontSize: 13 }}>Who wrote it, when, why, the background and an outline</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
      </Pressable>
      <View style={styles.grid}>
        {Array.from({ length: chapters }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => router.push({ pathname: '/bible/read', params: { book: b, chapter: i + 1 } })}
            style={({ pressed }) => [styles.cell, { backgroundColor: t.surface, borderColor: t.border }, pressed && { backgroundColor: t.surfaceAlt }]}
          >
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{i + 1}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  intro: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.md },
  cell: { width: 56, height: 56, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
});
