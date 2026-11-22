import { supabase } from './supabase';

/**
 * Two-step sign-in for admins: a code from an authenticator app (Supabase's TOTP factor). The database gives admin powers
 * only to a sign-in that passed it ("aal2"), or, until `until`, to an admin who hasn't set it up yet.
 */
export type TwoStep = {
  /** 'aal2' once this sign-in passed the second step. */
  level: string | null;
  /** The authenticator app already set up, if any. */
  factorId: string | null;
  /** When admins without it lose their admin powers. */
  until: string | null;
};

export async function getTwoStep(): Promise<TwoStep> {
  if (!supabase) return { level: null, factorId: null, until: null };
  // the factor list comes fresh from the server; the copy kept with the session can be out of date
  const [aal, factors, until] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
    supabase.rpc('second_step_from'),
  ]);
  if (aal.error) throw aal.error;
  if (factors.error) throw factors.error;
  return {
    level: aal.data.currentLevel,
    factorId: factors.data.totp[0]?.id ?? null,
    until: typeof until.data === 'string' ? until.data : null,
  };
}

export type NewKey = { id: string; secret: string; uri: string; qr: string | null };

/** Starts setting up the app: clears a set-up that was started but not finished, then makes a new key. */
export async function startTwoStep(): Promise<NewKey> {
  if (!supabase) throw new Error('Accounts are not set up yet.');
  const list = await supabase.auth.mfa.listFactors();
  if (list.error) throw list.error;
  for (const f of list.data.all) {
    if (f.factor_type === 'totp' && f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'AFM HUB',
    friendlyName: `AFM HUB ${new Date().toISOString().slice(0, 16)}`,
  });
  if (error) throw error;
  const svg = String(data.totp.qr_code ?? '').replace(/^data:image\/svg\+xml;utf-8,/, '');
  return { id: data.id, secret: data.totp.secret, uri: data.totp.uri, qr: svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : null };
}

/** Checks a code from the app. On success the sign-in becomes "aal2" and the app's sign-in listeners refresh. */
export async function verifyTwoStep(factorId: string, code: string) {
  if (!supabase) throw new Error('Accounts are not set up yet.');
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) throw error;
}

/** The key in groups of four, easier to type. */
export const spacedKey = (secret: string) => secret.replace(/(.{4})/g, '$1 ').trim();

export const AUTHENTICATOR = {
  android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2',
  ios: 'https://apps.apple.com/app/google-authenticator/id388497605',
};
