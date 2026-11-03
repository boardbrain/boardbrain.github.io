// Generates the large pictures of a match in public/art (design I2-C, Architecture ADR-030): the
// resource cards S4 and the landscape of the Catan card. The sources are the SVG files in
// scripts/art, drawn after docs/design/i2-match-final-preview.html; their colours are tokens
// (`var(--color-art-…)`) and come from src/ui/styles/tokens.css (NFA-GB-05). Run with
// `npm run art` after changing a source or a colour; the pictures are committed. Playwright renders
// each source with the tokens and saves it as WebP with transparency.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

/* global Image, document -- used inside the page */

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'scripts', 'art');
const OUT_DIR = path.join(ROOT, 'public', 'art');

// Width in pixels: a card is at most about 240 CSS px wide, so this stays sharp at three times
// that on phones and tablets, and on large screens (decision of the product owner).
const WIDTH = 1200;
const QUALITY = 0.9;

const tokens = readFileSync(path.join(ROOT, 'src', 'ui', 'styles', 'tokens.css'), 'utf8');

function viewBoxOf(svg, name) {
  const match = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (match === null) {
    throw new Error(`${name} has no viewBox starting at 0 0`);
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
try {
  for (const file of readdirSync(SOURCE_DIR).filter((entry) => entry.endsWith('.svg'))) {
    const name = path.basename(file, '.svg');
    const svg = readFileSync(path.join(SOURCE_DIR, file), 'utf8');
    const box = viewBoxOf(svg, file);
    const height = Math.round((WIDTH * box.height) / box.width);
    const page = await browser.newPage({ viewport: { width: WIDTH, height } });
    await page.setContent(
      `<html><head><style>${tokens}
        html, body { margin: 0; background: transparent; }
        svg { display: block; width: ${String(WIDTH)}px; height: ${String(height)}px; }
      </style></head><body>${svg}</body></html>`,
    );
    const png = await page.locator('svg').first().screenshot({ omitBackground: true });
    // The browser encodes WebP: smaller than PNG at the same sharpness, with transparency.
    const webp = await page.evaluate(
      async ({ base64, quality }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image, 0, 0);
        return canvas.toDataURL('image/webp', quality).split(',')[1];
      },
      { base64: png.toString('base64'), quality: QUALITY },
    );
    writeFileSync(path.join(OUT_DIR, `${name}.webp`), Buffer.from(webp, 'base64'));
    process.stdout.write(`${name}.webp ${String(WIDTH)}×${String(height)}\n`);
    await page.close();
  }
} finally {
  await browser.close();
}
