import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { friendlyError, supabase } from '@/lib/supabase';
import { BackendComingSoon } from '@/components/ComingSoon';
import { Field, Notice } from '@/components/form';
import { Body, Button, Screen, Title } from '@/components/ui';
import { space } from '@/theme';

/** Reset (or change) a password with a code sent by email. */
export default function Forgot() {
  const { session } = useAuth();
  const [email, setEmail] = useState(session?.user.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

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

  const sendCode = () =>
    run(async () => {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) throw new Error('Please enter the email you signed up with.');
      const { error } = await supabase!.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setStep('reset');
    });

  const reset = () =>
    run(async () => {
      if (password.length < 8) throw new Error('Your new password needs to be at least 8 characters.');
      const { error } = await supabase!.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
      if (error) throw error;
      const { error: updateError } = await supabase!.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    });

  return (
    <Screen>
      <Title>{session ? 'Change password' : 'Reset your password'}</Title>
      {!!error && <Notice kind="error">{error}</Notice>}
      {done ? (
        <>
          <Notice kind="success">Your password has been updated and you are signed in.</Notice>
          <Button label="Go to my account" onPress={() => router.replace('/account')} />
        </>
      ) : step === 'email' ? (
        <>
          <Body muted style={{ marginBottom: space.md }}>We'll email you a 6-digit code to set a new password.</Body>
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
          <Button label={busy ? 'Sending…' : 'Email me a code'} icon="mail-outline" onPress={sendCode} />
        </>
      ) : (
        <>
          <Body muted style={{ marginBottom: space.md }}>Enter the code we sent to {email.trim()} and choose a new password.</Body>
          <Field label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} />
          <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" hint="At least 8 characters." />
          <Button label={busy ? 'Saving…' : 'Set new password'} icon="key-outline" onPress={reset} />
          <Button label="Send a new code" variant="outline" onPress={sendCode} style={{ marginTop: space.sm }} />
        </>
      )}
    </Screen>
  );
}
