import { useEffect, useState } from 'react';
import { ministry } from '@/content/ministry';

export type Episode = {
  id: string;
  title: string;
  date: string; // ISO
  description: string;
  audioUrl: string;
  image?: string;
  duration?: number; // seconds
  link?: string;
};

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => entities[n.toLowerCase()] ?? m);
}

function stripHtml(s: string) {
  return decode(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&([a-z]+);/gi, (m, n) => entities[n.toLowerCase()] ?? m)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]).trim() : undefined;
}

function attr(xml: string, name: string, attribute: string) {
  const m = xml.match(new RegExp(`<${name}\\s[^>]*${attribute}=["']([^"']+)["']`, 'i'));
  return m ? decode(m[1]) : undefined;
}

function parseDuration(v?: string) {
  if (!v) return undefined;
  const parts = v.split(':').map(Number);
  if (parts.some(Number.isNaN)) return undefined;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/** Parses a standard podcast RSS feed (Podbean, Anchor, etc.). */
export function parseFeed(xml: string): Episode[] {
  const channelImage = attr(xml.split(/<item[\s>]/i)[0], 'itunes:image', 'href');
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  return items
    .map((item) => {
      const audioUrl = attr(item, 'enclosure', 'url');
      const pub = tag(item, 'pubDate');
      const date = pub ? new Date(pub) : undefined;
      return {
        id: tag(item, 'guid') ?? audioUrl ?? tag(item, 'title') ?? '',
        title: stripHtml(tag(item, 'title') ?? 'Untitled'),
        date: date && !Number.isNaN(date.getTime()) ? date.toISOString() : '',
        description: stripHtml(tag(item, 'content:encoded') ?? tag(item, 'description') ?? tag(item, 'itunes:summary') ?? ''),
        audioUrl: audioUrl ?? '',
        image: attr(item, 'itunes:image', 'href') ?? channelImage,
        duration: parseDuration(tag(item, 'itunes:duration')),
        link: tag(item, 'link'),
      };
    })
    .filter((e) => e.audioUrl)
    .sort((a, b) => b.date.localeCompare(a.date));
}

type FeedState = { episodes: Episode[]; loading: boolean; error?: string };

let cache: Episode[] | undefined;
let inflight: Promise<Episode[]> | undefined;

export function loadEpisodes(force = false): Promise<Episode[]> {
  const url = ministry.podcast.feedUrl;
  if (!url) return Promise.resolve([]);
  if (cache && !force) return Promise.resolve(cache);
  if (!inflight || force) {
    inflight = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Feed returned ${r.status}`);
        return r.text();
      })
      .then((xml) => (cache = parseFeed(xml)))
      .finally(() => (inflight = undefined));
  }
  return inflight;
}

export function findEpisode(id: string) {
  return cache?.find((e) => e.id === id);
}

/** Loads the podcast episodes (cached for the session). */
export function useEpisodes() {
  const [state, setState] = useState<FeedState>({ episodes: cache ?? [], loading: !cache && !!ministry.podcast.feedUrl });
  const load = (force = false) => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    loadEpisodes(force)
      .then((episodes) => setState({ episodes, loading: false }))
      .catch((e: Error) => setState({ episodes: cache ?? [], loading: false, error: e.message }));
  };
  useEffect(() => {
    if (!cache && ministry.podcast.feedUrl) load();
  }, []);
  return { ...state, refresh: () => load(true) };
}

export function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
