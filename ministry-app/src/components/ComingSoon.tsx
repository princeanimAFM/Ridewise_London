import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ministry } from '@/content/ministry';
import { Screen } from './ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** Shown for account/newsletter features until the backend is connected. */
export function BackendComingSoon({ feature }: { feature: string }) {
  const t = useTheme();
  return (
    <Screen>
      <View style={[styles.box, { backgroundColor: t.primary }]}>
        <Ionicons name="sparkles" size={32} color={t.gold} />
        <Text style={[styles.kicker, { color: t.gold }]}>COMING SOON</Text>
        <Text style={styles.title}>{feature}</Text>
        <Text style={styles.text}>This feature is being set up. Meanwhile, you can reach the ministry at {ministry.contact.email}.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.lg, padding: space.lg, alignItems: 'center', gap: space.xs },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: space.sm },
  title: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  text: { color: '#DCE8DC', textAlign: 'center', marginTop: space.xs, lineHeight: 21 },
});
