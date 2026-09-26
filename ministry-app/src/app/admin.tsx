import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { flyerUrl, friendlyError, supabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/announcements';
import { formatDate } from '@/lib/links';
import { BackendComingSoon } from '@/components/ComingSoon';
import { Field, Notice, Toggle } from '@/components/form';
import { Artwork, Body, Button, Screen, SectionHeader, Title } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

type Counts = { total: number; email: number; sms: number; push: number };
type Picked = { uri: string; mimeType?: string | null; fileName?: string | null };

/** Owner dashboard: upload a flyer, let AI write the message, send to subscribers. */
export default function Admin() {
  const t = useTheme();
  const { session, profile, loading } = useAuth();

  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<Announcement[]>([]);
  const [flyer, setFlyer] = useState<Picked | null>(null);
  const [flyerPath, setFlyerPath] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [body, setBody] = useState('');
  const [smsText, setSmsText] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [sendPush, setSendPush] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !profile?.is_admin) return;
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.rpc('subscriber_counts'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(10),
    ]);
    const row = Array.isArray(c) ? c[0] : c;
    if (row) setCounts({ total: Number(row.total), email: Number(row.email), sms: Number(row.sms), push: Number(row.push ?? 0) });
    setRecent((a as Announcement[]) ?? []);
  }, [profile?.is_admin]);

  useEffect(() => {
    load();
  }, [load]);

  if (!supabase) return <BackendComingSoon feature="Owner dashboard" />;
  if (loading) return <Screen><ActivityIndicator color={t.accent} style={{ marginTop: space.xl }} /></Screen>;
  if (!session || !profile?.is_admin) {
    return (
      <Screen>
        <Title>Owner dashboard</Title>
        <Notice kind="info">This area is for the ministry's owner account. Sign in with that account to upload flyers and send announcements.</Notice>
      </Screen>
    );
  }

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError('');
    setMessage('');
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy('');
    }
  };

  const pickFlyer = () =>
    run('flyer', async () => {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      setFlyer(asset);
      // Upload straight away so AI can read the flyer.
      const ext = (asset.fileName?.split('.').pop() || asset.mimeType?.split('/').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
      const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}.${ext}`;
      const bytes = await (await fetch(asset.uri)).arrayBuffer();
      const { error } = await supabase!.storage.from('flyers').upload(path, bytes, { contentType: asset.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}` });
      if (error) throw error;
      setFlyerPath(path);
    });

  const aiDraft = () =>
    run('ai', async () => {
      const { data, error } = await supabase!.functions.invoke('draft-announcement', {
        body: { title, notes: body, event_date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined, flyer_path: flyerPath ?? undefined },
      });
      if (error) throw new Error((await errorText(error)) || 'AI writing failed.');
      if (data?.error) throw new Error(data.error);
      setTitle(data.title);
      setBody(data.body);
      setSmsText(data.sms_text);
      setMessage('Draft ready. Read it through and edit anything before sending.');
    });

  const validate = () => {
    if (!title.trim()) throw new Error('Add a title.');
    if (!body.trim()) throw new Error('Add the message (or tap "Write it with AI").');
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Write the date as YYYY-MM-DD, e.g. 2026-11-20.');
    if (!sendEmail && !sendSms && !sendPush) throw new Error('Choose at least one way to send: email, text or app notification.');
  };

  const insert = async (published: boolean) => {
    const { data, error } = await supabase!
      .from('announcements')
      .insert({ title: title.trim(), body: body.trim(), sms_text: smsText.trim() || null, flyer_path: flyerPath, event_date: date || null, send_email: sendEmail, send_sms: sendSms, send_push: sendPush, published })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  };

  const preview = () =>
    run('preview', async () => {
      validate();
      const to = session.user.email;
      if (!to) throw new Error('Your account has no email address to send a preview to.');
      const id = await insert(false);
      const { data, error } = await supabase!.functions.invoke('send-announcement', { body: { announcement_id: id, test_email: to } });
      await supabase!.from('announcements').delete().eq('id', id);
      if (error) throw new Error((await errorText(error)) || 'Preview failed.');
      if (data?.error) throw new Error(data.error);
      setMessage(`Preview sent to ${to}. Check your inbox.`);
    });

  const publish = () =>
    run('send', async () => {
      validate();
      const id = await insert(true);
      const { data, error } = await supabase!.functions.invoke('send-announcement', { body: { announcement_id: id } });
      if (error) throw new Error(`Published in the app, but sending failed: ${(await errorText(error)) || 'unknown error'}`);
      if (data?.error) throw new Error(`Published in the app, but sending failed: ${data.error}`);
      const parts = [
        sendEmail && `${data.emailSent} emails sent${data.emailFailed ? ` (${data.emailFailed} failed)` : ''}`,
        sendSms && `${data.smsSent} texts sent${data.smsFailed ? ` (${data.smsFailed} failed)` : ''}`,
        sendPush && `${data.pushSent ?? 0} app notifications sent${data.pushFailed ? ` (${data.pushFailed} failed)` : ''}`,
        data.skipped?.length && `Not sent: ${data.skipped.join(', ')}`,
      ].filter(Boolean);
      setMessage(`Published. ${parts.join('. ')}.`);
      setTitle('');
      setBody('');
      setSmsText('');
      setDate('');
      setFlyer(null);
      setFlyerPath(null);
      setConfirming(false);
      load();
    });

  const audience = (sendEmail ? counts?.email ?? 0 : 0) + (sendSms ? counts?.sms ?? 0 : 0) + (sendPush ? counts?.push ?? 0 : 0);

  return (
    <Screen>
      <Title>Owner dashboard</Title>
      <View style={styles.stats}>
        {[
          ['Subscribers', counts?.total],
          ['Email', counts?.email],
          ['Text', counts?.sms],
          ['App', counts?.push],
        ].map(([label, n]) => (
          <View key={label as string} style={[styles.stat, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.statNum, { color: t.text }]}>{n ?? '–'}</Text>
            <Text style={{ color: t.textMuted, fontWeight: '600' }}>{label}</Text>
          </View>
        ))}
      </View>

      <Button label="Edit app content" icon="create-outline" onPress={() => router.push('/manage')} style={{ marginTop: space.md }} />
      <Body muted style={{ marginTop: space.xs }}>Books, perfumes, quotes, giving details, links, service times and the theme.</Body>
      <Button label="Admins" icon="people-outline" variant="outline" onPress={() => router.push('/admins')} style={{ marginTop: space.sm }} />

      <SectionHeader title="New announcement" />
      {!!error && <Notice kind="error">{error}</Notice>}
      {!!message && <Notice kind="success">{message}</Notice>}

      <Pressable onPress={pickFlyer} style={[styles.flyerBox, { borderColor: t.border, backgroundColor: t.surface }]} accessibilityRole="button" accessibilityLabel="Choose a flyer image">
        {flyer ? (
          <Artwork uri={flyer.uri} icon="image" style={styles.flyerImg} />
        ) : (
          <View style={styles.flyerEmpty}>
            <Ionicons name="image-outline" size={34} color={t.accent} />
            <Text style={{ color: t.text, fontWeight: '700', marginTop: space.xs }}>Upload a flyer (optional)</Text>
            <Text style={{ color: t.textMuted }}>From your photos</Text>
          </View>
        )}
        {busy === 'flyer' && <ActivityIndicator color={t.accent} style={StyleSheet.absoluteFill} />}
      </Pressable>
      {flyer && !flyerPath && busy !== 'flyer' && <Notice kind="error">The flyer did not upload. Tap it to try again.</Notice>}

      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. The Great Gathering 2026" />
      <Field label="Date of the programme (optional)" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10} />
      <Field
        label="Message"
        value={body}
        onChangeText={setBody}
        multiline
        placeholder="Write the announcement, or jot a few notes and tap “Write it with AI”."
        hint="Each subscriber's email starts with “Dear <their first name>,” automatically."
      />
      <Button label={busy === 'ai' ? 'Writing…' : 'Write it with AI'} icon="sparkles-outline" variant="outline" onPress={aiDraft} style={{ marginBottom: space.md }} />
      {sendSms && <Field label="Text message version" value={smsText} onChangeText={setSmsText} maxLength={320} hint="Short. The subscriber's name, a link and an opt-out link are added automatically." />}

      <Toggle label="Send by email" hint={`${counts?.email ?? 0} subscribers`} value={sendEmail} onValueChange={setSendEmail} />
      <Toggle label="Send by text message" hint={`${counts?.sms ?? 0} subscribers · costs per message`} value={sendSms} onValueChange={setSendSms} />
      <Toggle label="Send as app notification" hint={`${counts?.push ?? 0} phones · free`} value={sendPush} onValueChange={setSendPush} />

      <Button label={busy === 'preview' ? 'Sending preview…' : 'Email me a preview'} icon="eye-outline" variant="outline" onPress={preview} style={{ marginVertical: space.sm }} />
      {!confirming ? (
        <Button label="Publish & send" icon="send-outline" variant="gold" onPress={() => { setError(''); setConfirming(true); }} />
      ) : (
        <View style={[styles.confirm, { borderColor: t.gold, backgroundColor: t.surface }]}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Send {audience} message{audience === 1 ? '' : 's'} now?</Text>
          <Text style={{ color: t.textMuted, marginTop: 4 }}>It will also appear in the app's Announcements. This can't be unsent.</Text>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
            <Button label="Cancel" variant="outline" onPress={() => setConfirming(false)} style={{ flex: 1 }} />
            <Button label={busy === 'send' ? 'Sending…' : 'Yes, send'} variant="gold" onPress={publish} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      <SectionHeader title="Recent announcements" />
      {recent.length === 0 && <Body muted>None yet.</Body>}
      {recent.map((a) => (
        <View key={a.id} style={[styles.recent, { backgroundColor: t.surface, borderColor: t.border }]}>
          {a.flyer_path && <Artwork uri={flyerUrl(a.flyer_path)} icon="image" style={styles.thumb} />}
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '700' }} numberOfLines={2}>{a.title}</Text>
            <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 2 }}>
              {a.sent_at ? `Sent ${formatDate(a.sent_at.slice(0, 10))} · ${a.sent_count} delivered${a.failed_count ? `, ${a.failed_count} failed` : ''}` : a.published ? 'Published, not sent' : 'Draft'}
            </Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

/** Reads the JSON error message from a failed function call. */
async function errorText(error: unknown): Promise<string> {
  const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
  try {
    const body = await ctx?.json?.();
    if (body?.error) return body.error;
  } catch {}
  return (error as { message?: string }).message ?? '';
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  stat: { flex: 1, alignItems: 'center', padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  statNum: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  flyerBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.md, overflow: 'hidden', marginBottom: space.md, minHeight: 140, justifyContent: 'center' },
  flyerEmpty: { alignItems: 'center', padding: space.lg },
  flyerImg: { width: '100%', aspectRatio: 4 / 5 },
  confirm: { borderWidth: 1, borderRadius: radius.md, padding: space.md },
  recent: { flexDirection: 'row', gap: space.sm, alignItems: 'center', padding: space.sm, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: space.sm },
  thumb: { width: 52, height: 52, borderRadius: radius.sm },
});
