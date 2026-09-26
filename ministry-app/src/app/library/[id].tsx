import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useContent } from '@/lib/liveContent';
import { openLink, shareText } from '@/lib/links';
import { Body, Button, Screen } from '@/components/ui';
import { space, useTheme } from '@/theme';

/** Reads one Library file inside the app. */
export default function LibraryItemScreen() {
  const ministry = useContent();
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = ministry.library.find((l) => l.id === id);
  const [loading, setLoading] = useState(true);
  if (!item) return <Screen><Body>This file is no longer available.</Body></Screen>;

  // Android's web view can't show PDFs itself, so use Google's document viewer there.
  const viewerUrl = Platform.OS === 'android' ? `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(item.file)}` : item.file;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: item.title }} />
      {Platform.OS === 'web' ? (
        <Screen>
          <Body style={{ marginBottom: space.md }}>{item.description}</Body>
          <Button label="Open the file" icon="document-text-outline" variant="gold" onPress={() => openLink(item.file)} />
        </Screen>
      ) : (
        <>
          <WebView source={{ uri: viewerUrl }} style={{ flex: 1 }} onLoadEnd={() => setLoading(false)} />
          {loading && <ActivityIndicator color={t.accent} style={StyleSheet.absoluteFill} />}
          <View style={[styles.bar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
            <Button label="Open in another app" icon="open-outline" variant="outline" onPress={() => openLink(item.file)} style={{ flex: 1 }} />
            <Button label="Share" icon="share-social-outline" onPress={() => shareText(`${item.title}, free from ${ministry.name}\n${item.file}`)} style={{ flex: 1 }} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: space.sm, padding: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
});
