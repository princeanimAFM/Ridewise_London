/**
 * Builds the website's page shell (public/index.html) from the app's content:
 * search-engine and link-preview details, plus a readable welcome page that
 * shows while the app loads (and is what search engines read). Also writes
 * robots.txt and sitemap.xml. Run after changing ministry details, then
 * redeploy the website:  node scripts/build-web-home.js
 */
const fs = require('fs');
const path = require('path');
const { load, root } = require('./load-app-module');

const { ministry: m } = load(path.join(root, 'src/content/ministry.ts'));
const { biography: b } = load(path.join(root, 'src/content/biography.ts'));

const site = (m.appShareUrl || '').replace(/\/$/, '');
if (!site) throw new Error('Set appShareUrl in src/content/ministry.ts to the website address first.');

const pub = path.join(root, 'public');
fs.mkdirSync(pub, { recursive: true });
fs.copyFileSync(path.join(root, 'store/feature-graphic-1024x500.png'), path.join(pub, 'og-image.png'));
fs.copyFileSync(path.join(root, 'assets/images/logo.png'), path.join(pub, 'logo.png'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const theme = `${m.themeOfTheYear.year}: ${m.themeOfTheYear.title}`;
const title = `${m.name} | ${b.name}: Sermons, Live Services & Quotes`;
const description = `The official app of ${m.minister} and the AFM Family Network. Stream 500+ sermons, watch live services, read daily AFM quotes, and find his books. ${theme}.`;
const socials = m.socials.filter((s) => s.url);
const links = [
  { label: 'Watch live on YouTube', url: `https://www.youtube.com/@${m.live.youtubeHandle}/live` },
  { label: 'Listen to 500+ sermons', url: m.podcast.pageUrl },
  m.playStoreUrl && { label: 'Get it on Google Play', url: m.playStoreUrl },
  { label: 'Give an offering', url: m.contact.givingUrl },
].filter((l) => l && l.url);

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AFM Family Network',
    alternateName: ['The AFM', 'Alleluia Faith Mission'],
    url: site,
    logo: `${site}/logo.png`,
    email: m.contact.email,
    founder: { '@type': 'Person', name: b.name, alternateName: b.knownAs, jobTitle: b.roles.join(', ') },
    sameAs: socials.map((s) => s.url),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: m.name,
    operatingSystem: 'Android, Web',
    applicationCategory: 'LifestyleApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: site,
    ...(m.playStoreUrl ? { downloadUrl: m.playStoreUrl } : {}),
  },
];

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="theme-color" content="#2D6A3E" />
    <link rel="canonical" href="${site}/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(m.name)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${site}/" />
    <meta property="og:image" content="${site}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${site}/og-image.png" />
    <link rel="apple-touch-icon" href="/logo.png" />
    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
    <!-- The \`react-native-web\` recommended style reset: https://necolas.github.io/react-native-web/docs/setup/#root-element -->
    <style id="expo-reset">
      html, body { height: 100%; }
      body { overflow: hidden; margin: 0; background: #F5F7F3; }
      #root { display: flex; height: 100%; flex: 1; }
    </style>
    <style>
      /* Welcome page: shown while the app loads, replaced once it starts. */
      .w { flex: 1; overflow: auto; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1C2320; }
      .w-hero { background: #2D6A3E; color: #fff; padding: 40px 20px 32px; text-align: center; }
      .w-hero img { width: 84px; height: 84px; border-radius: 50%; background: #fff; }
      .w-kicker { color: #C9A227; font-weight: 700; letter-spacing: 2px; font-size: 13px; margin-top: 14px; }
      .w h1 { font-family: Georgia, 'Times New Roman', serif; font-size: 34px; margin: 6px 0; }
      .w-hero p { color: #DCE8DC; max-width: 560px; margin: 8px auto 0; line-height: 1.5; }
      .w-main { max-width: 640px; margin: 0 auto; padding: 24px 20px 40px; line-height: 1.6; }
      .w h2 { font-family: Georgia, serif; color: #2D6A3E; font-size: 22px; margin: 24px 0 8px; }
      .w-links { display: grid; gap: 10px; margin: 16px 0; }
      .w-links a { display: block; padding: 13px 16px; border-radius: 10px; background: #C9A227; color: #1A1A1A; font-weight: 700; text-decoration: none; text-align: center; }
      .w ul { padding-left: 20px; }
      .w-social a, .w-foot a { color: #2D6A3E; }
      .w-foot { color: #5E6B62; font-size: 14px; border-top: 1px solid #DDE5DA; margin-top: 28px; padding-top: 14px; }
      .w-loading { color: #5E6B62; font-size: 14px; text-align: center; }
    </style>
    <link rel="icon" href="/favicon.ico" />
  </head>

  <body>
    <noscript><div style="padding:8px 16px;background:#FFF8E6;font:14px system-ui,Arial,sans-serif;color:#1C2320">Turn on JavaScript to use the full app. The ministry's details are below.</div></noscript>
    <div id="root">
      <div class="w">
        <header class="w-hero">
          <img src="/logo.png" alt="${esc(m.name)} logo" width="84" height="84" />
          <div class="w-kicker">${esc(theme.toUpperCase())}</div>
          <h1>${esc(m.name)}</h1>
          <p>The official app of ${esc(m.minister)} and the AFM Family Network. ${esc(m.tagline)}</p>
        </header>
        <main class="w-main">
          <p class="w-loading">Opening the app…</p>
          <div class="w-links">
${links.map((l) => `            <a href="${esc(l.url)}">${esc(l.label)}</a>`).join('\n')}
          </div>
          <h2>About ${esc(b.name)}</h2>
${b.intro.map((p) => `          <p>${esc(p)}</p>`).join('\n')}
          <p>Also known as ${esc(b.knownAs.join(' and '))}. ${esc(b.roles.join(' · '))}.</p>
          <h2>In the app</h2>
          <ul>
            <li>More than 500 audio sermons from ${esc(m.podcast.title)}</li>
            <li>Live services streamed from YouTube</li>
            <li>A new AFM quote every day</li>
            <li>The AFM Mission Statement, Biography and The AFM Handbook</li>
            <li>Books: ${esc(m.books.map((x) => x.title).join(', '))}</li>
            <li>Announcements, the AFM newsletter and ways to give</li>
          </ul>
          <h2>Follow the ministry</h2>
          <p class="w-social">${socials.map((s) => `<a href="${esc(s.url)}">${esc(s.label)}</a>`).join(' · ')}</p>
          <p class="w-foot">Contact: <a href="mailto:${esc(m.contact.email)}">${esc(m.contact.email)}</a> · <a href="/privacy.html">Privacy Policy</a></p>
        </main>
      </div>
    </div>
  </body>
</html>
`;

fs.writeFileSync(path.join(pub, 'index.html'), html);
fs.writeFileSync(path.join(pub, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
fs.writeFileSync(
  path.join(pub, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc></url>\n  <url><loc>${site}/privacy.html</loc></url>\n</urlset>\n`,
);
console.log('Wrote public/index.html, robots.txt, sitemap.xml, og-image.png, logo.png');
