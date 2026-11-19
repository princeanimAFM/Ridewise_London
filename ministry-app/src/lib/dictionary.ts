import { loader, studyFile } from './studyData';

/**
 * Bible dictionary: Easton's Bible Dictionary (1897, public domain), about 4,000 entries on the people,
 * places, words and customs of the Bible (scripts/build-dictionary.py).
 */
export const DICTIONARY_CREDIT = "Easton's Bible Dictionary (M. G. Easton, 1897), public domain.";

export type DictEntry = { term: string; body: string };
type Data = { entries: [string, string][] };
type Dictionary = { entries: DictEntry[]; index: Map<string, number[]> };

const dictionary = loader(async (): Promise<Dictionary> => {
  const d = await studyFile<Data>('dictionary.json');
  const index = new Map<string, number[]>();
  const entries = d.entries.map(([term, body], i) => {
    const k = term.toLowerCase();
    index.set(k, [...(index.get(k) ?? []), i]);
    return { term, body };
  });
  return { entries, index };
});
export const useDictionary = (enabled = true) =>
  dictionary.use(enabled, 'Could not download the Bible dictionary. Check your internet connection and try again.');

/** The entries for a word or name, also trying it without "'s" and without a plural ending. */
export function lookup(d: Dictionary, word: string): DictEntry[] {
  const w = word.trim().toLowerCase().replace(/[’']s$/, '');
  for (const k of [w, w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, '')]) {
    const found = d.index.get(k);
    if (found) return found.map((i) => d.entries[i]);
  }
  return [];
}

/** Entries whose name starts with the search, then those containing it; or, if `inside`, articles that mention it. */
export function searchDictionary(d: Dictionary, q: string, inside = false, limit = 150): DictEntry[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  if (inside) return d.entries.filter((e) => e.body.toLowerCase().includes(s)).slice(0, limit);
  const starts = d.entries.filter((e) => e.term.toLowerCase().startsWith(s));
  const has = d.entries.filter((e) => !e.term.toLowerCase().startsWith(s) && e.term.toLowerCase().includes(s));
  return [...starts, ...has].slice(0, limit);
}

export const byLetter = (d: Dictionary, letter: string) => d.entries.filter((e) => e.term[0]?.toUpperCase() === letter);

/** A piece of an entry: plain text, a Bible reference, or a link to another entry. */
export type Piece =
  | { kind: 'text'; text: string }
  | { kind: 'ref'; text: string; book: number; chapter: number; verse: number }
  | { kind: 'entry'; text: string; term: string };

const LINK = /\[\[(r|e):([^|\]]+)\|([^\]]*)\]\]/g;

/** Splits an entry into paragraphs of pieces. */
export function paragraphs(body: string): Piece[][] {
  return body.split('\n\n').map((p) => {
    const out: Piece[] = [];
    let at = 0;
    for (const m of p.matchAll(LINK)) {
      if (m.index! > at) out.push({ kind: 'text', text: p.slice(at, m.index) });
      if (m[1] === 'e') out.push({ kind: 'entry', text: m[3], term: m[2] });
      else {
        const [b, c, v] = m[2].split('-')[0].split('.').map(Number);
        out.push({ kind: 'ref', text: m[3], book: b, chapter: c, verse: v });
      }
      at = m.index! + m[0].length;
    }
    if (at < p.length) out.push({ kind: 'text', text: p.slice(at) });
    return out;
  });
}

/** The entry as plain text (for previews and sharing). */
export const plain = (body: string) => body.replace(LINK, '$3');
