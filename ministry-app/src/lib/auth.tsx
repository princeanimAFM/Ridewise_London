import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Profile = { first_name: string | null; last_name: string | null; phone: string | null; is_admin: boolean };

type AuthContext = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthContext | null>(null);

WebBrowser.maybeCompleteAuthSession();

// The Google redirect can reach both signInWithGoogle and the auth-callback screen;
// a code can only be exchanged once, so share one exchange per code.
const exchanges = new Map<string, Promise<void>>();
export function completeGoogleSignIn(code: string) {
  if (!supabase) return Promise.resolve();
  let p = exchanges.get(code);
  if (!p) {
    p = supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) throw error;
    });
    exchanges.set(code, p);
  }
  return p;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!supabase || !s) return setProfile(null);
    const { data } = await supabase.from('profiles').select('first_name, last_name, phone, is_admin').eq('id', s.user.id).maybeSingle();
    setProfile((data as Profile) ?? { first_name: null, last_name: null, phone: null, is_admin: false });
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session).finally(() => setLoading(false));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      loadProfile(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Accounts are not set up yet.');
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
      if (error) throw error;
      return;
    }
    const redirectTo = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return; // cancelled
    const { queryParams } = Linking.parse(result.url);
    const code = typeof queryParams?.code === 'string' ? queryParams.code : undefined;
    const errorDescription = typeof queryParams?.error_description === 'string' ? queryParams.error_description : undefined;
    if (errorDescription) throw new Error(errorDescription);
    if (!code) throw new Error('Google sign-in did not complete. Please try again.');
    await completeGoogleSignIn(code);
  };

  const value: AuthContext = {
    session,
    profile,
    loading,
    refreshProfile: () => loadProfile(session),
    signInWithGoogle,
    signOut: async () => {
      await supabase?.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** The name to greet the user by. */
export function displayName(profile: Profile | null, session: Session | null) {
  return profile?.first_name || (session?.user.user_metadata?.first_name as string | undefined) || session?.user.email?.split('@')[0] || 'Friend';
}
