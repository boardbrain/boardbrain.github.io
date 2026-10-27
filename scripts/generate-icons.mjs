// Generates the app icons in public/icons (design I1-D, icon D8 "two cards"): two fanned cards,
// the front one styled like the app's cards with amber edge, corner hexagons and the logo.
// Run with `npm run icons` after changing the logo or the colours; the PNGs are committed.
// Colours come from src/ui/styles/tokens.css (NFA-GB-05); Playwright renders the SVG.
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'icons');

const tokens = readFileSync(path.join(ROOT, 'src', 'ui', 'styles', 'tokens.css'), 'utf8');

// First definition of a token; for the design tokens this is the default design "Holz".
function token(name) {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(tokens);
  if (match === null) {
    throw new Error(`Token ${name} is missing in tokens.css`);
  }
  return match[1].trim();
}

function firstColorIn(value) {
  const match = /#[0-9a-fA-F]{6}/.exec(value);
  if (match === null) {
    throw new Error(`No colour in ${value}`);
  }
  return match[0];
}

const COLORS = {
  surface: token('--color-surface'),
  raised: token('--color-surface-raised'),
  overlay: token('--color-surface-overlay'),
  accent: token('--color-accent-amber-text'),
  shadow: token('--color-shadow'),
  // The warm glow at the top of the background of the design "Holz".
  glow: firstColorIn(token('--background-image')),
};

// Logo "Eine Kontur" (design D-3), the same paths as src/ui/components/Logo.tsx.
const OUTLINE =
  'M24 8.5C21 5 14 5.5 12 10 7 10 5 15 7 18 3 20 3 27 7 29 5 33 8 38 12 37 13 41 18 42.5 22 40.5 23 41 23.5 41 24 40.5 24.5 41 25 41 26 40.5 30 42.5 35 41 36 37 40 38 43 33 41 29 45 27 45 20 41 18 43 15 41 10 36 10 34 5.5 27 5 24 8.5Z';
const FOLDS = 'M36 10c-2 3-6 3-7 6M41 18c-4 0-6 3-5 6M41 29c-4-1-7 1-8 4M30.5 22c2 3 0 6-3 6';
const SQUARE = 5.4;

function logo(width, cx, cy, color) {
  const scale = width / 48;
  let squares = '';
  for (let column = 0; column < 5; column += 1) {
    for (let row = -5; row < 5; row += 1) {
      if ((((column + row) % 2) + 2) % 2 === 0) {
        squares += `<rect x="${(24 - SQUARE * (column + 1)).toFixed(2)}" y="${(24 + SQUARE * row).toFixed(2)}" width="${SQUARE}" height="${SQUARE}"/>`;
      }
    }
  }
  return `<g transform="translate(${cx - 24 * scale} ${cy - 24 * scale}) scale(${scale})">
    <clipPath id="outline"><path d="${OUTLINE}"/></clipPath>
    <clipPath id="left"><rect x="0" y="0" width="24" height="48"/></clipPath>
    <g clip-path="url(#outline)"><g clip-path="url(#left)" fill="${color}">${squares}</g></g>
    <g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
      <path stroke-width="2.2" d="${FOLDS}"/><path stroke-width="2.6" d="${OUTLINE}"/><path stroke-width="2.6" d="M24 8.5V40.5"/>
    </g>
  </g>`;
}

function hexagon(cx, cy, radius) {
  return Array.from({ length: 6 }, (_, index) => {
    const radians = ((60 * index - 90) * Math.PI) / 180;
    return `${(cx + radius * Math.cos(radians)).toFixed(2)},${(cy + radius * Math.sin(radians)).toFixed(2)}`;
  }).join(' ');
}

function card(x, y, width, height, fill, strokeWidth) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${width * 0.13}" fill="${fill}" stroke="${COLORS.accent}" stroke-width="${strokeWidth}" filter="url(#shadow)"/>`;
}

// The front card: gradient face, amber edge, hexagons in two corners, logo in the middle.
function frontCard(x, y, width, height) {
  const pip = width * 0.07;
  return `${card(x, y, width, height, 'url(#face)', 1.9)}
    <polygon points="${hexagon(x + width * 0.19, y + height * 0.13, pip)}" fill="${COLORS.accent}"/>
    <polygon points="${hexagon(x + width * 0.81, y + height * 0.87, pip)}" fill="${COLORS.accent}"/>
    ${logo(24, x + width / 2, y + height / 2, COLORS.accent)}`;
}

// purpose "maskable": Android cuts the icon round; the cards move into the safe zone (80 %).
function iconSvg(size, purpose) {
  const cards = `<g transform="rotate(-8 24 42)">${card(9.5, 3.5, 28, 39, COLORS.raised, 1.1)}</g>
    <g transform="rotate(4 24 42)">${frontCard(11, 4, 28, 40)}</g>`;
  const content =
    purpose === 'maskable'
      ? `<g transform="translate(24 24) scale(0.8) translate(-24 -24)">${cards}</g>`
      : cards;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
    <defs>
      <radialGradient id="background" cx="0.5" cy="0.05" r="0.9"><stop offset="0" stop-color="${COLORS.glow}"/><stop offset="1" stop-color="${COLORS.surface}"/></radialGradient>
      <linearGradient id="face" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="${COLORS.overlay}"/><stop offset="1" stop-color="${COLORS.raised}"/></linearGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="${COLORS.shadow}"/></filter>
    </defs>
    <rect width="48" height="48" fill="url(#background)"/>
    ${content}
  </svg>`;
}

// Files for the manifest (Android, Windows) and the home screen of iOS and iPadOS.
const ICONS = [
  { file: 'icon-192.png', size: 192, purpose: 'any' },
  { file: 'icon-512.png', size: 512, purpose: 'any' },
  { file: 'icon-maskable-512.png', size: 512, purpose: 'maskable' },
  { file: 'apple-touch-icon.png', size: 180, purpose: 'any' },
];

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
try {
  for (const { file, size, purpose } of ICONS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<html><body style="margin:0">${iconSvg(size, purpose)}</body></html>`);
    await page.screenshot({
      path: path.join(OUT_DIR, file),
      clip: { x: 0, y: 0, width: size, height: size },
    });
    await page.close();
    process.stdout.write(`public/icons/${file}\n`);
  }
} finally {
  await browser.close();
}
