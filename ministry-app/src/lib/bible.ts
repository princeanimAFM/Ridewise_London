import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOOKS, DAILY_VERSES } from '@/content/bible';

/**
 * The in-app Bible. Each version is one JSON file on theafmchurch.org/bible. People download
 * the versions they want (More → Holy Bible → Versions) and they stay on the phone for
 * offline reading; opening a version that is not downloaded yet downloads it first.
 * Highlights, bookmarks, the chosen version, text size and last place are saved on the
 * phone only. Every version is public domain or openly licensed (eBible.org).
 */

export type TranslationId =
  | 'kjv' | 'bsb' | 'msb' | 'lsv' | 'web' | 'webbe' | 'asv' | 'webster' | 'bbe' | 'ylt' | 'dby' | 'gnv'
  | 'twi' | 'asante' | 'ewe' | 'hau' | 'lsg';
export type Translation = { short: string; name: string; language: string; group: 'English' | 'Ghanaian languages' | 'Other languages'; about: string; credit: string };

const PD = 'Public domain';
const BIBLICA = (title: string, years: string) => `${title} © ${years} Biblica, Inc. Used under the Creative Commons Attribution-ShareAlike 4.0 licence (CC BY-SA 4.0), via eBible.org.`;

export const TRANSLATIONS: Record<TranslationId, Translation> = {
  kjv: { short: 'KJV', name: 'King James Version', language: 'English', group: 'English', about: 'The classic 1611 English Bible.', credit: PD },
  bsb: { short: 'BSB', name: 'Berean Standard Bible', language: 'English', group: 'English', about: 'Clear, modern English (2023).', credit: PD },
  msb: { short: 'MSB', name: 'Majority Standard Bible', language: 'English', group: 'English', about: 'Modern English, sister to the BSB.', credit: PD },
  lsv: { short: 'LSV', name: 'Literal Standard Version', language: 'English', group: 'English', about: 'Modern, word-for-word English (2020).', credit: 'Literal Standard Version © 2020 Covenant Press. Used under the Creative Commons Attribution-ShareAlike 4.0 licence (CC BY-SA 4.0), via eBible.org.' },
  web: { short: 'WEB', name: 'World English Bible', language: 'English', group: 'English', about: 'Modern English, American spelling.', credit: `${PD}. “World English Bible” is a trademark of eBible.org.` },
  webbe: { short: 'WEB-UK', name: 'World English Bible (British)', language: 'English', group: 'English', about: 'Modern English, British spelling.', credit: `${PD}. “World English Bible” is a trademark of eBible.org.` },
  asv: { short: 'ASV', name: 'American Standard Version', language: 'English', group: 'English', about: 'Formal revision of the KJV (1901).', credit: PD },
  webster: { short: 'WBS', name: 'Webster Bible (1833)', language: 'English', group: 'English', about: 'The KJV with updated wording.', credit: PD },
  bbe: { short: 'BBE', name: 'Bible in Basic English', language: 'English', group: 'English', about: 'Simple English, easy to read.', credit: PD },
  ylt: { short: 'YLT', name: "Young's Literal Translation", language: 'English', group: 'English', about: 'Word-for-word, for study.', credit: PD },
  dby: { short: 'DBY', name: 'Darby Translation', language: 'English', group: 'English', about: 'Literal translation (1890).', credit: PD },
  gnv: { short: 'GNV', name: 'Geneva Bible 1599', language: 'English', group: 'English', about: 'The Reformation Bible, original spelling.', credit: PD },
  twi: { short: 'TWI', name: 'Akuapem Twi (Nkwa Asɛm)', language: 'Akuapem Twi', group: 'Ghanaian languages', about: 'Twerɛ Kronkron no wɔ Akuapem Twi mu.', credit: BIBLICA('Akuapem Twi Nkwa Asɛm™', '1996, 2020') },
  asante: { short: 'ASANTE', name: 'Asante Twi (Nkwa Asɛm)', language: 'Asante Twi', group: 'Ghanaian languages', about: 'Twerɛ Kronkron no wɔ Asante Twi mu.', credit: BIBLICA('Asante Twi Nkwa Asɛm™', '1996, 2020') },
  ewe: { short: 'EWE', name: 'Eʋegbe (Agbenya La)', language: 'Ewe', group: 'Ghanaian languages', about: 'Biblia le Eʋegbe me.', credit: BIBLICA('Agbenya La™', '1988, 2006, 2020') },
  hau: { short: 'HAU', name: 'Hausa (Sabon Rai Don Kowa)', language: 'Hausa', group: 'Other languages', about: 'Littafi Mai Tsarki a Hausa.', credit: BIBLICA('Littafi Mai Tsarki, Sabon Rai Don Kowa™', '2009, 2020') },
  lsg: { short: 'LSG', name: 'Louis Segond 1910', language: 'Français', group: 'Other languages', about: 'La Bible en français.', credit: PD },
};
export const TRANSLATION_IDS = Object.keys(TRANSLATIONS) as TranslationId[];
/** Rough sizes, for the download screen. */
export const DOWNLOAD_SIZE = '1.2 MB download · 4 MB on your phone';

const SOURCE = 'https://theafmchurch.org/bible';

type BibleData = { books: { id: string; name: string; chapters: string[][] }[] };

// ---------- Downloads and offline copies ----------

const loaded: Partial<Record<TranslationId, BibleData>> = {};
const pending: Partial<Record<TranslationId, Promise<BibleData>>> = {};

/** 'ready' = on the phone (or, on the web, loaded this visit). */
export type DownloadState = 'none' | 'downloading' | 'ready' | 'error';
let downloads: Partial<Record<TranslationId, DownloadState>> = {};
const downloadListeners = new Set<() => void>();
const setDownload = (id: TranslationId, state: DownloadState) => {
  downloads = { ...downloads, [id]: state };
  downloadListeners.forEach((l) => l());
};

async function offlineFile(id: TranslationId) {
  if (Platform.OS === 'web') return null;
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, 'bible');
    if (!dir.exists) dir.create({ intermediates: true });
    return new File(dir, `${id}.json`);
  } catch {
    return null; // app builds without the file module: download each time instead
  }
}

/** Phones can keep Bibles offline; the website reads them online. */
export const canKeepOffline = Platform.OS !== 'web';

// Which versions are already on the phone.
(async () => {
  for (const id of TRANSLATION_IDS) {
    const f = await offlineFile(id);
    if (f?.exists) downloads[id] = 'ready';
  }
  downloadListeners.forEach((l) => l());
})().catch(() => {});

async function fetchBible(id: TranslationId): Promise<BibleData> {
  const file = await offlineFile(id);
  if (file?.exists) {
    try {
      return JSON.parse(await file.text()) as BibleData;
    } catch {
      file.delete();
    }
  }
  setDownload(id, 'downloading');
  try {
    const res = await fetch(`${SOURCE}/${id}.json`);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const text = await res.text();
    const data = JSON.parse(text) as BibleData;
    if (data.books?.length !== 66) throw new Error('The Bible download was incomplete.');
    try {
      file?.write(text);
    } catch {}
    setDownload(id, 'ready');
    return data;
  } catch (e) {
    setDownload(id, 'error');
    throw e;
  }
}

export function loadBible(id: TranslationId): Promise<BibleData> {
  if (loaded[id]) return Promise.resolve(loaded[id]!);
  pending[id] ??= fetchBible(id)
    .then((d) => (loaded[id] = d))
    .finally(() => delete pending[id]);
  return pending[id]!;
}

/** Downloads a version for offline reading (no-op if it is already on the phone). */
export const downloadBible = (id: TranslationId) => loadBible(id).then(() => undefined);

/** Removes a version from the phone to free space. */
export async function deleteBible(id: TranslationId) {
  delete loaded[id];
  const f = await offlineFile(id);
  try {
    if (f?.exists) f.delete();
  } catch {}
  setDownload(id, 'none');
}

export function useDownloads(): Partial<Record<TranslationId, DownloadState>> {
  return useSyncExternalStore(
    (l) => {
      downloadListeners.add(l);
      return () => downloadListeners.delete(l);
    },
    () => downloads,
    () => downloads,
  );
}

/** The text of one version; downloads it the first time. */
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
      .catch(() => live && setError('Could not download this Bible version. Check your internet connection and try again.'));
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
    if (!TRANSLATIONS[prefs.translation]) prefs.translation = 'kjv';
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

/** A book's name, in the version's own language when that version is loaded (Yohane, Jean…). */
export const bookName = (book: number, id: TranslationId = prefs.translation) => loaded[id]?.books[book]?.name ?? BOOKS[book][1];
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

const norm = (s: string) => (s.normalize ? s.normalize('NFD') : s).replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ɛ/g, 'e').replace(/ɔ/g, 'o').replace(/[^a-z0-9]/g, '');
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
  // English names first, then the open version's own names (e.g. "Yohane 3:16", "Jean 3:16").
  const local = loaded[prefs.translation]?.books.map((b) => norm(b.name)) ?? [];
  for (const names of [BOOKS.map((b) => norm(b[1])), local]) {
    const exact = names.indexOf(target);
    if (exact >= 0) return exact;
  }
  for (const names of [BOOKS.map((b) => norm(b[1])), local]) {
    const i = names.findIndex((n) => n.startsWith(target));
    if (i >= 0) return i;
  }
  return -1;
}

/** "John 3:16", "1 Cor 13", "Ps 23:1-4" → a place to open. Null when the text is not a reference. */
export function parseReference(text: string): { book: number; chapter: number; verse?: number } | null {
  const m = /^\s*(.+?)\s*(\d+)(?:\s*[:.]\s*(\d+))?(?:\s*-\s*\d+)?\s*$/.exec(text);
  if (!m || !/[^\d\s]/.test(m[1])) return null;
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
