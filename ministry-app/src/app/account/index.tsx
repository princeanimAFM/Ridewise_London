import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useContent } from '@/lib/liveContent';
import { displayName, useAuth } from '@/lib/auth';
import { friendlyError, supabase } from '@/lib/supabase';
import { openLink } from '@/lib/links';
import { BackendComingSoon } from '@/components/ComingSoon';
import { Divider, Field, Notice } from '@/components/form';
import { Button, Chip, ListRow, Screen, SectionHeader, Title, Body } from '@/components/ui';
import { fonts, space, useTheme } from '@/theme';

export default function Account() {
  const { session, loading } = useAuth();
  const t = useTheme();
  if (!supabase) return <BackendComingSoon feature="Accounts" />;
  if (loading) return <Screen><ActivityIndicator color={t.accent} style={{ marginTop: space.xl }} /></Screen>;
  return session ? <MyAccount /> : <SignIn />;
}

function SignIn() {
  const ministry = useContent();
  const { signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const emailSignIn = () =>
    run(async () => {
      if (!email.trim() || !password) throw new Error('Enter your email and password.');
      const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    });

  const sendPhoneCode = () =>
    run(async () => {
      const p = phone.replace(/[^0-9+]/g, '');
      if (!/^\+[1-9][0-9]{7,14}$/.test(p)) throw new Error('Enter your number in international format, e.g. +233201234567.');
      const { error } = await supabase!.auth.signInWithOtp({ phone: p });
      if (error) throw error;
      setCodeSent(true);
    });

  const verifyPhoneCode = () =>
    run(async () => {
      const { error } = await supabase!.auth.verifyOtp({ phone: phone.replace(/[^0-9+]/g, ''), token: code.trim(), type: 'sms' });
      if (error) throw error;
    });

  return (
    <Screen>
      <Title>Welcome to {ministry.name}</Title>
      <Body muted style={{ marginBottom: space.lg }}>
        Sign in to manage your newsletter and stay connected with the AFM family.
      </Body>

      {ministry.backend.googleSignIn && (
        <>
          <Button label="Continue with Google" icon="logo-google" variant="outline" onPress={() => run(signInWithGoogle)} />
          <Divider label="or" />
        </>
      )}

      {ministry.backend.phoneSignIn && (
        <View style={styles.tabs}>
          <Chip label="Email" active={mode === 'email'} onPress={() => setMode('email')} />
          <Chip label="Phone (text code)" active={mode === 'phone'} onPress={() => setMode('phone')} />
        </View>
      )}

      {!!error && <Notice kind="error">{error}</Notice>}

      {mode === 'email' ? (
        <>
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" />
          <Button label={busy ? 'Signing in…' : 'Sign in'} icon="log-in-outline" onPress={emailSignIn} />
          <View style={styles.links}>
            <Button label="Forgot password?" variant="outline" onPress={() => router.push('/account/forgot')} style={styles.flex} />
            <Button label="Create account" variant="gold" onPress={() => router.push('/account/sign-up')} style={styles.flex} />
          </View>
        </>
      ) : (
        <>
          <Field label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+233201234567" hint="Include your country code. We'll text you a 6-digit code." />
          {codeSent && <Field label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="sms-otp" textContentType="oneTimeCode" maxLength={6} />}
          {codeSent ? (
            <>
              <Button label={busy ? 'Checking…' : 'Verify and sign in'} icon="checkmark-circle-outline" onPress={verifyPhoneCode} />
              <Button label="Send a new code" variant="outline" onPress={sendPhoneCode} style={{ marginTop: space.sm }} />
            </>
          ) : (
            <Button label={busy ? 'Sending…' : 'Text me a code'} icon="chatbubble-outline" onPress={sendPhoneCode} />
          )}
        </>
      )}
    </Screen>
  );
}

function MyAccount() {
  const ministry = useContent();
  const t = useTheme();
  const { session, profile, refreshProfile, signOut } = useAuth();
  const [first, setFirst] = useState(profile?.first_name ?? '');
  const [last, setLast] = useState(profile?.last_name ?? '');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFirst(profile?.first_name ?? '');
    setLast(profile?.last_name ?? '');
  }, [profile?.first_name, profile?.last_name]);

  const save = async () => {
    setSaved('');
    setError('');
    const { error } = await supabase!.from('profiles').update({ first_name: first.trim(), last_name: last.trim() }).eq('id', session!.user.id);
    if (error) setError(friendlyError(error));
    else {
      setSaved('Saved.');
      refreshProfile();
    }
  };

  return (
    <Screen>
      <Text style={[styles.hello, { color: t.text }]}>Hello, {displayName(profile, session)}</Text>
      <Text style={{ color: t.textMuted, marginBottom: space.lg }}>{session?.user.email ?? session?.user.phone}</Text>

      {profile?.is_admin && (
        <ListRow icon="megaphone-outline" title="Owner dashboard" subtitle="Upload flyers and send announcements" onPress={() => router.push('/admin')} />
      )}
      <ListRow icon="mail-open-outline" title="Newsletter" subtitle="Choose email or text-message announcements" onPress={() => router.push('/subscribe')} />
      <ListRow icon="calendar-outline" title="Announcements" subtitle="Upcoming programmes and flyers" onPress={() => router.push('/announcements')} />

      <SectionHeader title="Your details" />
      {!!error && <Notice kind="error">{error}</Notice>}
      {!!saved && <Notice kind="success">{saved}</Notice>}
      <Field label="First name" value={first} onChangeText={setFirst} autoComplete="given-name" />
      <Field label="Last name" value={last} onChangeText={setLast} autoComplete="family-name" />
      <Button label="Save" icon="save-outline" onPress={save} />

      <SectionHeader title="Account" />
      <Button label="Change password" icon="key-outline" variant="outline" onPress={() => router.push('/account/forgot')} style={{ marginBottom: space.sm }} />
      <Button label="Sign out" icon="log-out-outline" variant="outline" onPress={signOut} style={{ marginBottom: space.sm }} />
      <Button
        label="Request account deletion"
        icon="trash-outline"
        variant="outline"
        onPress={() => openLink(`mailto:${ministry.contact.email}?subject=${encodeURIComponent('Delete my AFM HUB account')}&body=${encodeURIComponent(`Please delete my account: ${session?.user.email ?? session?.user.phone ?? ''}`)}`)}
      />
      <Text style={{ color: t.textMuted, marginTop: space.sm, fontSize: 13 }}>
        To delete your account and data, email {ministry.contact.email}. We will confirm within 30 days.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  links: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  flex: { flex: 1 },
  hello: { fontFamily: fonts.serif, fontSize: 26, fontWeight: '700' },
});
