import { ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAnnouncements } from '@/lib/announcements';
import { supabase } from '@/lib/supabase';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { BackendComingSoon } from '@/components/ComingSoon';
import { Notice } from '@/components/form';
import { Body, Button, Screen } from '@/components/ui';
import { space, useTheme } from '@/theme';

export default function Announcements() {
  const t = useTheme();
  const { items, loading, error, reload } = useAnnouncements();
  if (!supabase) return <BackendComingSoon feature="Announcements" />;
  return (
    <Screen>
      <Button label="Get these by email or text" icon="mail-open-outline" variant="gold" onPress={() => router.push('/subscribe')} style={{ marginBottom: space.md }} />
      {loading && <ActivityIndicator color={t.accent} style={{ marginTop: space.lg }} />}
      {!!error && (
        <>
          <Notice kind="error">{error}</Notice>
          <Button label="Try again" variant="outline" onPress={reload} />
        </>
      )}
      {!loading && !error && items.length === 0 && <Body muted style={{ textAlign: 'center', marginTop: space.lg }}>No announcements yet. Check back soon.</Body>}
      {items.map((a) => (
        <AnnouncementCard key={a.id} item={a} />
      ))}
    </Screen>
  );
}
