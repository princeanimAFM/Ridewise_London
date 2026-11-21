import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Bible study data files (Hebrew & Greek, cross-references, dictionary, commentary) on
 * theafmchurch.org/bible: each is downloaded the first time someone uses it and kept on the phone.
 */
const SOURCE = 'https://theafmchurch.org/bible';

async function offlineFile(name: string) {
  if (Platform.OS === 'web') return null;
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, 'bible');
    if (!dir.exists) dir.create({ intermediates: true });
    return new File(dir, name);
  } catch {
    return null; // builds without the file module download each time instead
  }
}

/** One data file: from the phone if it is there, otherwise downloaded and kept. */
export async function studyFile<T>(name: string): Promise<T> {
  const file = await offlineFile(name);
  if (file?.exists) {
    try {
      return JSON.parse(await file.text()) as T;
    } catch {
      file.delete();
    }
  }
  // One quiet retry: a dropped connection on mobile data shouldn't show an error.
  const res = await fetch(`${SOURCE}/${name}`).catch(() => fetch(`${SOURCE}/${name}`));
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const text = await res.text();
  const data = JSON.parse(text) as T;
  try {
    file?.write(text);
  } catch {}
  return data;
}

/** Loads once and shares the result; a failed load can be tried again. */
export function loader<T>(load: () => Promise<T>) {
  let value: T | undefined;
  let pending: Promise<T> | undefined;
  const get = () => {
    if (value) return Promise.resolve(value);
    pending ??= load().then((v) => (value = v)).finally(() => (pending = undefined));
    return pending;
  };
  /** The data, downloaded the first time `enabled` is true. */
  const use = (enabled = true, failText = 'Could not download this. Check your internet connection and try again.') => {
    const [data, setData] = useState<T | undefined>(value);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
      if (!enabled) return;
      let live = true;
      get().then((d) => live && setData(d)).catch(() => live && setError(failText));
      return () => {
        live = false;
      };
    }, [enabled, attempt, failText]);
    const retry = useCallback(() => { setError(''); setAttempt((a) => a + 1); }, []);
    return { data, error, loading: enabled && !data && !error, retry };
  };
  return { get, use };
}
