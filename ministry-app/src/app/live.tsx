import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useContent } from '@/lib/liveContent';
import { openLink } from '@/lib/links';
import { Body, Button, Card, Screen, SectionHeader } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

export default function Live() {
  const ministry = useContent();
  const { youtubeHandle, channelId } = ministry.live;
  const channelLiveUrl = `https://www.youtube.com/@${youtubeHandle}/live`;
  const playerUrl = channelId
    ? `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&playsinline=1`
    : `https://m.youtube.com/@${youtubeHandle}/live`;
  const t = useTheme();
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(true);

  return (
    <Screen padded={false}>
      <View style={styles.player}>
        {Platform.OS === 'web' ? (
          <View style={[styles.webFallback, { backgroundColor: t.primary }]}>
            <Ionicons name="logo-youtube" size={44} color="#FFFFFF" />
            <Text style={styles.webText}>Live services play inside the phone app.</Text>
            <Button label="Watch on YouTube" icon="open-outline" variant="gold" onPress={() => openLink(channelLiveUrl)} />
          </View>
        ) : (
          <>
            <WebView
              key={key}
              source={{ uri: playerUrl }}
              style={{ flex: 1, backgroundColor: '#000' }}
              allowsInlineMediaPlayback
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              onLoadEnd={() => setLoading(false)}
            />
            {loading && <ActivityIndicator color={t.gold} style={StyleSheet.absoluteFill} />}
          </>
        )}
      </View>

      <View style={{ padding: space.md }}>
        <View style={styles.titleRow}>
          <View style={styles.liveDot} />
          <Text style={[styles.kicker, { color: '#C62828' }]}>LIVE SERVICES</Text>
        </View>
        <Text style={[styles.title, { color: t.text }]}>Worship with us live</Text>
        <Body muted style={{ marginTop: space.xs }}>
          When {ministry.minister} is ministering live, the service plays above. If nothing is live right now, you'll see the latest videos from the channel.
        </Body>

        <View style={styles.buttons}>
          <Button label="Refresh" icon="refresh" variant="outline" onPress={() => { setLoading(true); setKey((k) => k + 1); }} style={styles.flex} />
          <Button label="Open in YouTube" icon="logo-youtube" onPress={() => openLink(channelLiveUrl)} style={styles.flex} />
        </View>

        {ministry.about.serviceTimes.length > 0 && (
          <>
            <SectionHeader title="Service times" />
            <Card style={{ padding: space.md }}>
              {ministry.about.serviceTimes.map((s) => (
                <View key={s.day} style={styles.time}>
                  <Ionicons name="time-outline" size={18} color={t.accent} />
                  <Text style={{ color: t.text, fontWeight: '700', width: 100 }}>{s.day}</Text>
                  <Text style={{ color: t.textMuted, flex: 1 }}>{s.detail}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        <SectionHeader title="Never miss a service" />
        <Button label="Turn on notifications" icon="notifications-outline" variant="gold" onPress={() => router.push('/notifications')} style={{ marginBottom: space.sm }} />
        <Button label="Past sermons" icon="play-circle-outline" variant="outline" onPress={() => router.push('/sermons')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', maxWidth: 720, alignSelf: 'center' },
  webFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.md },
  webText: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C62828' },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', marginTop: 2 },
  buttons: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  flex: { flex: 1 },
  time: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
});
