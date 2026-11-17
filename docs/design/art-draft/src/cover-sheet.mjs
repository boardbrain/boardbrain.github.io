// Writes one comparison picture of the cover of Catan: the old and the new picture in the card
// of the game choice (development card K2) at the size of a phone, and the new picture large.
// Usage: node previews/art-src/cover-sheet.mjs   (after build.mjs - cover)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { ROOT } from './lib.mjs';

const require = createRequire(`${ROOT}/package.json`);
const { chromium } = require('@playwright/test');

const data = (file) => `data:image/webp;base64,${readFileSync(file).toString('base64')}`;
const tokens = readFileSync(`${ROOT}/src/ui/styles/tokens.css`, 'utf8');
const before = data(`${ROOT}/public/art/landscape.webp`);
const after = data(`${ROOT}/previews/art/landscape.webp`);

// The card as DevCard.module.css and GameChoiceView.module.css build it.
const card = (src, width) => `<span class="card" style="width:${width}px">
  <span class="head"><span class="ribbon"><strong>Catan</strong></span></span>
  <span class="art"><img src="${src}"></span>
  <span class="text"><strong class="lead">2 bis 4 Personen</strong><span class="note">Zufällige Startaufstellung</span></span>
</span>`;

const html = `<html><head><style>${tokens}
  body { margin: 0; padding: 28px; width: 1500px; background: #231d18; color: #f4ece1; font: 16px system-ui, sans-serif; }
  h1 { margin: 0 0 4px; font-size: 26px; } h2 { margin: 30px 0 12px; font-size: 19px; color: #f5be5b; }
  p { margin: 0; color: #b8ab9b; }
  .row { display: flex; gap: 36px; align-items: flex-start; } figure { margin: 0; } figcaption { margin-top: 8px; text-align: center; }
  .card { position: relative; display: flex; flex-direction: column; box-sizing: border-box; aspect-ratio: 5 / 7.4; padding: 10px 10px 9px;
    font-family: Georgia, 'Times New Roman', serif; color: var(--color-text); text-align: center;
    background: linear-gradient(170deg, var(--color-card-paper), var(--color-card-paper-low));
    border: 1px solid var(--color-border); border-radius: 14px;
    box-shadow: 0 6px 18px var(--color-shadow), inset 0 0 0 4px var(--color-card-glow); }
  .head { position: relative; display: block; height: 32px; }
  .ribbon { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 1.15rem; letter-spacing: .05em;
    color: var(--color-card-ribbon-ink); background: linear-gradient(180deg, var(--color-card-ribbon-top), var(--color-card-ribbon-bottom));
    clip-path: polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%, 5% 50%); text-shadow: 0 1px 2px var(--color-card-ribbon-shadow); }
  .art { position: relative; flex: 1; min-height: 0; margin: 0 4px; overflow: hidden; border: 3px double var(--color-card-frame); border-top: 0;
    box-shadow: inset 0 0 8px var(--color-card-art-shadow); }
  .art img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .text { position: relative; display: grid; gap: 1px; padding: 12px 6px 4px; margin-top: -12px; font-size: .8rem; line-height: 1.3;
    background: linear-gradient(180deg, var(--color-card-paper), var(--color-card-paper-low)); border-top: 2px solid var(--color-card-frame);
    border-radius: 50% 50% 6px 6px / 16px 16px 6px 6px; }
  .lead { font-size: .92rem; } .note { color: var(--color-text-muted); }
  .big { display: block; width: 600px; border-radius: 6px; }
</style></head><body>
  <h1>Titelbild Catan in der Spielauswahl: neue Fassung (gemalt, wie die Rohstoffkarten)</h1>
  <p>Motiv nach der Schachtel des Brettspiels, eigene Zeichnung. Links bisher, rechts neu.</p>
  <h2>In der Karte, echte Größe am Handy (240 px)</h2>
  <div class="row">
    <figure>${card(before, 240)}<figcaption>Bisher</figcaption></figure>
    <figure>${card(after, 240)}<figcaption>Neu</figcaption></figure>
    <figure>${card(after, 420)}<figcaption>Neu, vergrößert</figcaption></figure>
  </div>
  <h2>Das Bild allein</h2>
  <div class="row">
    <figure><img class="big" src="${before}"><figcaption>Bisher</figcaption></figure>
    <figure><img class="big" src="${after}"><figcaption>Neu</figcaption></figure>
  </div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1556, height: 900 }, deviceScaleFactor: 2 });
  await page.setContent(html);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
  await page.screenshot({ path: `${ROOT}/previews/art/landscape-vergleich.png`, fullPage: true });
  // Close views for checking by hand, when a folder is given.
  const checkDir = process.argv[2];
  if (checkDir !== undefined) {
    const zoom = await browser.newPage({ viewport: { width: 2400, height: 2640 } });
    await zoom.setContent(`<body style="margin:0"><img src="${after}" style="display:block;width:2400px"></body>`);
    await zoom.waitForFunction(() => [...document.images].every((image) => image.complete));
    await zoom.screenshot({ path: `${checkDir}/zoom-town.png`, clip: { x: 600, y: 1150, width: 1300, height: 800 } });
    await zoom.screenshot({ path: `${checkDir}/zoom-front.png`, clip: { x: 0, y: 1700, width: 2400, height: 940 } });
  }
} finally {
  await browser.close();
}
