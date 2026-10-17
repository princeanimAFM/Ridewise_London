import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useContent } from '@/lib/liveContent';
import { Artwork, Body, Card, Screen, Title } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

/** Free e-books and files, uploaded by the ministry. */
export default function Library() {
  const ministry = useContent();
  const t = useTheme();
  return (
    <Screen>
      <Title>Library</Title>
      <Body muted style={{ marginBottom: space.md }}>Free e-books, study guides and files from {ministry.minister}. Tap one to read it.</Body>
      {ministry.library.length === 0 && (
        <View style={[styles.empty, { borderColor: t.border }]}>
          <Ionicons name="library-outline" size={32} color={t.accent} />
          <Body muted style={{ textAlign: 'center', marginTop: space.sm }}>New e-books and files will appear here soon.</Body>
        </View>
      )}
      {ministry.library.map((item) => (
        <Card key={item.id} style={styles.row} onPress={() => router.push({ pathname: '/library/[id]', params: { id: item.id } })}>
          <Artwork uri={item.cover} icon="document-text" style={styles.cover} />
          <View style={{ flex: 1, padding: space.sm }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }} numberOfLines={2}>{item.title}</Text>
            {!!item.description && <Text style={{ color: t.textMuted, marginTop: 2 }} numberOfLines={3}>{item.description}</Text>}
            <Text style={{ color: t.accent, fontWeight: '700', marginTop: space.xs }}>Read free</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: space.sm },
  cover: { width: 84, minHeight: 110, borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.md, padding: space.lg, alignItems: 'center' },
});
