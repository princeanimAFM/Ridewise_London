import { useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useContent } from '@/lib/liveContent';
import { Button } from './ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** 9.0.0 > 1.0.0: compares version numbers part by part. */
export function isNewer(latest: string, current: string): boolean {
  const a = latest.split('.').map((n) => parseInt(n, 10) || 0);
  const b = current.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

/**
 * When the Play Store has a newer version than the one installed, a pop-up offers to update.
 * The newest version is set in the Owner dashboard (Theme, contact & settings → App updates) once the
 * store has approved it, so nobody is sent to the store before the update is there. Shown each time the
 * app opens until they update; "Later" hides it until the next time.
 */
export function UpdatePrompt() {
  const t = useTheme();
  const ministry = useContent();
  const [later, setLater] = useState(false);
  const latest = Platform.OS === 'android' ? ministry.appUpdate.android : '';
  const installed = Constants.nativeAppVersion ?? '';
  if (later || !latest || !installed || !isNewer(latest, installed)) return null;

  const update = () => {
    setLater(true);
    Linking.openURL('market://details?id=com.afm.hub').catch(() => Linking.openURL(ministry.playStoreUrl).catch(() => {}));
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => setLater(true)}>
      <View style={styles.veil}>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.gold }]}>
          <View style={[styles.icon, { backgroundColor: t.primary }]}>
            <Ionicons name="arrow-up-circle" size={30} color={t.gold} />
          </View>
          <Text style={[styles.title, { color: t.text }]}>A new version of The AFM HUB is available</Text>
          <Text style={{ color: t.textMuted, lineHeight: 21, textAlign: 'center' }}>
            {ministry.appUpdate.message || 'Update now from the Play Store to get the latest improvements and fixes.'}
          </Text>
          <Button label="Update now" icon="logo-google-playstore" onPress={update} style={{ alignSelf: 'stretch', marginTop: space.md }} />
          <Button label="Later" variant="outline" onPress={() => setLater(true)} style={{ alignSelf: 'stretch', marginTop: space.sm }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  veil: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  card: { width: '100%', maxWidth: 380, borderRadius: radius.lg, borderWidth: 1, padding: space.lg, alignItems: 'center', gap: space.sm },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  title: { fontFamily: fonts.serif, fontSize: 21, fontWeight: '700', textAlign: 'center' },
});
