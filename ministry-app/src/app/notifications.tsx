import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { applyPrefs, getPrefs, NotificationPrefs, permissionStatus, supported } from '@/lib/notifications';
import { Notice, Toggle } from '@/components/form';
import { Body, Button, Chip, Screen, SectionHeader, Title } from '@/components/ui';
import { space, useTheme } from '@/theme';

const HOURS = [5, 6, 7, 8, 9, 12, 18, 21];
const label = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;

export default function NotificationSettings() {
  const t = useTheme();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [status, setStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    getPrefs().then(setPrefs);
    permissionStatus().then(setStatus);
  }, []);

  if (!supported) {
    return (
      <Screen>
        <Title>Notifications</Title>
        <Notice kind="info">Notifications are available in the phone app.</Notice>
      </Screen>
    );
  }
  if (!prefs) return <Screen>{null}</Screen>;

  const update = async (changes: Partial<NotificationPrefs>) => {
    const next = { ...prefs, ...changes, prompted: true };
    setPrefs(next);
    setSaved('');
    const { granted } = await applyPrefs(next);
    setStatus(granted ? 'granted' : await permissionStatus());
    setSaved(granted || (!next.dailyQuote && !next.dailyVerse && !next.announcements) ? 'Saved.' : '');
  };

  return (
    <Screen>
      <Title>Notifications</Title>
      {status === 'denied' && (
        <>
          <Notice kind="error">Notifications are turned off for The AFM HUB in your phone's settings.</Notice>
          <Button label="Open phone settings" icon="settings-outline" variant="outline" onPress={() => Linking.openSettings()} style={{ marginBottom: space.md }} />
        </>
      )}
      {!!saved && <Notice kind="success">{saved}</Notice>}

      <Toggle label="Daily AFM quote" hint="A new quote from Prophet Micah every day" value={prefs.dailyQuote} onValueChange={(v) => update({ dailyQuote: v })} />
      <Toggle label="Daily Bible verse" hint="The Verse of the Day; tap it to read the chapter" value={prefs.dailyVerse} onValueChange={(v) => update({ dailyVerse: v })} />
      {(prefs.dailyQuote || prefs.dailyVerse) && (
        <View style={{ marginBottom: space.md }}>
          <Text style={{ color: t.text, fontWeight: '600', marginBottom: space.sm }}>Time of day</Text>
          <View style={styles.hours}>
            {HOURS.map((h) => (
              <Chip key={h} label={label(h)} active={prefs.hour === h} onPress={() => update({ hour: h })} />
            ))}
          </View>
        </View>
      )}
      <Toggle label="Announcements & updates" hint="Upcoming programmes, flyers and ministry news" value={prefs.announcements} onValueChange={(v) => update({ announcements: v })} />

      <SectionHeader title="About" />
      <Body muted>The daily quote and verse are scheduled on your phone, at the time you choose. Announcements are sent by the ministry when there is news. We never send adverts.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
