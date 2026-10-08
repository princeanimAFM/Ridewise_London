import { useState } from 'react';
import { router } from 'expo-router';
import { friendlyError, supabase } from '@/lib/supabase';
import { BackendComingSoon } from '@/components/ComingSoon';
import { Field, Notice, Toggle } from '@/components/form';
import { Body, Button, Screen, Title } from '@/components/ui';
import { space } from '@/theme';

export default function SignUp() {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newsletter, setNewsletter] = useState(true);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!supabase) return <BackendComingSoon feature="Accounts" />;

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

  const finish = async () => {
    if (newsletter) await supabase!.rpc('subscribe', { p_first_name: first.trim(), p_email: email.trim(), p_email_opt_in: true, p_sms_opt_in: false });
    router.replace('/account');
  };

  const create = () =>
    run(async () => {
      if (!first.trim()) throw new Error('Please enter your first name.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) throw new Error('Please enter a valid email address.');
      if (password.length < 8) throw new Error('Your password needs to be at least 8 characters.');
      const { data, error } = await supabase!.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { first_name: first.trim(), last_name: last.trim() } },
      });
      if (error) throw error;
      if (data.session) await finish();
      else setStep('code');
    });

  const verify = () =>
    run(async () => {
      const { error } = await supabase!.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
      if (error) throw error;
      await finish();
    });

  const resend = () =>
    run(async () => {
      const { error } = await supabase!.auth.resend({ type: 'signup', email: email.trim() });
      if (error) throw error;
    });

  return (
    <Screen>
      <Title>{step === 'details' ? 'Create your account' : 'Confirm your email'}</Title>
      {!!error && <Notice kind="error">{error}</Notice>}
      {step === 'details' ? (
        <>
          <Field label="First name" value={first} onChangeText={setFirst} autoComplete="given-name" textContentType="givenName" />
          <Field label="Last name (optional)" value={last} onChangeText={setLast} autoComplete="family-name" textContentType="familyName" />
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" hint="At least 8 characters." />
          <Toggle label="Send me the AFM newsletter" hint="Announcements and upcoming programmes by email" value={newsletter} onValueChange={setNewsletter} />
          <Button label={busy ? 'Creating…' : 'Create account'} icon="person-add-outline" onPress={create} style={{ marginTop: space.sm }} />
        </>
      ) : (
        <>
          <Body muted style={{ marginBottom: space.md }}>
            We emailed a code to {email.trim()}. Enter it below to confirm your account.
          </Body>
          <Field label="Code from the email" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, ''))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={10} placeholder="e.g. 12345678" />
          <Button label={busy ? 'Checking…' : 'Confirm'} icon="checkmark-circle-outline" onPress={verify} />
          <Button label="Email me a new code" variant="outline" onPress={resend} style={{ marginTop: space.sm }} />
        </>
      )}
    </Screen>
  );
}
