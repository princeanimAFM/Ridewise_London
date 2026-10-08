import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ministry } from '@/content/ministry';
import { Episode, findEpisode, formatDuration, loadEpisodes } from '@/lib/podcast';
import { formatDate, openLink, shareText } from '@/lib/links';
import { usePlayer } from '@/lib/player';
import { Artwork, Body, Button, Screen, Title } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

export default function EpisodeScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = usePlayer();
  const [episode, setEpisode] = useState<Episode | undefined>(() => findEpisode(id) ?? (player.episode?.id === id ? player.episode : undefined));
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (!episode) loadEpisodes().then(() => setEpisode(findEpisode(id))).catch(() => {});
  }, [id]);

  if (!episode) {
    return (
      <Screen>
        <ActivityIndicator color={t.accent} style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  const current = player.episode?.id === episode.id;
  const playing = current && player.playing;
  const position = current ? player.position : 0;
  const duration = current ? player.duration : episode.duration ?? 0;
  const progress = duration ? Math.min(1, position / duration) : 0;

  return (
    <Screen player={false}>
      <Stack.Screen options={{ title: ministry.podcast.title }} />
      <Artwork uri={episode.image ?? ministry.portrait} icon="headset" style={styles.art} />
      {!!episode.date && <Text style={[styles.meta, { color: t.accent }]}>{formatDate(episode.date.slice(0, 10))}</Text>}
      <Title style={{ textAlign: 'center' }}>{episode.title}</Title>
      <Text style={[styles.by, { color: t.textMuted }]}>{ministry.minister}</Text>

      <Pressable
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onPress={(e) => current && duration && trackWidth && player.seekTo((e.nativeEvent.locationX / trackWidth) * duration)}
        style={[styles.track, { backgroundColor: t.surfaceAlt }]}
        hitSlop={{ top: 12, bottom: 12 }}
      >
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: t.primary }]} />
      </Pressable>
      <View style={styles.times}>
        <Text style={{ color: t.textMuted }}>{formatDuration(position) || '0:00'}</Text>
        <Text style={{ color: t.textMuted }}>{formatDuration(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={() => current && player.seekBy(-15)} hitSlop={10} accessibilityLabel="Back 15 seconds">
          <Ionicons name="play-back" size={30} color={current ? t.text : t.border} />
        </Pressable>
        <Pressable onPress={() => (playing ? player.toggle() : player.play(episode))} accessibilityLabel={playing ? 'Pause' : 'Play'}>
          {current && player.buffering ? (
            <ActivityIndicator size="large" color={t.primary} style={{ width: 80, height: 80 }} />
          ) : (
            <Ionicons name={playing ? 'pause-circle' : 'play-circle'} size={80} color={t.primary} />
          )}
        </Pressable>
        <Pressable onPress={() => current && player.seekBy(30)} hitSlop={10} accessibilityLabel="Forward 30 seconds">
          <Ionicons name="play-forward" size={30} color={current ? t.text : t.border} />
        </Pressable>
      </View>

      <Button
        label="Share this message"
        icon="share-social-outline"
        variant="outline"
        onPress={() => shareText(`${episode.title} — ${ministry.minister}\n${episode.link ?? ministry.podcast.pageUrl}`)}
        style={{ marginBottom: space.lg }}
      />
      {!!episode.description && <Body>{episode.description}</Body>}
      {!!episode.link && (
        <Button label="Open on Podbean" icon="open-outline" variant="outline" onPress={() => openLink(episode.link)} style={{ marginTop: space.lg }} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  art: { width: 240, height: 240, borderRadius: radius.lg, alignSelf: 'center', marginBottom: space.lg },
  meta: { textAlign: 'center', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: space.xs },
  by: { textAlign: 'center', marginBottom: space.lg },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6 },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xl, marginVertical: space.md },
});
