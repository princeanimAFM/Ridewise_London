/** Turns a YouTube, Google Drive or direct .mp4 link into something a player can show. */
export type VideoSource = { kind: 'embed' | 'file'; url: string; openUrl: string };

export function videoSource(link?: string): VideoSource | undefined {
  const url = (link ?? '').trim();
  if (!/^https?:\/\//i.test(url)) return undefined;

  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/i);
  if (yt) return { kind: 'embed', url: `https://www.youtube.com/embed/${yt[1]}?playsinline=1&rel=0&modestbranding=1`, openUrl: `https://youtu.be/${yt[1]}` };

  const drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([\w-]{10,})/i);
  if (drive) return { kind: 'embed', url: `https://drive.google.com/file/d/${drive[1]}/preview`, openUrl: `https://drive.google.com/file/d/${drive[1]}/view` };

  return { kind: 'file', url, openUrl: url };
}

/**
 * Pairs "50 ml · 30 ml · 15 ml" with "GH₵ 650 · GH₵ 400 · GH₵ 200".
 * Returns one row per size, or nothing when there is a single size/price.
 */
export function sizePrices(size?: string, price?: string): { size: string; price: string }[] {
  const split = (s?: string) => (s ?? '').split(/\s*[·|]\s*/).map((x) => x.trim()).filter(Boolean);
  const sizes = split(size);
  const prices = split(price);
  if (sizes.length < 2 || sizes.length !== prices.length) return [];
  return sizes.map((s, i) => ({ size: s, price: prices[i] }));
}

/** "From GH₵ 200" for a perfume sold in several sizes, otherwise the price as written. */
export function priceSummary(size?: string, price?: string): string | undefined {
  const rows = sizePrices(size, price);
  if (!rows.length) return price || undefined;
  const value = (p: string) => Number(p.replace(/[^\d.]/g, '')) || Infinity;
  const cheapest = rows.reduce((a, b) => (value(b.price) < value(a.price) ? b : a));
  return `From ${cheapest.price}`;
}
