import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { goLive, useLiveMessages, useLiveSession } from '@/lib/liveService';
import { friendlyError } from '@/lib/supabase';
import { Field, Notice } from './form';
import { Body, Button } from './ui';
import { radius, space, useTheme } from '@/theme';

const DEFAULT_TITLE = 'Live service with Prophet Micah';

/** Owner dashboard: "We're live" (notifies every phone), then "End live service". */
export function LiveControl() {
  const t = useTheme();
  const { session, reload } = useLiveSession();
  const { messages } = useLiveMessages(session?.id);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [confirming, setConfirming] = useState<'start' | 'end' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const act = async (action: 'start' | 'end') => {
    setBusy(true);
    setError('');
    setNote('');
    try {
      const res = await goLive(action, title);
      setNote(action === 'start' ? `You're live. ${res.sent ?? 0} phones were notified.` : 'Live service ended. Comments and prayer requests are now closed.');
      setConfirming(null);
      await reload();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const prayers = messages.filter((m) => m.kind === 'prayer').length;
  const comments = messages.filter((m) => m.kind === 'comment' && !m.hidden).length;
  const since = session ? new Date(session.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: session ? '#C62828' : t.border }]}>
      {!!error && <Notice kind="error">{error}</Notice>}
      {!!note && <Notice kind="success">{note}</Notice>}

      {session ? (
        <>
          <View style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>LIVE NOW</Text>
            <Text style={{ color: t.textMuted, marginLeft: 'auto' }}>since {since}</Text>
          </View>
          <Text style={[styles.title, { color: t.text }]}>{session.title}</Text>
          <Body muted>
            {session.notified_count} phones notified · {comments} comment{comments === 1 ? '' : 's'} · {prayers} prayer request{prayers === 1 ? '' : 's'}
          </Body>
          <Button label={`Prayer requests (${prayers})`} icon="heart-outline" onPress={() => router.push('/live-requests')} style={{ marginTop: space.md }} />
          <Button label="Open the Live screen" icon="radio-outline" variant="outline" onPress={() => router.push('/live')} style={{ marginTop: space.sm }} />
          {confirming === 'end' ? (
            <View style={styles.confirm}>
              <Body>End the live service? Comments and prayer requests will close.</Body>
              <View style={styles.row}>
                <Button label="Keep going" variant="outline" onPress={() => setConfirming(null)} style={styles.flex} />
                <Button label={busy ? 'Ending…' : 'End it'} onPress={() => act('end')} style={[styles.flex, { backgroundColor: '#B3261E', borderColor: '#B3261E' }]} />
              </View>
            </View>
          ) : (
            <Button label="End live service" icon="stop-circle-outline" variant="outline" onPress={() => setConfirming('end')} style={{ marginTop: space.sm }} />
          )}
        </>
      ) : (
        <>
          <Body muted style={{ marginBottom: space.sm }}>
            When the service starts streaming, tap below. Everyone with app notifications on gets "🔴 Live now", and tapping it opens the Live screen, where members can comment and send prayer requests.
          </Body>
          <Field label="What's on" value={title} onChangeText={setTitle} placeholder={DEFAULT_TITLE} maxLength={120} />
          {confirming === 'start' ? (
            <View style={styles.confirm}>
              <Body>Send "🔴 Live now · {title.trim() || DEFAULT_TITLE}" to everyone? Make sure the stream has started on YouTube first.</Body>
              <View style={styles.row}>
                <Button label="Not yet" variant="outline" onPress={() => setConfirming(null)} style={styles.flex} />
                <Button label={busy ? 'Sending…' : 'Send it'} icon="send" onPress={() => act('start')} style={[styles.flex, { backgroundColor: '#C62828', borderColor: '#C62828' }]} />
              </View>
            </View>
          ) : (
            <Button label="We're live: notify everyone" icon="radio-outline" onPress={() => setConfirming('start')} style={{ backgroundColor: '#C62828', borderColor: '#C62828' }} />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: radius.md, padding: space.md, marginTop: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C62828' },
  liveText: { color: '#C62828', fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 18, fontWeight: '700', marginVertical: space.xs },
  confirm: { marginTop: space.md, gap: space.sm },
  flex: { flex: 1 },
});
