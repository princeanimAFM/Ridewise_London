import { loader, studyFile } from './studyData';

/**
 * Cross-references: other verses on the same subject, best first (up to 25 a verse). From OpenBible.info,
 * built from the Treasury of Scripture Knowledge and ranked by readers' votes (scripts/build-crossrefs.py).
 */
export const CROSSREFS_CREDIT = 'Cross-references from OpenBible.info (CC BY), based on the Treasury of Scripture Knowledge.';

/** A verse is book * 1_000_000 + chapter * 1000 + verse; a passage is [first, last]. */
type Code = number | [number, number];
type Data = { books: Code[][][][] };

export type CrossRef = { book: number; chapter: number; verse: number; toVerse?: number; toChapter?: number };

const split = (n: number) => ({ book: Math.floor(n / 1_000_000), chapter: Math.floor((n % 1_000_000) / 1000), verse: n % 1000 });

const crossrefs = loader(() => studyFile<Data>('crossrefs.json'));
export const useCrossrefs = (enabled = true) =>
  crossrefs.use(enabled, 'Could not download the cross-references. Check your internet connection and try again.');

export function refsFor(data: Data, book: number, chapter: number, verse: number): CrossRef[] {
  return (data.books[book]?.[chapter - 1]?.[verse - 1] ?? []).map((c) => {
    if (typeof c === 'number') return split(c);
    const a = split(c[0]), b = split(c[1]);
    return { ...a, toVerse: b.verse, toChapter: b.chapter !== a.chapter ? b.chapter : undefined };
  });
}
