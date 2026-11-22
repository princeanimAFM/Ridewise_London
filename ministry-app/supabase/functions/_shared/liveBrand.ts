// Newsletter branding: brand.json (built from the app) with the owner's edits
// from Owner dashboard → Edit app content applied on top.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import brandJson from './brand.json' with { type: 'json' };
import type { Brand } from './newsletter.ts';

type Row = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const list = (v: unknown, required: string[]) =>
  Array.isArray(v) ? (v.filter((r) => r && typeof r === 'object' && required.every((k) => str((r as Row)[k]))) as Row[]) : undefined;

/** Short link names for emails, e.g. "Follow on Instagram" → "Instagram". Same rule as scripts/build-newsletter-brand.js. */
export function socialLabel(label: string, description?: string) {
  return label.replace(/^(Watch on|Listen on|Follow on|Join on) /, '').replace(/^TikTok: .*/, () => `TikTok (${description ?? ''})`);
}

export async function liveBrand(db: SupabaseClient): Promise<Brand> {
  const brand = structuredClone(brandJson) as Brand;
  const { data } = await db.from('app_content').select('key, value').in('key', ['details', 'giving', 'socials']);
  const edits = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, unknown>;

  const d = edits.details as Row | undefined;
  if (d && typeof d === 'object') {
    brand.theme = { year: str(d.themeYear) || brand.theme.year, title: str(d.themeTitle) || brand.theme.title };
    brand.email = str(d.email) || brand.email;
    if ('givingUrl' in d) brand.givingUrl = str(d.givingUrl);
  }
  const giving = list(edits.giving, ['label', 'value']);
  if (giving) brand.giving = giving.map((g) => ({ label: str(g.label), value: str(g.value), url: str(g.url) }));
  const socials = list(edits.socials, ['label', 'url']);
  if (socials) brand.socials = socials.map((s) => ({ label: socialLabel(str(s.label), str(s.description)), url: str(s.url) }));
  return brand;
}
