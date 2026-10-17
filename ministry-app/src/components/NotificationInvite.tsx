import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { applyPrefs, getPrefs, markPrompted, supported } from '@/lib/notifications';
import { Button } from './ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** A one-time invitation shown on Home before the phone's own permission dialog. */
export function NotificationInvite() {
  const t = useTheme();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (supported) getPrefs().then((p) => setVisible(!p.prompted));
  }, []);

  if (!visible) return null;

  const accept = async () => {
    setBusy(true);
    await applyPrefs({ ...(await getPrefs()), prompted: true, dailyQuote: true, announcements: true });
    setBusy(false);
    setVisible(false);
  };
  const later = async () => {
    await markPrompted();
    setVisible(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.gold }]}>
      <View style={[styles.icon, { backgroundColor: t.primary }]}>
        <Ionicons name="notifications" size={24} color={t.gold} />
      </View>
      <Text style={[styles.title, { color: t.text }]}>Stay blessed every day</Text>
      <Text style={{ color: t.textMuted, lineHeight: 21, textAlign: 'center' }}>Allow notifications to receive:</Text>
      <View style={styles.list}>
        {['A daily AFM quote each morning', 'Ministry announcements & upcoming programmes', 'New updates in the app'].map((line) => (
          <View key={line} style={styles.item}>
            <Ionicons name="checkmark-circle" size={18} color={t.accent} />
            <Text style={{ color: t.text, flex: 1 }}>{line}</Text>
          </View>
        ))}
      </View>
      <Button label={busy ? 'Turning on…' : 'Turn on notifications'} icon="notifications-outline" variant="gold" onPress={accept} style={{ alignSelf: 'stretch' }} />
      <Button label="Not now" variant="outline" onPress={later} style={{ alignSelf: 'stretch', marginTop: space.sm }} />
      <Text style={{ color: t.textMuted, fontSize: 12, marginTop: space.sm, textAlign: 'center' }}>You can change this any time in More → Notifications.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg, alignItems: 'center', marginTop: space.md },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  title: { fontFamily: fonts.serif, fontSize: 21, fontWeight: '700', marginBottom: 4 },
  list: { alignSelf: 'stretch', gap: space.xs, marginVertical: space.md },
  item: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
});
