import { createElement, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAP_PAGE } from '@/lib/maps';
import { useTheme } from '@/theme';

/** True for the dark themes (their background is near-black). */
export const isDarkTheme = (background: string) => parseInt(background.slice(1, 3), 16) < 80;

/**
 * The map page (theafmchurch.org/bible/map) inside the app. `hash` says what to show; tapping a place calls
 * `onPlace`; `selected` highlights a place without moving away from the view.
 */
export function BibleMap({ hash, selected, onPlace, style }: { hash: string; selected?: number | null; onPlace?: (id: number) => void; style?: ViewStyle }) {
  const t = useTheme();
  const web = useRef<WebView<object>>(null);
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  // The phone loads the page once, then changes only the part after #, so the map isn't downloaded again.
  const [first] = useState(hash);
  const onPlaceRef = useRef(onPlace);
  useEffect(() => { onPlaceRef.current = onPlace; }, [onPlace]);

  const receive = (raw: unknown) => {
    try {
      const m = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (m?.ready) setState('ready');
      if (m?.error) setState('error');
      if (typeof m?.place === 'number') onPlaceRef.current?.(m.place);
    } catch {}
  };

  useEffect(() => {
    if (selected == null || state !== 'ready') return;
    if (Platform.OS === 'web') frame?.contentWindow?.postMessage(JSON.stringify({ select: selected }), '*');
    else web.current?.injectJavaScript(`window.selectPlace && window.selectPlace(${Number(selected)}); true;`);
  }, [selected, state, frame]);

  useEffect(() => {
    if (Platform.OS === 'web' || hash === first) return;
    web.current?.injectJavaScript(`location.hash = ${JSON.stringify(hash)}; true;`);
  }, [hash, first]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const listen = (e: MessageEvent) => { if (frame && e.source === frame.contentWindow) receive(e.data); };
    window.addEventListener('message', listen);
    return () => window.removeEventListener('message', listen);
  }, [frame]);

  return (
    <View style={[styles.frame, { backgroundColor: t.surfaceAlt }, style]}>
      {Platform.OS === 'web'
        ? createElement('iframe', { ref: setFrame, src: `${MAP_PAGE}#${hash}`, title: 'Bible map', style: { width: '100%', height: '100%', border: 0 } })
        : (
          <WebView
            ref={web}
            source={{ uri: `${MAP_PAGE}#${first}` }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
            onMessage={(e: { nativeEvent: { data: string } }) => receive(e.nativeEvent.data)}
            onError={() => setState('error')}
            cacheEnabled
            setSupportMultipleWindows={false}
          />
        )}
      {state !== 'ready' && (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.surfaceAlt }]} pointerEvents="none">
          {state === 'loading' ? <ActivityIndicator color={t.accent} /> : (
            <Text style={{ color: t.textMuted, textAlign: 'center', padding: 24 }}>Could not load the map. Check your internet connection.</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
