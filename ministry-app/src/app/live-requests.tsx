import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { RequireOwner } from '@/components/RequireOwner';
import { Notice } from '@/components/form';
import { Body, Chip, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { type LiveMessage, useLiveMessages, useLiveSession } from '@/lib/liveService';
import { radius, space, useTheme } from '@/theme';

type Recent = LiveMessage & { live_sessions?: { title: string } | null };

/** Ministry team: prayer requests sent from the Live screen, newest first. */
export default function LiveRequests() {
  return (
    <RequireOwner title="Prayer requests">
      <Requests />
    </RequireOwner>
  );
}

function Requests() {
  const t = useTheme();
  const { session } = useLiveSession();
  const { messages } = useLiveMessages(session?.id);
  const [scope, setScope] = useState<'now' | 'recent'>('now');
  const [recent, setRecent] = useState<Recent[] | null>(null);

  useEffect(() => {
    if (scope !== 'recent' || !supabase) return;
    supabase
      .from('live_messages')
      .select('*, live_sessions(title)')
      .eq('kind', 'prayer')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => setRecent((data as never) ?? []));
  }, [scope]);

  const list = scope === 'now' ? messages.filter((m) => m.kind === 'prayer').reverse() : recent;

  return (
    <Screen>
      <View style={styles.chips}>
        <Chip label="This service" active={scope === 'now'} onPress={() => setScope('now')} />
        <Chip label="All recent" active={scope === 'recent'} onPress={() => setScope('recent')} />
      </View>
      <Body muted style={{ marginBottom: space.md }}>
        Only the ministry team sees these. They are kept for up to 24 months, as the privacy policy says.
      </Body>
      {scope === 'now' && !session && <Notice kind="info">No service is live right now. Tap "All recent" to see earlier prayer requests.</Notice>}
      {!list && <ActivityIndicator color={t.accent} />}
      {list?.length === 0 && (scope === 'recent' || session) && <Body muted>No prayer requests yet.</Body>}
      {list?.map((m) => (
        <View key={m.id} style={[styles.item, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.head}>
            <Text style={{ color: t.text, fontWeight: '700' }}>{m.name}</Text>
            <Text style={{ color: t.textMuted, fontSize: 13 }}>
              {new Date(m.created_at).toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={{ color: t.text, fontSize: 16, lineHeight: 23 }}>{m.body}</Text>
          {scope === 'recent' && (m as Recent).live_sessions?.title ? (
            <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>{(m as Recent).live_sessions!.title}</Text>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  item: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
});
