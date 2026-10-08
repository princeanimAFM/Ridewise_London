import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ministry } from '@/content/ministry';
import { useAuth } from '@/lib/auth';
import { friendlyError, supabase } from '@/lib/supabase';
import { BackendComingSoon } from '@/components/ComingSoon';
import { Field, Notice, Toggle } from '@/components/form';
import { PhotoHero } from '@/components/PhotoHero';
import { Body, Button, Screen } from '@/components/ui';
import { Text, StyleSheet } from 'react-native';
import { fonts, radius, space, useTheme } from '@/theme';

export default function Subscribe() {
  const t = useTheme();
  const { session, profile } = useAuth();
  const [first, setFirst] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [byEmail, setByEmail] = useState(true);
  const [bySms, setBySms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Prefill from the signed-in account and any existing subscription.
  useEffect(() => {
    if (!supabase || !session) return;
    setFirst((f) => f || profile?.first_name || '');
    setEmail((e) => e || session.user.email || '');
    supabase
      .from('subscribers')
      .select('first_name, email, phone, email_opt_in, sms_opt_in')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setFirst(data.first_name ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setByEmail(!!data.email_opt_in);
        setBySms(!!data.sms_opt_in);
      });
  }, [session, profile?.first_name]);

  if (!supabase) return <BackendComingSoon feature="Newsletter" />;

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (!first.trim()) throw new Error('Please enter your first name so we can greet you.');
      if (!byEmail && !bySms) throw new Error('Choose email, text messages, or both.');
      if (byEmail && !email.trim()) throw new Error('Enter your email address, or turn off email.');
      if (bySms && !phone.trim()) throw new Error('Enter your mobile number, or turn off text messages.');
      const { error } = await supabase!.rpc('subscribe', {
        p_first_name: first.trim(),
        p_email: email.trim() || null,
        p_phone: phone.trim() || null,
        p_email_opt_in: byEmail,
        p_sms_opt_in: bySms,
      });
      if (error) throw error;
      setDone(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <PhotoHero source={ministry.photos.home} height={220} position="top" style={styles.hero}>
        <Text style={[styles.kicker, { color: t.gold }]}>STAY CONNECTED</Text>
        <Text style={styles.title}>The AFM Newsletter</Text>
        <Text style={styles.sub}>Announcements, flyers and upcoming programmes</Text>
      </PhotoHero>

      {done ? (
        <>
          <Notice kind="success">
            Thank you, {first.trim()}! You're subscribed. We'll send announcements {byEmail && bySms ? 'by email and text message' : byEmail ? 'by email' : 'by text message'}.
          </Notice>
          <Button label="See announcements" icon="calendar-outline" onPress={() => router.replace('/announcements')} />
        </>
      ) : (
        <>
          <Body muted style={{ marginBottom: space.md }}>
            We'll greet you by name and only send ministry announcements. You can unsubscribe with one tap at any time.
          </Body>
          {!!error && <Notice kind="error">{error}</Notice>}
          <Field label="First name" value={first} onChangeText={setFirst} autoComplete="given-name" textContentType="givenName" />
          <Toggle label="By email" value={byEmail} onValueChange={setByEmail} />
          {byEmail && <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />}
          <Toggle label="By text message" hint="Standard message rates may apply" value={bySms} onValueChange={setBySms} />
          {bySms && (
            <Field label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+233201234567" hint="Include your country code." />
          )}
          <Button label={busy ? 'Subscribing…' : 'Subscribe'} icon="mail-open-outline" variant="gold" onPress={submit} style={{ marginTop: space.sm }} />
          <Text style={{ color: t.textMuted, fontSize: 13, marginTop: space.md }}>
            By subscribing you agree to receive announcements from {ministry.name}. See our Privacy Policy in More.
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, marginBottom: space.md },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 26, fontWeight: '700', marginTop: 2 },
  sub: { color: '#DCE8DC', marginTop: 4 },
});
