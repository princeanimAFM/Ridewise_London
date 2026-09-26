import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useContent } from '@/lib/liveContent';
import { openLink } from '@/lib/links';
import { fonts, space, useTheme } from '@/theme';
import { Card } from './ui';

/** The "Stream All 500+ Audio Sermons" call to action. */
export function ArchiveCard() {
  const ministry = useContent();
  const t = useTheme();
  const { title, subtitle, url } = ministry.sermonArchive;
  return (
    <Card onPress={() => openLink(url)} style={[styles.card, { backgroundColor: t.primary, borderColor: t.primary }]}>
      <View style={[styles.icon, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
        <Ionicons name="headset" size={30} color={t.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="play-circle" size={36} color={t.gold} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 19, fontWeight: '700' },
  subtitle: { color: '#DCE8DC', marginTop: 4 },
});
