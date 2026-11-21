import { createElement, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { videoSource } from '@/lib/video';
import { radius, useTheme } from '@/theme';

/** Plays a YouTube, Google Drive or .mp4 link inline, at 16:9. */
export function VideoPlayer({ link, style }: { link?: string; style?: ViewStyle }) {
  const t = useTheme();
  const [loading, setLoading] = useState(true);
  const src = videoSource(link);
  if (!src) return null;

  const frameStyle = { width: '100%', height: '100%', border: 0, backgroundColor: '#000' };
  let player;
  if (Platform.OS === 'web') {
    player =
      src.kind === 'embed'
        ? createElement('iframe', { src: src.url, style: frameStyle, allow: 'autoplay; fullscreen; picture-in-picture', allowFullScreen: true })
        : createElement('video', { src: src.url, style: frameStyle, controls: true, playsInline: true, preload: 'metadata' });
  } else {
    const html = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#000}video{width:100%;height:100%}</style><video src="${src.url.replace(/"/g, '&quot;')}" controls playsinline preload="metadata"></video>`;
    player = (
      <>
        <WebView
          source={src.kind === 'embed' ? { uri: src.url } : { html }}
          style={{ flex: 1, backgroundColor: '#000' }}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          onLoadEnd={() => setLoading(false)}
        />
        {loading && <ActivityIndicator color={t.gold} style={StyleSheet.absoluteFill} />}
      </>
    );
  }

  return <View style={[styles.frame, style]}>{player}</View>;
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' },
});
