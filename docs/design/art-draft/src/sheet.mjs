// Writes one comparison picture: the old cards and the new ones side by side, large and in the
// sizes of the app on a phone (64 px in the row of five kinds, 108 px as a drawn card).
// Usage: node previews/art-src/sheet.mjs   (after build.mjs)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { ROOT } from './lib.mjs';

const require = createRequire(`${ROOT}/package.json`);
const { chromium } = require('@playwright/test');

const data = (file) => `data:image/webp;base64,${readFileSync(file).toString('base64')}`;
const cards = [
  ['Holz', 'wood'],
  ['Lehm', 'brick'],
  ['Wolle', 'wool'],
  ['Getreide', 'grain'],
  ['Erz', 'ore'],
];
const oldOf = (name) => data(`${ROOT}/public/art/card-${name}.webp`);
const newOf = (name) => data(`${ROOT}/previews/art/card-${name}.webp`);

const large = (title, src) => `<figure><img src="${src}" width="250"><figcaption>${title}</figcaption></figure>`;
const five = (of, width) => `<div class="five">${cards.map(([, name]) => `<img src="${of(name)}" width="${width}">`).join('')}</div>`;

const html = `<html><head><style>
  body { margin: 0; padding: 28px; width: 1640px; background: #231d18; color: #f4ece1; font: 16px system-ui, sans-serif; }
  h1 { margin: 0 0 4px; font-size: 26px; } h2 { margin: 30px 0 12px; font-size: 19px; color: #f5be5b; }
  p { margin: 0; color: #b8ab9b; }
  .grid { display: flex; gap: 22px; } figure { margin: 0; } figcaption { margin-top: 6px; text-align: center; }
  img { display: block; filter: drop-shadow(0 6px 10px rgb(0 0 0 / 45%)); }
  .line { display: flex; align-items: center; gap: 26px; margin-bottom: 18px; }
  .line span { width: 60px; } .five { display: flex; gap: 6px; } .wide { gap: 12px; }
</style></head><body>
  <h1>Rohstoffkarten: neue Fassung (V3 gemalt mit Kontur, R2 Lichthof)</h1>
  <p>Oben die bisherigen Karten, darunter die neuen.</p>
  <h2>Bisher</h2>
  <div class="grid">${cards.map(([title, name]) => large(title, oldOf(name))).join('')}</div>
  <h2>Neu</h2>
  <div class="grid">${cards.map(([title, name]) => large(title, newOf(name))).join('')}</div>
  <h2>Echte Größe am Handy: 64 px in der Reihe der fünf Sorten</h2>
  <div class="line"><span>Bisher</span>${five(oldOf, 64)}</div>
  <div class="line"><span>Neu</span>${five(newOf, 64)}</div>
  <h2>Echte Größe am Handy: 108 px als gezogene Karte</h2>
  <div class="line"><span>Bisher</span><div class="five wide">${cards.map(([, name]) => `<img src="${oldOf(name)}" width="108">`).join('')}</div></div>
  <div class="line"><span>Neu</span><div class="five wide">${cards.map(([, name]) => `<img src="${newOf(name)}" width="108">`).join('')}</div></div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1696, height: 900 }, deviceScaleFactor: 2 });
  await page.setContent(html);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
  await page.screenshot({ path: `${ROOT}/previews/art/rohstoffkarten-vergleich.png`, fullPage: true });
} finally {
  await browser.close();
}
