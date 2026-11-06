import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/lib/auth';
import { friendlyError } from '@/lib/supabase';
import { hideLiveMessage, type LiveSession, sendLiveMessage, useLiveMessages } from '@/lib/liveService';
import { Notice } from './form';
import { Body, Button, Chip } from './ui';
import { radius, space, useTheme } from '@/theme';

/** Comments and private prayer requests under the live video, while a service is live. */
export function LiveChat({ session }: { session: LiveSession }) {
  const t = useTheme();
  const { session: auth, profile } = useAuth();
  const { messages, add, remove } = useLiveMessages(session.id);
  const [tab, setTab] = useState<'comment' | 'prayer'>('comment');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const isTeam = !!profile?.is_admin;
  const me = auth?.user.id;

  const comments = messages.filter((m) => m.kind === 'comment' && !m.hidden).slice(-60);
  const myPrayers = messages.filter((m) => m.kind === 'prayer' && m.user_id === me);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError('');
    setSent(false);
    try {
      add(await sendLiveMessage(session.id, tab, body));
      setText('');
      if (tab === 'prayer') setSent(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const hide = (id: number) => {
    const go = () => hideLiveMessage(id).then(() => remove(id)).catch((e) => setError(friendlyError(e)));
    if (Platform.OS === 'web') go();
    else Alert.alert('Hide this comment?', 'It will disappear for everyone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Hide', style: 'destructive', onPress: go }]);
  };

  return (
    <View style={[styles.box, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.tabs}>
        <Chip label="Comments" active={tab === 'comment'} onPress={() => { setTab('comment'); setError(''); }} />
        <Chip label="Prayer request" active={tab === 'prayer'} onPress={() => { setTab('prayer'); setError(''); }} />
      </View>

      {tab === 'comment' ? (
        <View style={styles.list}>
          {comments.length === 0 && <Body muted>No comments yet. Say hello and where you're watching from.</Body>}
          {comments.map((m) => (
            <Pressable key={m.id} onLongPress={isTeam ? () => hide(m.id) : undefined} style={styles.comment}>
              <Text style={{ color: t.text, lineHeight: 21 }}>
                <Text style={{ fontWeight: '700', color: m.is_team ? t.accent : t.text }}>{m.name}</Text>
                {m.is_team ? <Text style={{ color: t.accent, fontSize: 12, fontWeight: '700' }}> · AFM TEAM</Text> : null}
                {'  '}
                {m.body}
              </Text>
            </Pressable>
          ))}
          {isTeam && comments.length > 0 && <Text style={{ color: t.textMuted, fontSize: 12, marginTop: space.xs }}>Ministry team: press and hold a comment to hide it.</Text>}
        </View>
      ) : (
        <View style={styles.list}>
          <View style={styles.privacy}>
            <Ionicons name="lock-closed" size={14} color={t.textMuted} />
            <Text style={{ color: t.textMuted, flex: 1 }}>Only the ministry team sees your prayer request. They'll pray with you during the service.</Text>
          </View>
          {sent && <Notice kind="success">Sent. The ministry team will pray with you.</Notice>}
          {myPrayers.map((m) => (
            <View key={m.id} style={[styles.mine, { borderColor: t.border }]}>
              <Text style={{ color: t.text }}>{m.body}</Text>
              <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>Sent ✓</Text>
            </View>
          ))}
        </View>
      )}

      {!!error && <Notice kind="error">{error}</Notice>}

      {auth ? (
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={tab === 'comment' ? 'Write a comment…' : 'Write your prayer request…'}
            placeholderTextColor={t.textMuted}
            maxLength={500}
            multiline={tab === 'prayer'}
            returnKeyType={tab === 'comment' ? 'send' : 'default'}
            onSubmitEditing={tab === 'comment' ? send : undefined}
            style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.background }, tab === 'prayer' && { minHeight: 80, textAlignVertical: 'top' }]}
          />
          <Pressable onPress={send} disabled={busy || !text.trim()} accessibilityLabel="Send" style={[styles.send, { backgroundColor: t.primary, opacity: busy || !text.trim() ? 0.5 : 1 }]}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <Button label="Sign in to comment or send a prayer request" icon="person-circle-outline" variant="outline" onPress={() => router.push('/account')} style={{ marginTop: space.sm }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: space.md, marginTop: space.md },
  tabs: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  list: { gap: 6, marginBottom: space.sm },
  comment: { paddingVertical: 2 },
  privacy: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  mine: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, padding: space.sm },
  inputRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  input: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 10, fontSize: 16 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
