import { loader, studyFile } from './studyData';

/**
 * Verse-by-verse commentary: Matthew Henry's Concise Commentary (1706–1721, public domain), every chapter of
 * the Bible in parts of a few verses, with each chapter's outline (scripts/build-commentary.py).
 */
export const COMMENTARY_CREDIT = "Matthew Henry's Concise Commentary on the Whole Bible (1706–1721), public domain.";

/** A part of the commentary: from verse, to verse (0 = to the end of the chapter), and the text. */
export type Section = { from: number; to: number; text: string };
export type ChapterCommentary = { outline: { title: string; from: number; to: number }[]; sections: Section[] };
type Data = { books: { o: [string, number, number][]; s: [number, number, string][] }[][] };

const commentary = loader(() => studyFile<Data>('commentary.json'));
export const useCommentary = (enabled = true) =>
  commentary.use(enabled, 'Could not download the commentary. Check your internet connection and try again.');

export function chapterCommentary(data: Data, book: number, chapter: number): ChapterCommentary {
  const ch = data.books[book]?.[chapter - 1];
  return {
    outline: (ch?.o ?? []).map(([title, from, to]) => ({ title, from, to })),
    sections: (ch?.s ?? []).map(([from, to, text]) => ({ from, to, text })),
  };
}

/** The parts of the chapter's commentary that cover any of these verses. */
export function sectionsFor(data: Data, book: number, chapter: number, verses: number[]) {
  return chapterCommentary(data, book, chapter).sections.filter((s) => verses.some((v) => v >= s.from && (s.to === 0 || v <= s.to)));
}

/** "Verses 1–8", "Verse 9", "Verses 22 to the end". */
export const sectionLabel = (s: Section) =>
  s.to === 0 ? (s.from === 1 ? 'The whole chapter' : `Verses ${s.from} to the end`) : s.to === s.from ? `Verse ${s.from}` : `Verses ${s.from}–${s.to}`;
