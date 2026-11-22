import { loader, studyFile } from './studyData';

/**
 * Bible maps: about 1,300 places named in the Bible, where each was (and how sure we are), which chapters name
 * them, and journeys (Abraham, the Exodus, Paul) (scripts/build-maps.py). The map itself is a page on
 * theafmchurch.org/bible/map, shown in the app.
 */
export const MAP_PAGE = 'https://theafmchurch.org/bible/map/index.html';
export const MAPS_CREDIT = 'Places from OpenBible.info (CC BY 4.0). Coastlines, lakes and rivers from Natural Earth (public domain).';

export type Place = { id: number; name: string; lat: number; lon: number; kind: string; sure: 0 | 1 | 2 };
export type Journey = { id: string; title: string; ref: string; note: string; stops: [number, string][] };
type Data = { places: [string, number, number, string, 0 | 1 | 2][]; books: [number, number][][][]; journeys: Journey[] };
export type Mention = { book: number; chapter: number; verse: number };

type Maps = Data & { mentions: Map<number, Mention[]> };

const maps = loader(async (): Promise<Maps> => {
  const d = await studyFile<Data>('places.json');
  const mentions = new Map<number, Mention[]>();
  d.books.forEach((chs, book) => chs.forEach((ch, c) => ch.forEach(([p, verse]) => {
    if (!mentions.has(p)) mentions.set(p, []);
    mentions.get(p)!.push({ book, chapter: c + 1, verse });
  })));
  return { ...d, mentions };
});
export const usePlaces = (enabled = true) =>
  maps.use(enabled, 'Could not download the Bible maps. Check your internet connection and try again.');

export const place = (d: Maps, id: number): Place => {
  const [name, lat, lon, kind, sure] = d.places[id];
  return { id, name, lat, lon, kind, sure };
};

export const SURE = ['Uncertain site', 'Likely site', 'Known site'] as const;

/** The places named in a chapter (or in some of its verses), each with the verses that name it. */
export function placesIn(d: Maps, book: number, chapter: number, verses?: number[]) {
  const out = new Map<number, number[]>();
  for (const [p, v] of d.books[book]?.[chapter - 1] ?? []) {
    if (verses && !verses.includes(v)) continue;
    if (!out.has(p)) out.set(p, []);
    if (!out.get(p)!.includes(v)) out.get(p)!.push(v);
  }
  return [...out].map(([id, vs]) => ({ place: place(d, id), verses: vs }));
}

export const mentionsOf = (d: Maps, id: number) => d.mentions.get(id) ?? [];

export function searchPlaces(d: Maps, q: string, limit = 60) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const all = d.places.map((_, i) => place(d, i));
  const starts = all.filter((p) => p.name.toLowerCase().startsWith(s));
  const has = all.filter((p) => !p.name.toLowerCase().startsWith(s) && p.name.toLowerCase().includes(s));
  return [...starts, ...has].slice(0, limit);
}

/** Places with this exact name (e.g. a dictionary entry), best known first. */
export const placesNamed = (d: Maps, name: string) =>
  d.places.map((_, i) => place(d, i)).filter((p) => p.name.toLowerCase() === name.toLowerCase()).sort((a, b) => b.sure - a.sure);

/** The address after # that tells the map page what to show. */
export function mapHash(view: { book?: number; chapter?: number; place?: number; journey?: string }, dark: boolean, sel?: number | null) {
  const q: string[] = [];
  if (view.journey) q.push(`journey=${view.journey}`);
  else if (view.place != null) q.push(`place=${view.place}`);
  else if (view.book != null && view.chapter != null) q.push(`chapter=${view.book}.${view.chapter}`);
  if (dark) q.push('dark=1');
  if (sel != null) q.push(`sel=${sel}`);
  return q.join('&');
}
