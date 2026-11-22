import { useCallback, useEffect, useState } from 'react';
import { BOOKS } from '@/content/bible';
import { parseReference, reference } from './bible';
import { supabase } from './supabase';

/** A Bible study written by the ministry (owner or admins), linked to a passage. */
export type Study = {
  id: string;
  title: string;
  book: number;
  chapter: number;
  verse_from: number | null;
  verse_to: number | null;
  author: string;
  body: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};
export type StudyDraft = Pick<Study, 'title' | 'book' | 'chapter' | 'verse_from' | 'verse_to' | 'author' | 'body' | 'published'>;

/** "John 3", "John 3:16" or "John 3:16-21". */
export function passageLabel(s: Pick<Study, 'book' | 'chapter' | 'verse_from' | 'verse_to'>) {
  if (!s.verse_from) return reference(s.book, s.chapter);
  const to = s.verse_to && s.verse_to > s.verse_from ? s.verse_to : s.verse_from;
  return reference(s.book, s.chapter, Array.from({ length: to - s.verse_from + 1 }, (_, i) => s.verse_from! + i));
}

/** "John 3", "John 3:16", "John 3:16-21" → the passage, or null if it isn't one. */
export function parsePassage(text: string): Pick<Study, 'book' | 'chapter' | 'verse_from' | 'verse_to'> | null {
  const r = parseReference(text);
  if (!r) return null;
  const end = /:\s*\d+\s*-\s*(\d+)\s*$/.exec(text);
  const to = end ? Number(end[1]) : null;
  return { book: r.book, chapter: r.chapter, verse_from: r.verse ?? null, verse_to: r.verse && to && to > r.verse ? to : null };
}

/** True when a study covers any of these verses (a whole-chapter study covers them all). */
export function covers(s: Study, verses: number[]) {
  if (!s.verse_from) return true;
  const to = s.verse_to ?? s.verse_from;
  return verses.some((v) => v >= s.verse_from! && v <= to);
}

async function fetchStudies(book?: number, chapter?: number) {
  if (!supabase) return { items: [] as Study[], error: '' };
  let q = supabase.from('bible_studies').select('*').eq('published', true);
  if (book != null && chapter != null) q = q.eq('book', book).eq('chapter', chapter).order('verse_from', { ascending: true, nullsFirst: true });
  else q = q.order('created_at', { ascending: false }).limit(200);
  const { data, error } = await q;
  return { items: (data as Study[]) ?? [], error: error ? 'Could not load the studies. Check your connection.' : '' };
}

/** Published studies: all of them (newest first), or those on one chapter (in verse order). */
export function useStudies(where?: { book: number; chapter: number }) {
  const book = where?.book, chapter = where?.chapter;
  const [tick, setTick] = useState(0);
  const key = `${book}:${chapter}:${tick}`;
  const [got, setGot] = useState<{ key: string; items: Study[]; error: string } | null>(null);
  useEffect(() => {
    let live = true;
    fetchStudies(book, chapter).then((r) => { if (live) setGot({ key, ...r }); });
    return () => { live = false; };
  }, [book, chapter, key]);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  const fresh = got?.key === key;
  return { items: got?.items ?? [], loading: !!supabase && !fresh, error: fresh ? got!.error : '', reload };
}

export async function loadStudy(id: string): Promise<Study | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('bible_studies').select('*').eq('id', id).maybeSingle();
  return (data as Study) ?? null;
}

// ---------- For the owner and admins ----------

/** Every study, including drafts (admins only; others see only published ones). */
export async function loadAllStudies(): Promise<Study[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('bible_studies').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Study[]) ?? [];
}

export async function saveStudy(draft: StudyDraft, id?: string) {
  if (!supabase) throw new Error('The app is not connected yet.');
  if (draft.book < 0 || draft.book >= BOOKS.length) throw new Error('Choose a passage.');
  const row = { ...draft, title: draft.title.trim(), author: draft.author.trim(), body: draft.body.trim() };
  const { error } = id ? await supabase.from('bible_studies').update(row).eq('id', id) : await supabase.from('bible_studies').insert(row);
  if (error) throw error;
}

export async function deleteStudy(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('bible_studies').delete().eq('id', id);
  if (error) throw error;
}
