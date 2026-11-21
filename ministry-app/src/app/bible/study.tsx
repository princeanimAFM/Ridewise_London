import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useBible, useBiblePrefs } from '@/lib/bible';
import { loadStudy, passageLabel, type Study } from '@/lib/studies';
import { shareText } from '@/lib/links';
import { Button, Screen } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** One Bible study: the passage (in the version being read) and the study itself. */
export default function StudyScreen() {
  const t = useTheme();
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  const { profile } = useAuth();
  const [study, setStudy] = useState<Study | null | undefined>(undefined);
  const prefs = useBiblePrefs();
  const { data } = useBible(prefs.translation);
  useEffect(() => {
    let live = true;
    loadStudy(id).then((s) => live && setStudy(s));
    return () => {
      live = false;
    };
  }, [id]);

  if (study === undefined) return <Screen><ActivityIndicator color={t.accent} style={{ marginTop: space.xl }} /></Screen>;
  if (!study) return <Screen><Text style={{ color: t.text }}>This study is no longer available.</Text></Screen>;

  const verses = data?.books[study.book]?.chapters[study.chapter - 1] ?? [];
  const from = study.verse_from ?? 0, to = study.verse_to ?? study.verse_from ?? 0;
  const passage = study.verse_from ? verses.slice(from - 1, to).map((v, i) => [from + i, v] as const) : [];

  return (
    <Screen>
      <Stack.Screen options={{ title: passageLabel(study) }} />
      <Text style={[styles.kicker, { color: t.accent }]}>BIBLE STUDY · {passageLabel(study).toUpperCase()}</Text>
      <Text style={[styles.title, { color: t.text }]}>{study.title}</Text>
      {!!study.author && <Text style={{ color: t.textMuted, marginBottom: space.md }}>{study.author}</Text>}

      {passage.length > 0 && (
        <Pressable onPress={() => router.push({ pathname: '/bible/read', params: { book: study.book, chapter: study.chapter, verse: from } })}
          style={({ pressed }) => [styles.passage, { borderColor: t.accent, backgroundColor: t.surface }, pressed && { opacity: 0.85 }]}>
          {passage.map(([n, v]) => (
            <Text key={n} style={{ color: t.text, fontFamily: fonts.serif, fontSize: 16, lineHeight: 25 }}>
              <Text style={{ color: t.accent, fontSize: 12 }}>{n} </Text>{v}
            </Text>
          ))}
          <Text style={{ color: t.accent, fontWeight: '700', marginTop: 4 }}>Read {passageLabel(study)} in context ›</Text>
        </Pressable>
      )}

      {study.body.split(/\n{2,}/).map((para, i) => (
        <Text key={i} style={{ color: t.text, fontSize: 17, lineHeight: 27, marginBottom: space.md }}>{para.trim()}</Text>
      ))}

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
        <Button label="Share" icon="share-social-outline" variant="outline" style={{ flex: 1 }}
          onPress={() => shareText(`${study.title}\n${passageLabel(study)}${study.author ? ` · ${study.author}` : ''}\n\n${study.body}`)} />
        {!passage.length && (
          <Button label={`Read ${passageLabel(study)}`} icon="book-outline" style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/bible/read', params: { book: study.book, chapter: study.chapter } })} />
        )}
      </View>
      {profile?.is_admin && (
        <Button label="Edit this study" icon="create-outline" variant="outline" onPress={() => router.push({ pathname: '/manage-studies', params: { id: study.id } })} style={{ marginTop: space.sm }} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', marginTop: 4, marginBottom: 2 },
  passage: { borderLeftWidth: 4, borderRadius: radius.sm, padding: space.md, marginBottom: space.lg, gap: 2 },
});
