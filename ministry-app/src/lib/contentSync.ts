import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getOverrides, setOverrides, type ContentKey, type Overrides } from './liveContent';

const CACHE_KEY = 'afm:content:v1';
let started = false;
let lastFetch = 0;

/**
 * Loads the owner's edits: first the copy saved on the phone (works offline),
 * then the latest from the backend. Refreshes whenever the app comes back to
 * the foreground.
 */
export async function syncContent() {
  if (!started) {
    started = true;
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) setOverrides(JSON.parse(cached));
    } catch {}
    AppState.addEventListener('change', (state) => {
      if (state === 'active' && Date.now() - lastFetch > 60_000) fetchContent();
    });
  }
  await fetchContent();
}

async function fetchContent() {
  if (!supabase) return;
  lastFetch = Date.now();
  const { data, error } = await supabase.from('app_content').select('key, value');
  // Offline, or the backend isn't set up for this yet: keep what we have.
  if (error || !data) return;
  const next: Overrides = Object.fromEntries(data.map((r) => [r.key, r.value]));
  apply(next);
}

function apply(next: Overrides) {
  setOverrides(next);
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next)).catch(() => {});
}

/** Owner only: saves one area. It's live for everyone from their next app open. */
export async function saveContent(key: ContentKey, value: unknown) {
  if (!supabase) throw new Error('The backend is not connected.');
  const { error } = await supabase.from('app_content').upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
  apply({ ...getOverrides(), [key]: value });
}

/** Owner only: goes back to the content built into the app for one area. */
export async function resetContent(key: ContentKey) {
  if (!supabase) throw new Error('The backend is not connected.');
  const { error } = await supabase.from('app_content').delete().eq('key', key);
  if (error) throw error;
  const next = { ...getOverrides() };
  delete next[key];
  apply(next);
}
