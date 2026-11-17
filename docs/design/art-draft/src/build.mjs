// Renders the proposed cards as the real pipeline would (ADR-030: Playwright draws the SVG with
// the colours, the result is a WebP picture 1200 px wide) into previews/art/.
// Usage: node previews/art-src/build.mjs <checkDir|-> [name ...]
//   checkDir: also writes PNG and SVG there for checking by hand; names: wood, wood-all, brick,
//   wool, grain, ore, cover (default: every picture in the chosen direction).
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, card, frameOf } from './lib.mjs';

const require = createRequire(`${ROOT}/package.json`);
const { chromium } = require('@playwright/test');

const OUT = `${ROOT}/previews/art`;
const [checkArg, ...only] = process.argv.slice(2);
const checkDir = checkArg === undefined || checkArg === '-' ? null : checkArg;
const wants = (name) => only.length === 0 || only.includes(name);
const WIDTH = 1200;
const tokens = readFileSync(`${ROOT}/src/ui/styles/tokens.css`, 'utf8');
const css = (prefix, palette) =>
  `:root{${Object.entries(palette)
    .map(([name, value]) => `--${prefix}-${name}:${value};`)
    .join('')}}`;

const jobs = [];
const addJob = (name, source, picture, paletteCss) => {
  const frame = frameOf(source);
  jobs.push({ name, svg: card(frame, picture), checkSvg: card(frame, picture, paletteCss), css: paletteCss });
};

if (wants('wood') || only.includes('wood-all')) {
  const { PALETTE, woodPicture } = await import('./wood.mjs');
  const colors = css('w', PALETTE);
  // The chosen direction (PO 16.11.2026): V3 painted with contour, R2 glow.
  addJob('card-wood', 'card-wood', woodPicture({ style: 'mix', halo: 'glow' }), colors);
  if (only.includes('wood-all')) {
    for (const [key, style] of [['v1', 'flat'], ['v2', 'paint'], ['v3', 'mix']]) {
      for (const [rim, halo] of [['r1', 'thin'], ['r2', 'glow']]) {
        addJob(`wood-${key}-${rim}`, 'card-wood', woodPicture({ style, halo }), colors);
      }
    }
  }
}
if (wants('brick')) {
  const { PALETTE, brickPicture } = await import('./brick.mjs');
  addJob('card-brick', 'card-brick', brickPicture(), css('b', PALETTE));
}
if (wants('wool')) {
  const { PALETTE, woolPicture } = await import('./wool.mjs');
  // PO 16.11.2026: dark head.
  addJob('card-wool', 'card-wool', woolPicture({ head: 'dark' }), css('s', PALETTE));
}
if (wants('grain')) {
  const { PALETTE, grainPicture } = await import('./grain.mjs');
  addJob('card-grain', 'card-grain', grainPicture(), css('g', PALETTE));
}
if (wants('ore')) {
  const { PALETTE, orePicture } = await import('./ore.mjs');
  addJob('card-ore', 'card-ore', orePicture(), css('o', PALETTE));
}
if (wants('cover')) {
  // The cover of Catan in the game choice: no frame, 100 by 110 as the landscape it replaces.
  const { COVER_CSS, coverSvg } = await import('./cover.mjs');
  jobs.push({ name: 'landscape', svg: coverSvg(), checkSvg: coverSvg(COVER_CSS), css: COVER_CSS, ratio: 1.1 });
}

mkdirSync(OUT, { recursive: true });
if (checkDir) mkdirSync(checkDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const job of jobs) {
    const height = WIDTH * (job.ratio ?? 1.5);
    const page = await browser.newPage({ viewport: { width: WIDTH, height } });
    await page.setContent(
      `<html><head><style>${tokens}${job.css}
        html, body { margin: 0; background: transparent; }
        svg { display: block; width: ${WIDTH}px; height: ${height}px; }
      </style></head><body>${job.svg}</body></html>`,
    );
    const png = await page.locator('svg').first().screenshot({ omitBackground: true });
    const webp = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      return canvas.toDataURL('image/webp', 0.9).split(',')[1];
    }, png.toString('base64'));
    writeFileSync(path.join(OUT, `${job.name}.webp`), Buffer.from(webp, 'base64'));
    if (checkDir) {
      writeFileSync(path.join(checkDir, `${job.name}.png`), png);
      writeFileSync(path.join(checkDir, `${job.name}.svg`), job.checkSvg);
    }
    process.stdout.write(`${job.name}.webp ${Math.round((webp.length * 0.75) / 1024)} kB, svg ${Math.round(job.svg.length / 1024)} kB\n`);
    await page.close();
  }
} finally {
  await browser.close();
}
