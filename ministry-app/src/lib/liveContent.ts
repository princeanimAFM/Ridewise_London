import { useSyncExternalStore } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { ministry, type Book, type Fragrance, type LibraryItem, type LinkItem, type Quote } from '@/content/ministry';

/**
 * The app's content with the owner's edits applied. Areas the owner has edited
 * in Owner dashboard → Edit app content come from the backend (see
 * contentSync.ts); everything else comes from src/content/ministry.ts.
 *
 * In components use `const ministry = useContent()`; elsewhere `getContent()`.
 */
export type Content = typeof ministry;

export type ContentKey = 'details' | 'books' | 'perfumes' | 'quotes' | 'giving' | 'services' | 'socials' | 'archive' | 'library';
export type Overrides = Partial<Record<ContentKey, unknown>>;

/** Editable shapes, stored as JSON. Images are web links or "asset:<name>" for photos built into the app. */
export type Details = {
  themeYear: string;
  themeTitle: string;
  email: string;
  whatsapp: string;
  givingUrl: string;
  givingIntro: string;
  address: string;
  youtubeHandle: string;
  channelId: string;
  storeLaunched: boolean;
  shopUrl: string;
  brandStory: string;
  collectionName: string;
  orderPhones: string;
};
export type BookRow = { id: string; title: string; subtitle?: string; description?: string; cover?: string; amazonUrl: string; price?: string };
export type PerfumeRow = { id: string; name: string; image?: string; tagline?: string; description?: string; notes?: string; size?: string; price?: string; buyUrl?: string; video?: string };
export type QuoteRow = { id: string; text: string };
export type GivingRow = { id: string; label: string; value: string; url?: string; note?: string };
export type ServiceRow = { id: string; day: string; detail: string };
export type LibraryRow = { id: string; title: string; description?: string; file: string; cover?: string };
export type LinkRow = { id: string; label: string; url: string; icon: LinkItem['icon']; description?: string };

type ImageSource = string | ImageSourcePropType;

// Photos built into the app, so edited lists can keep using them.
const assets: Record<string, ImageSource> = {};
ministry.books.forEach((b) => {
  if (b.cover != null && typeof b.cover !== 'string') assets[`book-${b.id}`] = b.cover;
});
ministry.fragrances.previewPhotos.forEach((p, i) => {
  if (typeof p.image !== 'string') assets[`perfume-${i + 1}`] = p.image;
});

function imageRef(image?: ImageSource): string {
  if (image == null || image === '') return '';
  if (typeof image === 'string') return image;
  const key = Object.keys(assets).find((k) => assets[k] === image);
  return key ? `asset:${key}` : '';
}

/** Turns a stored image (web link or "asset:<name>") into something <Image> can show. */
export function imageFrom(ref?: string): ImageSource | undefined {
  if (!ref) return undefined;
  return ref.startsWith('asset:') ? assets[ref.slice(6)] : ref;
}

/** The built-in value of each area, in its editable form. */
export function builtinValue(key: ContentKey): unknown {
  const m = ministry;
  switch (key) {
    case 'details':
      return {
        themeYear: m.themeOfTheYear.year,
        themeTitle: m.themeOfTheYear.title,
        email: m.contact.email,
        whatsapp: m.contact.whatsapp,
        givingUrl: m.contact.givingUrl,
        givingIntro: m.giving.intro,
        address: m.about.address,
        youtubeHandle: m.live.youtubeHandle,
        channelId: m.live.channelId,
        storeLaunched: m.fragrances.launched,
        shopUrl: m.fragrances.shopUrl,
        brandStory: m.fragrances.brandStory,
        collectionName: m.fragrances.collectionName,
        orderPhones: m.fragrances.orderPhones,
      } satisfies Details;
    case 'books':
      return m.books.map((b): BookRow => ({ id: b.id, title: b.title, subtitle: b.subtitle ?? '', description: b.description, cover: imageRef(b.cover), amazonUrl: b.amazonUrl, price: b.price ?? '' }));
    case 'perfumes':
      return m.fragrances.items.length
        ? m.fragrances.items.map((f): PerfumeRow => ({ id: f.id, name: f.name, image: imageRef(f.image), tagline: f.tagline, description: f.description, notes: f.notes?.join(', ') ?? '', size: f.size ?? '', price: f.price ?? '', buyUrl: f.buyUrl ?? '', video: f.video ?? '' }))
        : m.fragrances.previewPhotos.map((p, i): PerfumeRow => ({ id: `peek-${i + 1}`, name: p.name, image: imageRef(p.image) }));
    case 'quotes':
      return m.quotes.map((q): QuoteRow => ({ id: q.id, text: q.text }));
    case 'giving':
      return m.giving.methods.map((g): GivingRow => ({ ...g }));
    case 'services':
      return m.about.serviceTimes.map((s, i): ServiceRow => ({ id: `s${i + 1}`, ...s }));
    case 'socials':
      return m.socials.map((s): LinkRow => ({ ...s }));
    case 'archive':
      return m.archive.map((s): LinkRow => ({ ...s }));
    case 'library':
      return m.library.map((l): LibraryRow => ({ id: l.id, title: l.title, description: l.description ?? '', file: l.file, cover: imageRef(l.cover) }));
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** A stored list, keeping only rows that have the required text fields. Undefined if the area isn't edited. */
function rows<T>(value: unknown, required: string[]): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((r) => isObject(r) && required.every((k) => str(r[k]))) as T[];
}

/** The editable value of an area: the owner's version if there is one, otherwise the built-in one. */
export function editableValue(key: ContentKey, o: Overrides = overrides): unknown {
  const v = o[key];
  if (key === 'details') return { ...(builtinValue('details') as Details), ...(isObject(v) ? v : {}) };
  return Array.isArray(v) ? v : builtinValue(key);
}

function build(o: Overrides): Content {
  const m = ministry;
  const d = editableValue('details', o) as Details;
  const books = rows<BookRow>(o.books, ['title', 'amazonUrl']);
  const perfumes = rows<PerfumeRow>(o.perfumes, ['name']) ?? (builtinValue('perfumes') as PerfumeRow[]);
  const quotes = rows<QuoteRow>(o.quotes, ['text']);
  const giving = rows<GivingRow>(o.giving, ['label', 'value']);
  const services = rows<ServiceRow>(o.services, ['day']);
  const socials = rows<LinkRow>(o.socials, ['label', 'url']);
  const archive = rows<LinkRow>(o.archive, ['label', 'url']);
  const library = rows<LibraryRow>(o.library, ['title', 'file']);
  const opt = (v?: string) => str(v) || undefined;
  const link = (r: LinkRow): LinkItem => ({ id: r.id, label: r.label, url: r.url, icon: r.icon || 'globe', description: opt(r.description) });

  return {
    ...m,
    themeOfTheYear: { year: str(d.themeYear) || m.themeOfTheYear.year, title: str(d.themeTitle) || m.themeOfTheYear.title },
    contact: { email: str(d.email) || m.contact.email, whatsapp: str(d.whatsapp).replace(/\D/g, ''), givingUrl: str(d.givingUrl) },
    about: {
      ...m.about,
      address: str(d.address),
      serviceTimes: services ? services.map((s) => ({ day: s.day, detail: s.detail ?? '' })) : m.about.serviceTimes,
    },
    live: { youtubeHandle: str(d.youtubeHandle).replace(/^@/, '') || m.live.youtubeHandle, channelId: str(d.channelId) },
    giving: {
      intro: str(d.givingIntro) || m.giving.intro,
      methods: giving ? giving.map((g) => ({ id: g.id, label: g.label, value: g.value, url: opt(g.url), note: opt(g.note) })) : m.giving.methods,
    },
    books: books
      ? books.map((b): Book => ({ id: b.id, title: b.title, subtitle: opt(b.subtitle), description: b.description ?? '', cover: imageFrom(b.cover), amazonUrl: b.amazonUrl, price: opt(b.price) }))
      : m.books,
    quotes: quotes ? quotes.map((q): Quote => ({ id: q.id, text: q.text })) : m.quotes,
    fragrances: {
      ...m.fragrances,
      launched: !!d.storeLaunched,
      shopUrl: str(d.shopUrl),
      brandStory: str(d.brandStory) || m.fragrances.brandStory,
      collectionName: str(d.collectionName) || m.fragrances.collectionName,
      orderPhones: d.orderPhones == null ? m.fragrances.orderPhones : str(d.orderPhones),
      previewPhotos: perfumes.filter((p) => p.image).map((p) => ({ name: p.name, image: imageFrom(p.image)! })),
      items: perfumes.map((p): Fragrance => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline ?? '',
        description: p.description ?? '',
        notes: (p.notes ?? '').split(',').map((n) => n.trim()).filter(Boolean),
        size: opt(p.size),
        price: opt(p.price),
        image: imageFrom(p.image),
        buyUrl: opt(p.buyUrl),
        video: opt(p.video),
      })),
    },
    socials: socials ? socials.map(link) : m.socials,
    archive: archive ? archive.map(link) : m.archive,
    library: library
      ? library.map((l): LibraryItem => ({ id: l.id, title: l.title, description: opt(l.description), file: l.file, cover: imageFrom(l.cover) }))
      : m.library,
  };
}

let overrides: Overrides = {};
let current: Content = build(overrides);
const listeners = new Set<() => void>();

export function getContent(): Content {
  return current;
}

export function getOverrides(): Overrides {
  return overrides;
}

export function setOverrides(next: Overrides) {
  overrides = next;
  current = build(next);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current content; the screen updates when the owner's edits arrive. */
export function useContent(): Content {
  return useSyncExternalStore(subscribe, getContent, getContent);
}

/** Always reads the latest content. For code outside components (screens use `useContent`). */
export const liveMinistry: Content = new Proxy({} as Content, {
  get: (_target, key) => current[key as keyof Content],
});
