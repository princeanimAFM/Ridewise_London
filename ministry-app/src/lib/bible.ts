import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOOKS, DAILY_VERSES } from '@/content/bible';

/**
 * The in-app Bible. Each translation is one JSON file on theafmchurch.org, downloaded the
 * first time it is opened and kept on the phone, so reading works offline after that.
 * Highlights, bookmarks, the chosen translation, text size and last place are saved on the
 * phone only.
 */

export type TranslationId = 'kjv' | 'web';
export const TRANSLATIONS: Record<TranslationId, { short: string; name: string }> = {
  kjv: { short: 'KJV', name: 'King James Version' },
  web: { short: 'WEB', name: 'World English Bible' },
};
const SOURCE = 'https://theafmchurch.org/bible';

type BibleData = { books: { id: string; name: string; chapters: string[][] }[] };

// ---------- Text download and offline copy ----------

const loaded: Partial<Record<TranslationId, BibleData>> = {};
const pending: Partial<Record<TranslationId, Promise<BibleData>>> = {};

async function offlineFile(id: TranslationId) {
  if (Platform.OS === 'web') return null;
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, 'bible');
    if (!dir.exists) dir.create({ intermediates: true });
    return new File(dir, `${id}.json`);
  } catch {
    return null; // older app builds without the file module: download each time instead
  }
}

async function fetchBible(id: TranslationId): Promise<BibleData> {
  const file = await offlineFile(id);
  if (file?.exists) {
    try {
      return JSON.parse(await file.text()) as BibleData;
    } catch {
      file.delete();
    }
  }
  const res = await fetch(`${SOURCE}/${id}.json`);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const text = await res.text();
  const data = JSON.parse(text) as BibleData;
  if (data.books?.length !== 66) throw new Error('The Bible download was incomplete.');
  try {
    file?.write(text);
  } catch {}
  return data;
}

export function loadBible(id: TranslationId): Promise<BibleData> {
  if (loaded[id]) return Promise.resolve(loaded[id]!);
  pending[id] ??= fetchBible(id)
    .then((d) => (loaded[id] = d))
    .finally(() => delete pending[id]);
  return pending[id]!;
}

/** The text of one translation; downloads it the first time. */
export function useBible(id: TranslationId) {
  const [data, setData] = useState<BibleData | undefined>(loaded[id]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setError('');
    setData(loaded[id]);
    loadBible(id)
      .then((d) => live && setData(d))
      .catch(() => live && setError('Could not download the Bible. Check your internet connection and try again.'));
    return () => {
      live = false;
    };
  }, [id, attempt]);
  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { data, error, loading: !data && !error, retry };
}

// ---------- Saved settings: translation, text size, last place ----------

type Prefs = { translation: TranslationId; size: number; last?: { book: number; chapter: number } };
const PREFS_KEY = 'afm-bible-prefs';
const MARKS_KEY = 'afm-bible-marks';
let prefs: Prefs = { translation: 'kjv', size: 18 };

/** A highlight colour name, a bookmark, or both, keyed by "book.chapter.verse" (same in every translation). */
export type Mark = { colour?: HighlightColour; bookmark?: boolean; at: number };
export type HighlightColour = 'yellow' | 'green' | 'blue' | 'pink';
export const HIGHLIGHTS: Record<HighlightColour, { light: string; dark: string }> = {
  yellow: { light: '#FFF1A8', dark: '#5C5016' },
  green: { light: '#CDEFC9', dark: '#244A22' },
  blue: { light: '#CFE3FF', dark: '#1D3657' },
  pink: { light: '#FAD3E3', dark: '#55253A' },
};
let marks: Record<string, Mark> = {};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

AsyncStorage.multiGet([PREFS_KEY, MARKS_KEY])
  .then(([[, p], [, m]]) => {
    if (p) prefs = { ...prefs, ...(JSON.parse(p) as Partial<Prefs>) };
    if (m) marks = JSON.parse(m);
    emit();
  })
  .catch(() => {});

export function setBiblePrefs(change: Partial<Prefs>) {
  prefs = { ...prefs, ...change };
  emit();
  AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
}

export function useBiblePrefs(): Prefs {
  return useSyncExternalStore(subscribe, () => prefs, () => prefs);
}

export const verseKey = (book: number, chapter: number, verse: number) => `${book}.${chapter}.${verse}`;

export function useMarks(): Record<string, Mark> {
  return useSyncExternalStore(subscribe, () => marks, () => marks);
}

/** Applies a change to several verses at once. undefined removes that part of the mark. */
export function updateMarks(keys: string[], change: { colour?: HighlightColour | null; bookmark?: boolean }) {
  const next = { ...marks };
  for (const k of keys) {
    const m: Mark = { ...next[k], at: Date.now() };
    if (change.colour !== undefined) m.colour = change.colour ?? undefined;
    if (change.bookmark !== undefined) m.bookmark = change.bookmark || undefined;
    if (!m.colour && !m.bookmark) delete next[k];
    else next[k] = m;
  }
  marks = next;
  emit();
  AsyncStorage.setItem(MARKS_KEY, JSON.stringify(marks)).catch(() => {});
}

// ---------- References and search ----------

export const bookName = (book: number) => BOOKS[book][1];
export const reference = (book: number, chapter: number, verses?: number[]) => {
  if (!verses?.length) return `${bookName(book)} ${chapter}`;
  const v = [...verses].sort((a, b) => a - b);
  const ranges: string[] = [];
  for (let i = 0; i < v.length; i++) {
    let j = i;
    while (j + 1 < v.length && v[j + 1] === v[j] + 1) j++;
    ranges.push(i === j ? `${v[i]}` : `${v[i]}-${v[j]}`);
    i = j;
  }
  return `${bookName(book)} ${chapter}:${ranges.join(',')}`;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const ALIASES: Record<string, string> = {
  psalm: 'psalms', ps: 'psalms', song: 'songofsolomon', songofsongs: 'songofsolomon', canticles: 'songofsolomon',
  jn: 'john', mk: 'mark', mt: 'matthew', lk: 'luke', rev: 'revelation', revelations: 'revelation', phil: 'philippians',
  phm: 'philemon', jas: 'james', jud: 'judges', judg: 'judges', eccl: 'ecclesiastes', qoheleth: 'ecclesiastes',
};

/** Finds the book a typed name refers to: full names, common short forms and prefixes ("1 cor", "gen", "ps"). */
export function findBook(text: string): number {
  const q = norm(text.replace(/^(i{1,3})\s+(?=[a-z])/i, (m) => String(m.trim().length)));
  if (!q) return -1;
  const target = ALIASES[q] ?? q;
  const names = BOOKS.map((b) => norm(b[1]));
  const exact = names.indexOf(target);
  if (exact >= 0) return exact;
  return names.findIndex((n) => n.startsWith(target));
}

/** "John 3:16", "1 Cor 13", "Ps 23:1-4" → a place to open. Null when the text is not a reference. */
export function parseReference(text: string): { book: number; chapter: number; verse?: number } | null {
  const m = /^\s*((?:[1-3]|i{1,3})?\s*[a-z][a-z .]*?)\s*(\d+)(?:\s*[:.]\s*(\d+))?(?:\s*-\s*\d+)?\s*$/i.exec(text);
  if (!m) return null;
  const book = findBook(m[1]);
  if (book < 0) return null;
  const chapter = Math.min(Number(m[2]), BOOKS[book][2]);
  return { book, chapter: Math.max(chapter, 1), verse: m[3] ? Number(m[3]) : undefined };
}

export type Hit = { book: number; chapter: number; verse: number; text: string };

/** Verses containing every word typed (in any order), in Bible order. */
export function searchBible(data: BibleData, query: string, limit = 300): { hits: Hit[]; more: boolean } {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  const hits: Hit[] = [];
  if (!words.length) return { hits, more: false };
  for (let b = 0; b < data.books.length; b++) {
    const chapters = data.books[b].chapters;
    for (let c = 0; c < chapters.length; c++) {
      const verses = chapters[c];
      for (let v = 0; v < verses.length; v++) {
        const text = verses[v];
        const lower = text.toLowerCase();
        if (words.every((w) => lower.includes(w))) {
          if (hits.length === limit) return { hits, more: true };
          hits.push({ book: b, chapter: c + 1, verse: v + 1, text });
        }
      }
    }
  }
  return { hits, more: false };
}

// ---------- Verse of the day ----------

/** The same verse all day, changing at midnight (phone time). */
export function verseOfTheDay(date = new Date()) {
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);
  const [book, chapter, verse, text] = DAILY_VERSES[((day % DAILY_VERSES.length) + DAILY_VERSES.length) % DAILY_VERSES.length];
  return { book, chapter, verse, text, ref: reference(book, chapter, [verse]) };
}
