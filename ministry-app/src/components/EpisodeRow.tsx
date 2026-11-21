import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Episode } from '@/lib/podcast';
import { formatDuration } from '@/lib/podcast';
import { formatDate } from '@/lib/links';
import { usePlayer } from '@/lib/player';
import { radius, space, useTheme } from '@/theme';
import { Artwork } from './ui';

export function EpisodeRow({ episode }: { episode: Episode }) {
  const t = useTheme();
  const player = usePlayer();
  const current = player.episode?.id === episode.id;
  const isPlaying = current && player.playing;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/episode/[id]', params: { id: episode.id } })}
      style={({ pressed }) => [styles.row, { backgroundColor: t.surface, borderColor: current ? t.gold : t.border }, pressed && { opacity: 0.85 }]}
    >
      <Artwork uri={episode.image} icon="headset" style={styles.art} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.meta, { color: t.accent }]}>
          {[episode.date && formatDate(episode.date.slice(0, 10)), formatDuration(episode.duration)].filter(Boolean).join(' · ')}
        </Text>
        <Text numberOfLines={2} style={[styles.title, { color: t.text }]}>
          {episode.title}
        </Text>
      </View>
      <Pressable
        onPress={() => (isPlaying ? player.toggle() : player.play(episode))}
        hitSlop={8}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
      >
        <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={40} color={t.primary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.sm,
  },
  art: { width: 64, height: 64, borderRadius: radius.sm },
  meta: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 15, fontWeight: '600', marginTop: 2 },
});
