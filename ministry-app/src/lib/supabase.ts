import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ministry } from '@/content/ministry';

const { supabaseUrl, supabaseAnonKey } = ministry.backend;

/** True once the Supabase URL and key are filled in (src/content/ministry.ts). */
export const backendReady = !!supabaseUrl && !!supabaseAnonKey;

export const supabase: SupabaseClient | null = backendReady
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  : null;

// Keep the sign-in fresh only while the app is open.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export function flyerUrl(path?: string | null) {
  return path ? `${supabaseUrl}/storage/v1/object/public/flyers/${path}` : undefined;
}

/** Turns Supabase error messages into friendlier wording. */
export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/invalid login credentials/i.test(msg)) return 'That email and password do not match. Check them, or reset your password.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first with the code we sent you.';
  if (/user already registered/i.test(msg)) return 'An account with this email already exists. Sign in instead.';
  if (/token has expired|otp.*expired|invalid.*otp|token.*invalid/i.test(msg)) return 'That code is wrong or has expired. Request a new one.';
  if (/password should be at least/i.test(msg)) return 'Your password needs to be at least 8 characters.';
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.';
  if (/network|fetch/i.test(msg)) return 'Could not connect. Check your internet connection.';
  return msg;
}

type PickedFile = { uri: string; mimeType?: string | null; fileName?: string | null; name?: string | null };

/** Uploads a photo (expo-image-picker) or file (expo-document-picker). Returns its storage path. */
export async function uploadPickedImage(bucket: string, folder: string, asset: PickedFile) {
  if (!supabase) throw new Error('The backend is not connected.');
  const original = asset.fileName || asset.name || '';
  const ext = ((original.includes('.') ? original.split('.').pop() : '') || asset.mimeType?.split('/').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const path = `${folder}/${Date.now()}.${ext}`;
  const bytes = await (await fetch(asset.uri)).arrayBuffer();
  const contentType = asset.mimeType || (ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`);
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType, upsert: true });
  if (error) throw error;
  return path;
}

export function storageUrl(bucket: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
