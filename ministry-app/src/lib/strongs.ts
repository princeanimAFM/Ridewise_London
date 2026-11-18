import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Hebrew and Greek (Strong's numbers). Every word of the King James Version that carries a number, and
 * Strong's dictionaries of the Hebrew and Greek words. Two files on theafmchurch.org/bible (built by
 * scripts/build-strongs.py), downloaded the first time someone uses it and kept on the phone.
 *
 * Sources: KJV with Strong's numbers from eBible.org (public domain); Strong's Hebrew and Greek
 * dictionaries via Open Scriptures (CC BY-SA), from James Strong's 1890 dictionaries.
 */

const SOURCE = 'https://theafmchurch.org/bible';
export const STRONGS_SIZE = '2 MB download, once';
export const STRONGS_CREDIT =
  "Strong's numbers from the King James Version (eBible.org, public domain). Hebrew and Greek dictionaries by James Strong (1890), via Open Scriptures, licensed CC BY-SA.";

/** Book → chapter → verse → [word as printed in the KJV, number]. Hebrew numbers are positive, Greek negative. */
type Tags = [string, number][][][][];
/** "H2617" → [lemma, transliteration, pronunciation, definition, KJV renderings, derivation]. */
type Dict = Record<string, [string, string, string, string, string, string]>;
export type StrongsData = { tags: Tags; dict: Dict };

export type Entry = {
  id: string;
  language: 'Hebrew' | 'Greek';
  lemma: string;
  transliteration: string;
  pronunciation: string;
  definition: string;
  kjvRenderings: string;
  derivation: string;
};

/** 2617 → "H2617", -5485 → "G5485". */
export const strongsId = (n: number) => (n > 0 ? `H${n}` : `G${-n}`);
export const strongsNumber = (id: string) => (id[0] === 'G' ? -Number(id.slice(1)) : Number(id.slice(1)));

export function entry(data: StrongsData, id: string): Entry | null {
  const e = data.dict[id];
  if (!e) return null;
  return { id, language: id[0] === 'H' ? 'Hebrew' : 'Greek', lemma: e[0], transliteration: e[1], pronunciation: e[2], definition: e[3], kjvRenderings: e[4], derivation: e[5] };
}

/** The KJV words of a verse that have a Strong's number. */
export const verseWords = (data: StrongsData, book: number, chapter: number, verse: number) => data.tags[book]?.[chapter - 1]?.[verse - 1] ?? [];

// ---------- Where each Hebrew or Greek word is used ----------

export type Usage = {
  /** Times the word appears, and the verses (in Bible order) with the English word(s) used there. */
  occurrences: number;
  verses: { book: number; chapter: number; verse: number; words: string[] }[];
  byBook: number[];
  /** How the KJV translates it, most often first: "grace 130", "favour 6". */
  renderings: { word: string; count: number }[];
};

type Index = { byNumber: Map<number, number[]>; byWord: Map<string, Map<number, number>> };
const indexes = new WeakMap<StrongsData, Index>();
const tokens = (w: string) => w.toLowerCase().match(/[a-z]+/g) ?? [];

function indexOf(data: StrongsData): Index {
  const have = indexes.get(data);
  if (have) return have;
  const byNumber = new Map<number, number[]>(), byWord = new Map<string, Map<number, number>>();
  data.tags.forEach((chapters, b) =>
    chapters.forEach((verses, c) =>
      verses.forEach((words, v) => {
        const at = b * 1_000_000 + (c + 1) * 1000 + (v + 1);
        words.forEach(([w, n], i) => {
          const list = byNumber.get(n);
          if (list) list.push(at * 100 + i);
          else byNumber.set(n, [at * 100 + i]);
          for (const t of tokens(w)) {
            const m = byWord.get(t) ?? new Map<number, number>();
            m.set(n, (m.get(n) ?? 0) + 1);
            byWord.set(t, m);
          }
        });
      }),
    ),
  );
  const built = { byNumber, byWord };
  indexes.set(data, built);
  return built;
}

/** Every place a Hebrew or Greek word is used in the KJV, and how it is translated. */
export function usage(data: StrongsData, id: string): Usage {
  const list = indexOf(data).byNumber.get(strongsNumber(id)) ?? [];
  const byBook = new Array(66).fill(0) as number[];
  const verses: Usage['verses'] = [];
  const renderings = new Map<string, number>();
  for (const code of list) {
    const at = Math.floor(code / 100), i = code % 100;
    const book = Math.floor(at / 1_000_000), chapter = Math.floor((at % 1_000_000) / 1000), verse = at % 1000;
    const word = data.tags[book][chapter - 1][verse - 1][i][0];
    byBook[book]++;
    const last = verses[verses.length - 1];
    if (last && last.book === book && last.chapter === chapter && last.verse === verse) last.words.push(word);
    else verses.push({ book, chapter, verse, words: [word] });
    const r = word.toLowerCase();
    renderings.set(r, (renderings.get(r) ?? 0) + 1);
  }
  return {
    occurrences: list.length,
    verses,
    byBook,
    renderings: [...renderings].map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count || a.word.localeCompare(b.word)),
  };
}

/** The Hebrew and Greek words behind an English KJV word: "grace" → G5485 (130), H2580 (38). */
export function originalsOf(data: StrongsData, word: string): { id: string; count: number }[] {
  const m = indexOf(data).byWord.get(word.toLowerCase());
  if (!m) return [];
  return [...m].map(([n, count]) => ({ id: strongsId(n), count })).sort((a, b) => b.count - a.count);
}

// ---------- Download once, keep on the phone ----------

let loaded: StrongsData | undefined;
let pending: Promise<StrongsData> | undefined;

async function offlineFile(name: string) {
  if (Platform.OS === 'web') return null;
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, 'bible');
    if (!dir.exists) dir.create({ intermediates: true });
    return new File(dir, name);
  } catch {
    return null;
  }
}

async function fetchJson<T>(name: string): Promise<T> {
  const file = await offlineFile(name);
  if (file?.exists) {
    try {
      return JSON.parse(await file.text()) as T;
    } catch {
      file.delete();
    }
  }
  const res = await fetch(`${SOURCE}/${name}`).catch(() => fetch(`${SOURCE}/${name}`));
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const text = await res.text();
  const data = JSON.parse(text) as T;
  try {
    file?.write(text);
  } catch {}
  return data;
}

export function loadStrongs(): Promise<StrongsData> {
  if (loaded) return Promise.resolve(loaded);
  pending ??= Promise.all([fetchJson<{ books: Tags }>('kjv-strongs.json'), fetchJson<Dict>('strongs.json')])
    .then(([t, dict]) => {
      if (t.books?.length !== 66) throw new Error('The download was incomplete.');
      return (loaded = { tags: t.books, dict });
    })
    .finally(() => (pending = undefined));
  return pending;
}

/** The Hebrew and Greek data; downloads it the first time (when `enabled`). */
export function useStrongs(enabled = true) {
  const [data, setData] = useState<StrongsData | undefined>(loaded);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadStrongs()
      .then((d) => live && setData(d))
      .catch(() => live && setError('Could not download the Hebrew and Greek words. Check your internet connection and try again.'));
    return () => {
      live = false;
    };
  }, [enabled, attempt]);
  const retry = useCallback(() => { setError(''); setAttempt((a) => a + 1); }, []);
  return { data, error, loading: enabled && !data && !error, retry };
}
