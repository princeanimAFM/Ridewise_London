import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Sermon } from '@/content/ministry';
import { formatDate, youtubeThumb } from '@/lib/links';
import { radius, space, useTheme } from '@/theme';
import { Artwork, Card } from './ui';

export function sermonImage(s: Sermon) {
  return s.image ?? (s.youtubeId ? youtubeThumb(s.youtubeId) : undefined);
}

export function SermonCard({ sermon, large }: { sermon: Sermon; large?: boolean }) {
  const t = useTheme();
  const open = () => router.push({ pathname: '/sermon/[id]', params: { id: sermon.id } });
  if (large) {
    return (
      <Card onPress={open}>
        <Artwork uri={sermonImage(sermon)} icon="play-circle" label={sermon.title} style={styles.hero} />
        <View style={{ padding: space.md }}>
          <Text style={[styles.meta, { color: t.accent }]}>
            {[sermon.series, formatDate(sermon.date)].filter(Boolean).join(' · ')}
          </Text>
          <Text style={[styles.titleLarge, { color: t.text }]}>{sermon.title}</Text>
          <Text numberOfLines={2} style={{ color: t.textMuted, marginTop: 4 }}>
            {sermon.summary}
          </Text>
        </View>
      </Card>
    );
  }
  return (
    <Card onPress={open} style={styles.row}>
      <Artwork uri={sermonImage(sermon)} icon="play-circle" style={styles.thumb} />
      <View style={{ flex: 1, padding: space.sm }}>
        <Text style={[styles.meta, { color: t.accent }]}>{formatDate(sermon.date)}</Text>
        <Text numberOfLines={2} style={[styles.title, { color: t.text }]}>
          {sermon.title}
        </Text>
        {sermon.scripture && <Text style={{ color: t.textMuted, marginTop: 2 }}>{sermon.scripture}</Text>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', aspectRatio: 16 / 9 },
  meta: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  titleLarge: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  title: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: space.sm },
  thumb: { width: 120, height: 80, borderRadius: radius.sm, margin: space.sm },
});
