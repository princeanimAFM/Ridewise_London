import { ReactNode, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useAuth } from '@/lib/auth';
import { friendlyError, supabase } from '@/lib/supabase';
import { AUTHENTICATOR, getTwoStep, NewKey, spacedKey, startTwoStep, TwoStep, verifyTwoStep } from '@/lib/twoStep';
import { Field, Notice } from './form';
import { Body, Button, Card, Screen, Title } from './ui';
import { space, useTheme } from '@/theme';

// "Not now" lasts until the app is closed, so it isn't asked again on every admin screen.
let laterThisTime = false;

const dayText = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : 'soon';

/**
 * Admin screens: an admin first passes two-step sign-in (a code from an authenticator app), or sets it up.
 * Anyone who isn't an admin goes straight through (the screen itself says what they can't do).
 */
export function SecondStep({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  const { session, profile } = useAuth();
  const admin = !!supabase && !!session && !!profile?.is_admin;
  const [state, setState] = useState<(TwoStep & { required: boolean }) | null>(null);
  const [error, setError] = useState('');
  const [later, setLater] = useState(laterThisTime);

  const load = useCallback(
    () =>
      getTwoStep().then(
        (s) => {
          // past the date (or no date known): setting it up is the only way into the admin screens
          setState({ ...s, required: !s.until || new Date(s.until).getTime() <= Date.now() });
          setError('');
        },
        (e) => setError(friendlyError(e)),
      ),
    [],
  );
  const check = () => {
    setError('');
    load();
  };
  useEffect(() => {
    if (admin) load();
  }, [admin, session?.access_token, load]);

  if (!admin) return <>{children}</>;
  if (error) {
    return (
      <Screen>
        <Title>{title}</Title>
        <Notice kind="error">{error}</Notice>
        <Button label="Try again" icon="refresh" onPress={check} />
      </Screen>
    );
  }
  if (!state) return <Screen><ActivityIndicator color={t.accent} style={{ marginTop: space.xl }} /></Screen>;
  if (state.factorId && state.level !== 'aal2') return <TwoStepCode factorId={state.factorId} onDone={check} />;
  if (!state.factorId) {
    if (state.required || !later) {
      return (
        <TwoStepSetup
          required={state.required}
          until={state.until}
          onDone={check}
          onLater={() => {
            laterThisTime = true;
            setLater(true);
          }}
        />
      );
    }
  }
  return <>{children}</>;
}

/** The code from the authenticator app, after signing in. */
function TwoStepCode({ factorId, onDone }: { factorId: string; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = async () => {
    if (code.length !== 6) return setError('Type the 6 digits the app shows.');
    setBusy(true);
    setError('');
    try {
      await verifyTwoStep(factorId, code);
      onDone();
    } catch {
      setCode('');
      setError("That code didn't work. The code changes every 30 seconds: type the one showing now.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Title>One more step</Title>
      <Body muted style={{ marginBottom: space.md }}>
        Open your authenticator app (Google Authenticator or Microsoft Authenticator) and type the code it shows for AFM HUB.
      </Body>
      {!!error && <Notice kind="error">{error}</Notice>}
      <Field
        label="6-digit code from the app"
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        onSubmitEditing={go}
      />
      <Button label={busy ? 'Checking…' : 'Continue'} icon="shield-checkmark-outline" onPress={go} />
      <Body muted style={{ marginTop: space.lg }}>
        Lost your phone or deleted the app? Ask the person who looks after the app to reset your two-step sign-in, then set it up again.
      </Body>
    </Screen>
  );
}

/** Setting up the authenticator app. */
function TwoStepSetup({ required, until, onDone, onLater }: { required: boolean; until: string | null; onDone: () => void; onLater: () => void }) {
  const t = useTheme();
  const [key, setKey] = useState<NewKey | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    startTwoStep().then(setKey, (e) => setError(friendlyError(e)));
  }, []);

  const turnOn = async () => {
    if (!key) return;
    if (code.length !== 6) return setError('Type the 6 digits the app shows.');
    setBusy(true);
    setError('');
    try {
      await verifyTwoStep(key.id, code);
      onDone();
    } catch {
      setCode('');
      setError("That code didn't work. Check that you added AFM HUB in the app, then type the code showing now (it changes every 30 seconds).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>Protect your admin account</Title>
      <Body style={{ marginBottom: space.sm }}>
        Admins can send notifications to everyone and change what the app shows. With two-step sign-in you also type a code from an app on
        your phone, so no one else can use your admin powers, even if they get into your email.
      </Body>
      {required && <Notice kind="info">Admins need this to use the admin screens. It takes about 2 minutes, once.</Notice>}
      {!!error && <Notice kind="error">{error}</Notice>}

      <Card style={{ marginBottom: space.md, padding: space.md }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>1. Install a free authenticator app</Text>
        <Body muted style={{ marginVertical: space.xs }}>Google Authenticator or Microsoft Authenticator. Skip this if you already have one.</Body>
        {Platform.OS !== 'ios' && <Button label="Google Authenticator for Android" icon="logo-google-playstore" variant="outline" onPress={() => Linking.openURL(AUTHENTICATOR.android)} style={{ marginTop: space.xs }} />}
        {Platform.OS !== 'android' && <Button label="Google Authenticator for iPhone" icon="logo-apple-appstore" variant="outline" onPress={() => Linking.openURL(AUTHENTICATOR.ios)} style={{ marginTop: space.xs }} />}
      </Card>

      <Card style={{ marginBottom: space.md, padding: space.md }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>2. Add AFM HUB to the app</Text>
        {!key ? (
          !error && <ActivityIndicator color={t.accent} style={{ marginVertical: space.md }} />
        ) : (
          <View>
            {Platform.OS !== 'web' && (
              <Button label="Add to my authenticator app" icon="add-circle-outline" onPress={() => Linking.openURL(key.uri).catch(() => setError('No authenticator app opened. Copy the key below instead.'))} style={{ marginTop: space.sm }} />
            )}
            {Platform.OS === 'web' && key.qr && (
              <View style={{ alignItems: 'center', marginTop: space.sm }}>
                <Body muted>Scan this with the authenticator app on your phone:</Body>
                <Image source={{ uri: key.qr }} accessibilityLabel="QR code for the authenticator app" style={{ width: 200, height: 200, backgroundColor: '#fff', marginTop: space.sm }} />
              </View>
            )}
            <Body muted style={{ marginTop: space.sm }}>
              {Platform.OS === 'web' ? 'Or' : "If the button doesn't open the app:"} in the app tap +, choose “Enter a setup key”, paste the key and choose “Time based”. Your key:
            </Body>
            <Text selectable style={{ color: t.text, fontSize: 17, fontWeight: '600', letterSpacing: 1, marginTop: space.xs, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) }}>
              {spacedKey(key.secret)}
            </Text>
            <Button
              label={copied ? 'Key copied' : 'Copy key'}
              icon={copied ? 'checkmark' : 'copy-outline'}
              variant="outline"
              onPress={() => Clipboard.setStringAsync(key.secret).then(() => setCopied(true))}
              style={{ marginTop: space.sm }}
            />
          </View>
        )}
      </Card>

      <Card style={{ marginBottom: space.md, padding: space.md }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, marginBottom: space.sm }}>3. Type the code the app now shows</Text>
        <Field
          label="6-digit code from the app"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          onSubmitEditing={turnOn}
        />
        <Button label={busy ? 'Checking…' : 'Turn on two-step sign-in'} icon="shield-checkmark-outline" onPress={turnOn} />
      </Card>

      {!required && (
        <View style={{ alignItems: 'center', marginBottom: space.xl }}>
          <Button label="Not now" variant="outline" onPress={onLater} />
          <Body muted style={{ marginTop: space.sm, textAlign: 'center' }}>From {dayText(until)} you will need it to use the admin screens.</Body>
        </View>
      )}
    </Screen>
  );
}
