const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const out = process.argv[2], scale = +(process.argv[3] || 1);
  for (const [mode, w, h, sc] of [['a4', 794, 1123, 3], ['social', 1080, 1350, 1]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: sc });
    await p.goto('http://localhost:8790/secret.html#' + mode); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    const over = await p.evaluate(() => { const c = document.querySelector('.copy').getBoundingClientRect(), t = document.querySelector('.cta').getBoundingClientRect(); return Math.round(c.bottom - t.top); });
    console.log(mode, 'copy bottom minus cta top:', over);
    await p.screenshot({ path: `${out}/secret-${mode}.png` });
    if (mode === 'a4') await p.pdf({ path: `${out}/secret-a4.pdf`, width: '794px', height: '1123px', printBackground: true, pageRanges: '1' });
  } await b.close(); })();
