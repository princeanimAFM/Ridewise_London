/**
 * Writes supabase/functions/_shared/brand.json from the app's content, so
 * newsletters use the same name, theme, links, PayPal and contact details.
 * Run after editing src/content/ministry.ts:  node scripts/build-newsletter-brand.js
 */
const fs = require('fs');
const path = require('path');
const { load, root } = require('./load-app-module');

const { ministry: m } = load(path.join(root, 'src/content/ministry.ts'));
const brand = {
  name: m.name,
  minister: m.minister,
  tagline: m.tagline,
  theme: m.themeOfTheYear,
  email: m.contact.email,
  givingUrl: m.contact.givingUrl || '',
  giving: m.giving.methods.map(({ label, value, url }) => ({ label, value, url: url || '' })),
  appUrl: m.appShareUrl || '',
  sermonsUrl: m.podcast.pageUrl,
  socials: m.socials.filter((s) => s.url).map((s) => ({ label: s.label.replace(/^(Watch on|Listen on|Follow on|Join on) /, ''), url: s.url })),
};
fs.writeFileSync(path.join(root, 'supabase/functions/_shared/brand.json'), JSON.stringify(brand, null, 2) + '\n');
console.log('Wrote supabase/functions/_shared/brand.json');
