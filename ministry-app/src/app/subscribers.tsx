import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RequireOwner } from '@/components/RequireOwner';
import { Notice } from '@/components/form';
import { Body, Button, Screen, Title } from '@/components/ui';
import { formatDate, shareText } from '@/lib/links';
import { friendlyError, supabase } from '@/lib/supabase';
import { radius, space, useTheme } from '@/theme';

type Subscriber = {
  id: string;
  first_name: string;
  email: string | null;
  phone: string | null;
  email_opt_in: boolean;
  sms_opt_in: boolean;
  created_at: string;
};

/** Owner: see, search, remove and export newsletter subscribers. */
export default function Subscribers() {
  return (
    <RequireOwner title="Subscribers">
      <SubscriberList />
    </RequireOwner>
  );
}

function SubscriberList() {
  const t = useTheme();
  const [rows, setRows] = useState<Subscriber[] | null>(null);
  const [query, setQuery] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const all: Subscriber[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase!
        .from('subscribers')
        .select('id, first_name, email, phone, email_opt_in, sms_opt_in, created_at')
        .order('created_at', { ascending: false })
        .range(from, from + 999);
      if (error) {
        setError(friendlyError(error));
        return;
      }
      all.push(...((data as Subscriber[]) ?? []));
      if (!data || data.length < 1000) break;
    }
    setRows(all);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((r) => !q || [r.first_name, r.email, r.phone].some((v) => v?.toLowerCase().includes(q)));
  }, [rows, query]);

  const remove = async (s: Subscriber) => {
    setError('');
    setMessage('');
    const { error } = await supabase!.from('subscribers').delete().eq('id', s.id);
    if (error) setError(friendlyError(error));
    else {
      setMessage(`${s.first_name} was removed from the newsletter.`);
      setRows((r) => r?.filter((x) => x.id !== s.id) ?? null);
    }
    setRemoving(null);
  };

  const exportList = () => {
    const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const lines = [
      'First name,Email,Phone,Email updates,Text updates,Joined',
      ...(rows ?? []).map((r) =>
        [r.first_name, r.email ?? '', r.phone ?? '', r.email_opt_in ? 'yes' : 'no', r.sms_opt_in ? 'yes' : 'no', r.created_at.slice(0, 10)].map(cell).join(','),
      ),
    ];
    shareText(lines.join('\n'));
  };

  const emails = rows?.filter((r) => r.email_opt_in).length ?? 0;
  const texts = rows?.filter((r) => r.sms_opt_in).length ?? 0;

  return (
    <Screen>
      <Title>Subscribers</Title>
      <Body muted>
        {rows ? `${rows.length} people · ${emails} by email · ${texts} by text` : 'Loading…'}
      </Body>
      <Body muted style={{ fontSize: 13, marginBottom: space.md }}>
        Keep this list private. Only use it for AFM announcements, as the privacy policy promises.
      </Body>

      {!!error && <Notice kind="error">{error}</Notice>}
      {!!message && <Notice kind="success">{message}</Notice>}

      <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
        <Button label="Export list" icon="download-outline" variant="outline" onPress={exportList} style={{ flex: 1 }} />
        <Button label="Refresh" icon="refresh" variant="outline" onPress={load} style={{ flex: 1 }} />
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, email or phone"
        placeholderTextColor={t.textMuted}
        autoCapitalize="none"
        style={[styles.search, { color: t.text, backgroundColor: t.surface, borderColor: t.border }]}
      />

      {!rows && !error && <ActivityIndicator color={t.accent} />}
      {rows?.length === 0 && <Body muted>No subscribers yet. They'll appear here when people join from More → Newsletter.</Body>}
      {shown.map((s) => (
        <View key={s.id} style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.rowTop}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{s.first_name}</Text>
              {!!s.email && <Text style={{ color: t.textMuted, marginTop: 2 }}>{s.email}</Text>}
              {!!s.phone && <Text style={{ color: t.textMuted, marginTop: 2 }}>{s.phone}</Text>}
              <View style={styles.tags}>
                {s.email_opt_in && <Tag label="Email" />}
                {s.sms_opt_in && <Tag label="Text" />}
                <Text style={{ color: t.textMuted, fontSize: 12 }}>Joined {formatDate(s.created_at.slice(0, 10))}</Text>
              </View>
            </View>
            {removing !== s.id && (
              <Pressable onPress={() => setRemoving(s.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${s.first_name}`}>
                <Ionicons name="trash-outline" size={20} color={t.textMuted} />
              </Pressable>
            )}
          </View>
          {removing === s.id && (
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
              <Button label="Keep" variant="outline" onPress={() => setRemoving(null)} style={{ flex: 1 }} />
              <Button label="Remove" onPress={() => remove(s)} style={{ flex: 1, backgroundColor: '#B3261E', borderColor: '#B3261E' }} />
            </View>
          )}
        </View>
      ))}
    </Screen>
  );
}

function Tag({ label }: { label: string }) {
  const t = useTheme();
  return <Text style={[styles.tag, { color: t.primary, borderColor: t.primary }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  search: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: 12, fontSize: 16, marginBottom: space.md },
  row: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: space.md, marginBottom: space.sm },
  rowTop: { flexDirection: 'row', gap: space.sm },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
});
