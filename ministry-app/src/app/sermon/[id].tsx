import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ministry } from '@/content/ministry';
import { formatDate, openLink, shareText, youtubeUrl } from '@/lib/links';
import { sermonImage } from '@/components/SermonCard';
import { Artwork, Body, Button, Screen, Title } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

export default function SermonDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sermon = ministry.sermons.find((s) => s.id === id);
  if (!sermon) return <Screen><Body>Sermon not found.</Body></Screen>;

  const watchUrl = sermon.youtubeId ? youtubeUrl(sermon.youtubeId) : undefined;
  const share = () =>
    shareText(`${sermon.title} — ${ministry.minister}${watchUrl ? `\n${watchUrl}` : ''}\n\n${ministry.name}`);

  return (
    <Screen>
      <Stack.Screen options={{ title: sermon.series ?? 'Sermon' }} />
      <Artwork uri={sermonImage(sermon)} icon="play-circle" label={sermon.title} style={styles.hero} />
      <Text style={[styles.meta, { color: t.accent }]}>{formatDate(sermon.date)}</Text>
      <Title>{sermon.title}</Title>
      {sermon.scripture && <Text style={[styles.scripture, { color: t.textMuted }]}>{sermon.scripture}</Text>}
      <Body>{sermon.summary}</Body>

      <View style={styles.actions}>
        <Button label="Watch" icon="logo-youtube" onPress={() => openLink(watchUrl)} style={styles.flex} />
        {sermon.audioUrl && <Button label="Listen" icon="headset-outline" variant="gold" onPress={() => openLink(sermon.audioUrl)} style={styles.flex} />}
      </View>
      <Button label="Share this sermon" icon="share-social-outline" variant="outline" onPress={share} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, marginBottom: space.md },
  meta: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: space.xs },
  scripture: { fontStyle: 'italic', marginBottom: space.md, fontSize: 16 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.lg, marginBottom: space.sm },
  flex: { flex: 1 },
});
