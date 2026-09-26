import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { useContent } from '@/lib/liveContent';
import { friendlyError } from '@/lib/supabase';
import { markWelcomeDone } from '@/lib/welcome';
import { Button } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/theme';

/** Shown the first time the app opens: sign in, create an account, or continue as a guest. */
export default function Welcome() {
  const ministry = useContent();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { session, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Signed in (here, or on the sign-in screens opened from here): go to the app.
  useEffect(() => {
    if (!session) return;
    markWelcomeDone();
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  }, [session]);

  const google = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const guest = () => {
    markWelcomeDone();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const src = typeof ministry.photos.home === 'string' ? { uri: ministry.photos.home } : ministry.photos.home;
  const logo = typeof ministry.logo === 'string' ? { uri: ministry.logo } : ministry.logo;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A1C12' }}>
      <Image source={src as never} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
      <LinearGradient colors={['rgba(10,28,18,0.05)', 'rgba(10,28,18,0.55)', 'rgba(10,28,18,0.97)']} locations={[0, 0.4, 0.75]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }]}>
        <View style={{ flex: 1 }} />
        <View style={styles.inner}>
          <Image source={logo as never} style={styles.logo} contentFit="cover" />
          <View style={[styles.pill, { borderColor: t.gold }]}>
            <Text style={[styles.pillText, { color: t.gold }]}>
              {ministry.themeOfTheYear.year} · {ministry.themeOfTheYear.title.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.kicker, { color: t.gold }]}>WELCOME TO</Text>
          <Text style={styles.title}>{ministry.name}</Text>
          <Text style={styles.sub}>
            Sign in to get announcements, the newsletter and a personal welcome from the AFM family.
          </Text>

          {!!error && <Text style={styles.error}>{error}</Text>}

          {ministry.backend.googleSignIn && (
            <Button label={busy ? 'Opening Google…' : 'Continue with Google'} icon="logo-google" variant="gold" onPress={google} style={styles.button} />
          )}
          <Button label="Sign in with email" icon="mail-outline" onPress={() => router.push('/account')} style={[styles.button, styles.light]} />
          <Button label="Create an account" icon="person-add-outline" variant="outline" color="#FFFFFF" onPress={() => router.push('/account/sign-up')} style={[styles.button, styles.outline]} />

          <Pressable onPress={guest} style={styles.guest} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.guestText}>Continue without an account</Text>
          </Pressable>
          {busy && <ActivityIndicator color={t.gold} />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: space.lg },
  inner: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  logo: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', marginBottom: space.md },
  pill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginBottom: space.md },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#FFFFFF', fontFamily: fonts.serif, fontSize: 38, fontWeight: '700', marginTop: 2 },
  sub: { color: '#DCE8DC', fontSize: 16, lineHeight: 23, marginTop: space.sm, marginBottom: space.lg },
  error: { color: '#FFB4AB', marginBottom: space.sm },
  button: { marginBottom: space.sm, borderRadius: radius.md, paddingVertical: 14 },
  light: { backgroundColor: '#2D6A3E', borderColor: '#2D6A3E' },
  outline: { borderColor: 'rgba(255,255,255,0.6)' },
  guest: { alignSelf: 'center', paddingVertical: space.md },
  guestText: { color: '#FFFFFF', fontWeight: '600', textDecorationLine: 'underline' },
});
