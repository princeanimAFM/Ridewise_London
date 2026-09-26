/**
 * Builds docs/privacy.html from src/content/privacy.ts, so the web page used
 * for the App Store / Google Play listing always matches the in-app screen.
 * Run after editing the policy:  node scripts/build-privacy-page.js
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src/content/privacy.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', js)(mod, mod.exports);
const p = mod.exports.privacy;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const link = (s) => esc(s).replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>');

const html = `<title>${esc(p.appName)} Privacy Policy</title>
<meta name="description" content="How ${esc(p.appName)} handles your information.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=Source+Sans+3:wght@400;600&display=swap">
<style>
  :root {
    --bg: #F5F7F3; --surface: #FFFFFF; --soft: #E8F0E6; --text: #1C2320; --muted: #5E6B62;
    --green: #2D6A3E; --gold: #9A7616; --rule: #DDE5DA;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #0E1510; --surface: #172019; --soft: #213024; --text: #EEF2EC; --muted: #A3B0A5;
      --green: #7FC784; --gold: #D9B64A; --rule: #2A3A2D; color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg: #0E1510; --surface: #172019; --soft: #213024; --text: #EEF2EC; --muted: #A3B0A5;
    --green: #7FC784; --gold: #D9B64A; --rule: #2A3A2D; color-scheme: dark;
  }
  body { background: var(--bg); color: var(--text); font: 17px/1.65 "Source Sans 3", system-ui, -apple-system, "Segoe UI", sans-serif; padding-inline: 16px; }
  main { max-width: 42rem; margin: 0 auto; padding-block: 40px 64px; }
  .eyebrow { color: var(--gold); font-weight: 600; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; margin: 0; }
  h1 { font-family: Lora, Georgia, serif; font-size: clamp(30px, 6vw, 40px); line-height: 1.15; margin: 6px 0 4px; text-wrap: balance; }
  .meta { color: var(--muted); margin: 0 0 28px; }
  .summary { background: var(--soft); border-radius: 14px; padding: 18px 20px; margin-bottom: 8px; }
  .summary strong { display: block; color: var(--green); font-size: 13px; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 4px; }
  h2 { font-family: Lora, Georgia, serif; font-size: 22px; margin: 36px 0 8px; padding-top: 20px; border-top: 1px solid var(--rule); text-wrap: balance; }
  p { margin: 0 0 12px; }
  a { color: var(--green); font-weight: 600; }
  a:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
  footer { margin-top: 40px; color: var(--muted); font-size: 15px; }
</style>
<main>
  <p class="eyebrow">${esc(p.appName)}</p>
  <h1>${esc(p.title)}</h1>
  <p class="meta">Effective ${esc(p.effectiveDate)} · ${esc(p.publisher)}</p>
  <div class="summary"><strong>In short</strong>${esc(p.summary)}</div>
${p.sections.map((s) => `  <h2>${esc(s.heading)}</h2>\n${s.body.map((b) => `  <p>${link(b)}</p>`).join('\n')}`).join('\n')}
  <footer>Questions about this policy: <a href="mailto:${esc(p.contactEmail)}">${esc(p.contactEmail)}</a></footer>
</main>
`;
fs.writeFileSync(path.join(root, 'docs/privacy.html'), html);
console.log('Wrote docs/privacy.html');
