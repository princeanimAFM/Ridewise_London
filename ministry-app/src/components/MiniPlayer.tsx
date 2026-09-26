import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePlayer } from '@/lib/player';
import { space, useTheme } from '@/theme';
import { Artwork } from './ui';

/** Small "now playing" bar shown at the bottom of every screen while a sermon is loaded. */
export function MiniPlayer() {
  const t = useTheme();
  const { episode, playing, buffering, position, duration, toggle, stop } = usePlayer();
  if (!episode) return null;
  const progress = duration ? Math.min(1, position / duration) : 0;
  return (
    <View style={[styles.wrap, { backgroundColor: t.primary }]}>
      <View style={[styles.progress, { width: `${progress * 100}%`, backgroundColor: t.gold }]} />
      <Pressable style={styles.row} onPress={() => router.push({ pathname: '/episode/[id]', params: { id: episode.id } })}>
        <Artwork uri={episode.image} icon="headset" style={styles.art} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.title}>
            {episode.title}
          </Text>
          <Text style={styles.sub}>{buffering ? 'Loading…' : playing ? 'Now playing' : 'Paused'}</Text>
        </View>
        <Pressable onPress={toggle} hitSlop={10} accessibilityLabel={playing ? 'Pause' : 'Play'}>
          <Ionicons name={playing ? 'pause-circle' : 'play-circle'} size={40} color={t.gold} />
        </Pressable>
        <Pressable onPress={stop} hitSlop={10} accessibilityLabel="Close player">
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  progress: { height: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm },
  art: { width: 44, height: 44, borderRadius: 6 },
  title: { color: '#FFFFFF', fontWeight: '700' },
  sub: { color: '#DCE8DC', fontSize: 12, marginTop: 2 },
});
