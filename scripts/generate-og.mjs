// Regenerates public/og-image.png (1200x630) for the new hero.
// Usage: npm run og   (requires Playwright's chromium to be installed)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const html = `<!doctype html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
  * { margin: 0; font-family: 'Inter', sans-serif; }
  body { width: 1200px; height: 630px; background: #050507; overflow: hidden; position: relative; }
  canvas { position: absolute; inset: 0; }
  .veil { position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 72% at 30% 55%, rgba(5,5,7,.8), rgba(5,5,7,.38) 58%, transparent 80%); }
  h1, h1 em { font-family: 'Instrument Serif', Georgia, serif; }
  h1 { position: absolute; left: 64px; top: 168px; width: 660px;
    font-weight: 400;
    font-size: 78px; line-height: 1.06; color: #fff; letter-spacing: -1px; }
  h1 em { color: #ffd98a; }
  p { position: absolute; left: 64px; top: 420px; width: 560px;
    font-size: 23px; line-height: 1.5; color: rgba(255,255,255,.62); }
  .brand { position: absolute; left: 64px; bottom: 42px; font-size: 22px; font-weight: 600; color: #fff; }
</style></head><body>
<canvas id="c" width="1200" height="630"></canvas>
<div class="veil"></div>
<h1>See your life in weeks. <em>Live them on purpose.</em></h1>
<p>The average life is about 4,000 weeks. Notice them, shape them, live more of them intentionally.</p>
<div class="brand">5k Weeks</div>
<script>
  const ctx = document.getElementById('c').getContext('2d');
  const pitch = 13, cell = 9;
  const cols = Math.ceil(1200 / pitch), rows = Math.ceil(630 / pitch);
  const sx = 880, sy = 300, R = 310;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * pitch, y = r * pitch;
      const d = Math.hypot(x + cell / 2 - sx, y + cell / 2 - sy);
      const h = (((r * cols + c) * 2654435761 >>> 0) % 1000) / 1000;
      if (d < R) {
        const t = 1 - d / R;
        ctx.fillStyle = 'rgba(' + Math.round(245 + 10 * t) + ',' + Math.round(182 + 35 * t) + ',' +
          Math.round(66 + 72 * t) + ',' + (0.3 + 0.7 * t).toFixed(2) + ')';
      } else {
        ctx.fillStyle = 'rgba(51,65,85,' + (0.2 + h * 0.16).toFixed(2) + ')';
      }
      ctx.fillRect(x, y, cell, cell);
    }
  }
</script>
</body></html>`;

const out = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../public/og-image.png',
);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
