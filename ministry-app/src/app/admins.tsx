import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { RequireOwner } from '@/components/RequireOwner';
import { Field, Notice } from '@/components/form';
import { Body, Button, Screen, SectionHeader, Title } from '@/components/ui';
import { friendlyError, supabase } from '@/lib/supabase';
import { radius, space, useTheme } from '@/theme';

type Admin = { email: string; first_name: string | null; is_owner: boolean; is_me: boolean };

/** Admins: add or remove people who can use the Owner dashboard. */
export default function Admins() {
  return (
    <RequireOwner title="Admins">
      <AdminList />
    </RequireOwner>
  );
}

function AdminList() {
  const t = useTheme();
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [email, setEmail] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase!.rpc('list_admins');
    if (error) setError(friendlyError(error));
    else setAdmins((data as Admin[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const change = async (target: string, makeAdmin: boolean) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { error } = await supabase!.rpc('set_admin', { p_email: target, p_admin: makeAdmin });
      if (error) throw error;
      setMessage(makeAdmin ? `${target} is now an admin. They'll see the Owner dashboard under More the next time they open the app.` : `${target} is no longer an admin.`);
      setEmail('');
      setRemoving(null);
      await load();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const add = () => {
    const value = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('Enter their email address.');
      return;
    }
    change(value, true);
  };

  return (
    <Screen>
      <Title>Admins</Title>
      <Body muted>
        Admins can send announcements and edit the app's content. Everyone else sees the normal app.
      </Body>

      {!!error && <Notice kind="error">{error}</Notice>}
      {!!message && <Notice kind="success">{message}</Notice>}

      <SectionHeader title="Current admins" />
      {!admins && <ActivityIndicator color={t.accent} />}
      {admins?.map((a) => (
        <View key={a.email} style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.rowTop}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{a.first_name || a.email}</Text>
              {!!a.first_name && <Text style={{ color: t.textMuted, marginTop: 2 }}>{a.email}</Text>}
            </View>
            {a.is_owner ? (
              <Text style={[styles.badge, { color: t.primary, borderColor: t.primary }]}>Owner</Text>
            ) : a.is_me ? (
              <Text style={[styles.badge, { color: t.textMuted, borderColor: t.border }]}>You</Text>
            ) : removing !== a.email ? (
              <Button label="Remove" variant="outline" onPress={() => { setError(''); setRemoving(a.email); }} style={styles.small} />
            ) : null}
          </View>
          {removing === a.email && (
            <View style={{ marginTop: space.sm }}>
              <Text style={{ color: t.text }}>Remove {a.email} as an admin?</Text>
              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                <Button label="Keep" variant="outline" onPress={() => setRemoving(null)} style={{ flex: 1 }} />
                <Button label={busy ? 'Removing…' : 'Remove'} onPress={() => change(a.email, false)} style={{ flex: 1, backgroundColor: '#B3261E', borderColor: '#B3261E' }} />
              </View>
            </View>
          )}
        </View>
      ))}

      <SectionHeader title="Add an admin" />
      <Body muted style={{ marginBottom: space.md }}>
        First, ask them to create an account in the app (More → Sign in → Create account) and confirm their email. Then enter that email here.
      </Body>
      <Field label="Their email" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Button label={busy && !removing ? 'Adding…' : 'Make admin'} icon="person-add-outline" variant="gold" onPress={add} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: space.md, marginBottom: space.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, fontWeight: '700', fontSize: 13, overflow: 'hidden' },
  small: { paddingVertical: 6 },
});
