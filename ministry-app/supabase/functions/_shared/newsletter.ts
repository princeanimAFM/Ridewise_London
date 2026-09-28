/**
 * Newsletter email + text message templates for AFM announcements.
 * Pure functions (no Deno/Node APIs) so they can be previewed anywhere.
 */

export type Brand = {
  name: string;
  minister: string;
  tagline: string;
  theme: { year: string; title: string };
  email: string;
  givingUrl: string;
  giving?: { label: string; value: string; url: string }[];
  appUrl: string;
  sermonsUrl: string;
  socials: { label: string; url: string }[];
};

export type Announcement = {
  title: string;
  body: string;
  sms_text?: string | null;
  event_date?: string | null;
  flyer_url?: string | null;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Makes bare links in text clickable after escaping. */
const linkify = (s: string) => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#2D6A3E;font-weight:600;">$1</a>');

export function formatEventDate(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function button(label: string, url: string, primary: boolean) {
  const bg = primary ? '#C9A227' : '#2D6A3E';
  const fg = primary ? '#1A1A1A' : '#FFFFFF';
  return `<a href="${esc(url)}" style="display:inline-block;margin:6px 4px;padding:12px 20px;border-radius:8px;background:${bg};color:${fg};font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;">${esc(label)}</a>`;
}

export function renderEmail(opts: {
  brand: Brand;
  announcement: Announcement;
  firstName: string;
  headerImageUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } {
  const { brand, announcement: a, firstName, headerImageUrl, unsubscribeUrl } = opts;
  const date = formatEventDate(a.event_date);
  const paragraphs = a.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1C2320;">${linkify(esc(p)).replace(/\n/g, '<br>')}</p>`)
    .join('');

  const buttons = [
    brand.givingUrl ? button('Give an offering (PayPal)', brand.givingUrl, true) : '',
    button('Listen to sermons', brand.sermonsUrl, false),
    brand.appUrl ? button(`Open ${brand.name}`, brand.appUrl, false) : '',
  ].join('');

  const giving = (brand.giving ?? [])
    .map(
      (g) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:#5E6B62;">${esc(g.label)}</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#1C2320;text-align:right;">${
          g.url ? `<a href="${esc(g.url)}" style="color:#2D6A3E;">${esc(g.value)}</a>` : esc(g.value)
        }</td></tr>`,
    )
    .join('');

  const socials = brand.socials
    .map((s) => `<a href="${esc(s.url)}" style="color:#2D6A3E;font-weight:600;text-decoration:none;margin:0 6px;white-space:nowrap;display:inline-block;">${esc(s.label)}</a>`)
    .join('<span style="color:#9AA79E;">·</span>');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(a.title)}</title></head>
<body style="margin:0;padding:0;background:#EEF2EC;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2EC;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
  <tr><td style="background:#2D6A3E;">
    <img src="${esc(headerImageUrl)}" width="600" alt="${esc(brand.minister)}" style="display:block;width:100%;max-width:600px;height:auto;max-height:340px;object-fit:cover;object-position:top;border:0;">
  </td></tr>
  <tr><td style="background:#2D6A3E;padding:18px 24px;text-align:center;">
    <div style="color:#C9A227;font-size:12px;font-weight:700;letter-spacing:2px;">THEME FOR ${esc(brand.theme.year)}</div>
    <div style="color:#FFFFFF;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;margin-top:4px;">${esc(brand.theme.title)}</div>
  </td></tr>
  <tr><td style="padding:28px 24px 8px;">
    <p style="margin:0 0 16px;font-size:17px;color:#1C2320;">Dear ${esc(firstName)},</p>
    <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#1C2320;">${esc(a.title)}</h1>
    ${date ? `<p style="margin:0 0 16px;color:#9A7616;font-weight:700;font-size:14px;letter-spacing:.5px;">${esc(date.toUpperCase())}</p>` : ''}
  </td></tr>
  ${a.flyer_url ? `<tr><td style="padding:4px 24px 16px;"><img src="${esc(a.flyer_url)}" width="552" alt="${esc(a.title)} flyer" style="display:block;width:100%;height:auto;border-radius:10px;border:0;"></td></tr>` : ''}
  <tr><td style="padding:0 24px 8px;">${paragraphs}
    <p style="margin:18px 0 0;font-size:16px;color:#1C2320;">Blessings,<br><strong>${esc(brand.name)}</strong></p>
  </td></tr>
  <tr><td align="center" style="padding:20px 18px 8px;">${buttons}</td></tr>
  ${giving ? `<tr><td style="padding:10px 24px 6px;">
    <div style="background:#F5F7F3;border-radius:10px;padding:14px 16px;">
      <div style="color:#9A7616;font-size:12px;font-weight:700;letter-spacing:1.5px;margin-bottom:6px;">GIVE AN OFFERING</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${giving}</table>
    </div>
  </td></tr>` : ''}
  <tr><td align="center" style="padding:14px 24px 22px;font-size:14px;">${socials}</td></tr>
  <tr><td style="background:#F5F7F3;padding:18px 24px;text-align:center;font-size:12px;line-height:1.6;color:#5E6B62;">
    ${esc(brand.name)} · ${esc(brand.minister)}<br>
    Questions or prayer requests: <a href="mailto:${esc(brand.email)}" style="color:#2D6A3E;">${esc(brand.email)}</a><br>
    You are receiving this because you subscribed to ${esc(brand.name)} announcements.
    <a href="${esc(unsubscribeUrl)}" style="color:#5E6B62;">Unsubscribe</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    `Dear ${firstName},`,
    '',
    a.title + (date ? ` — ${date}` : ''),
    '',
    a.body,
    '',
    `${brand.theme.year}: ${brand.theme.title}`,
    ...(brand.giving?.length ? ['Give an offering:', ...brand.giving.map((g) => `  ${g.label}: ${g.value}${g.url ? ` (${g.url})` : ''}`)] : brand.givingUrl ? [`Give an offering: ${brand.givingUrl}`] : []),
    `Sermons: ${brand.sermonsUrl}`,
    brand.appUrl ? `App: ${brand.appUrl}` : '',
    ...brand.socials.map((s) => `${s.label}: ${s.url}`),
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { subject: a.title, html, text };
}

export function renderSms(opts: { brand: Brand; announcement: Announcement; firstName: string; unsubscribeUrl: string }) {
  const { brand, announcement: a, firstName, unsubscribeUrl } = opts;
  const date = formatEventDate(a.event_date);
  const main = (a.sms_text && a.sms_text.trim()) || `${a.title}${date ? `, ${date}` : ''}.`;
  const link = a.flyer_url || brand.appUrl || brand.sermonsUrl;
  return `Hi ${firstName}, ${main} ${link ? `Details: ${link} ` : ''}- ${brand.name}. Stop: ${unsubscribeUrl}`;
}
