// The cover of the game "Catan" in the game choice (the picture of the development card K2): a
// low sun in a red sky over mountains, a wooded hill, a slope of clay, a settlement on a ridge,
// pasture with sheep, a track and a field of grain. The motif follows the box of the board game;
// the drawing is our own, in the direction of the resource cards (PO 16.11.2026: V3 painted with
// a thin contour). Sheep and ears are the ones of the cards "Wolle" and "Getreide".
import { blob, makeRng, n, poly, smoothClosed, smoothOpen } from './lib.mjs';
import { add, box, cross, dot, mul, sharedDefs, sub, unit } from './scene.mjs';
import { PALETTE as GRAIN, ear } from './grain.mjs';
import { PALETTE as WOOL, sheep } from './wool.mjs';

/** Colours of the picture; they become tokens `--color-art-…` when it is built for real. */
export const PALETTE = {
  'sky-1': '#8c0e19',
  'sky-2': '#b81a1d',
  'sky-3': '#d93a1e',
  'sky-4': '#ec6a22',
  'sky-5': '#f69a34',
  'sky-6': '#fcc85e',
  'sun-1': '#fffbdc',
  'sun-2': '#fff0a2',
  'sun-3': '#ffdc74',
  glow: '#ffd56a',
  'cloud-1': '#9c141b',
  'cloud-2': '#de4f27',
  'cloud-3': '#f28432',
  'cloud-4': '#ffc76e',
  'peak-1': '#8a4737',
  'peak-2': '#b76c45',
  'peak-3': '#de9c5a',
  'peak-4': '#f6ca84',
  far: '#e39a56',
  haze: '#fde2a0',
  plain: '#d6c462',
  'fir-1': '#1c3620',
  'fir-2': '#2e552b',
  'fir-3': '#55803a',
  'leaf-1': '#28431b',
  'leaf-2': '#486f25',
  'leaf-3': '#7a9f36',
  'leaf-4': '#b6cf5c',
  'trunk-1': '#38220f',
  'trunk-2': '#6f4a26',
  'hill-1': '#3c6524',
  'hill-2': '#5c8a2c',
  'hill-3': '#83ad3b',
  'hill-4': '#b1cd52',
  'hill-5': '#e3e77c',
  'hill-6': '#274519',
  'clay-1': '#8a3c21',
  'clay-2': '#b7582e',
  'clay-3': '#d98047',
  'clay-4': '#f0ab6c',
  'path-1': '#94703c',
  'path-2': '#d3ac69',
  'path-3': '#f3da9e',
  'roof-1': '#6a1c12',
  'roof-2': '#a9391f',
  'roof-3': '#dc662e',
  'roof-4': '#f7a056',
  'wall-1': '#7b5836',
  'wall-2': '#cba571',
  'wall-3': '#f4dba6',
  'stone-1': '#675d52',
  'stone-2': '#a59a88',
  'stone-3': '#ddd2b8',
  beam: '#472a16',
  window: '#ffe57c',
  smoke: '#c9794a',
  bird: '#571310',
  'bloom-1': '#f8e47c',
  'bloom-2': '#f7f3e8',
  poppy: '#dc432c',
  line: '#2c160b',
  shadow: '#16240d',
  shade: '#2b0d0b',
  halo: '#fffae0',
};

const toCss = (prefix, palette) =>
  `:root{${Object.entries(palette)
    .map(([name, value]) => `--${prefix}-${name}:${value};`)
    .join('')}}`;

/** Every colour the picture uses: its own and those of the sheep and the ears. */
export const COVER_CSS = toCss('c', PALETTE) + toCss('g', GRAIN) + toCss('s', WOOL);

const c = (name) => `var(--c-${name})`;
const g = (name) => `var(--g-${name})`;
const rad = (degrees) => (degrees * Math.PI) / 180;

const WIDTH = 100;
const HEIGHT = 110;
const HORIZON = 66;
const SUN = [54, 55.5];
const SUN_RADIUS = 25.5;

// Points along a smooth curve through `points` (Catmull-Rom), `per` for every stretch.
function sample(points, per = 8) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const at = (a, b, cc, d) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (-a + 3 * b - 3 * cc + d) * t * t * t);
      out.push([at(p0[0], p1[0], p2[0], p3[0]), at(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

// Height of a line of points at x.
function heightAt(points, x) {
  let k = 0;
  while (k < points.length - 2 && points[k + 1][0] < x) k++;
  const t = Math.min(1, Math.max(0, (x - points[k][0]) / (points[k + 1][0] - points[k][0])));
  return points[k][1] + (points[k + 1][1] - points[k][1]) * t;
}

// Ground from a crest down to below the picture.
const below = (crest) => `${smoothOpen(crest)}L${WIDTH + 6} ${HEIGHT + 6}L-6 ${HEIGHT + 6}Z`;

// ---------------------------------------------------------------------------------------------
// Sky, sun and clouds
// ---------------------------------------------------------------------------------------------

// A long thin cloud from x0 to x1, pointed at both ends.
function streak(x0, x1, y, thick, rnd) {
  const count = 9;
  const top = [];
  const bottom = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const body = Math.sin(Math.PI * t) ** 0.8;
    const x = x0 + (x1 - x0) * t;
    top.push([x, y - thick * body * rnd.range(0.3, 0.55)]);
    bottom.push([x, y + thick * body * rnd.range(0.35, 0.7)]);
  }
  return smoothClosed([...top, ...bottom.reverse().slice(1, -1)]);
}

function sky() {
  const rnd = makeRng(71);
  let svg = `<rect x="-4" y="-4" width="108" height="${HORIZON + 14}" fill="url(#cSky)"/>`;
  // Broad strokes of the brush across the sky.
  const tones = ['sky-1', 'sky-2', 'sky-3', 'sky-4', 'sky-5', 'sky-6'];
  let wash = '';
  for (let i = 0; i < 12; i++) {
    const y = 1 + i * 5.2 + rnd.range(-1.5, 1.5);
    const tone = tones[Math.min(5, Math.max(0, Math.round((y / HORIZON) * 5 + (i % 2 === 0 ? 0.9 : -0.9))))];
    const points = [];
    for (let x = -10; x <= 110; x += 20) points.push([x, y + rnd.range(-1.6, 1.6)]);
    wash += `<path d="${smoothOpen(points)}" fill="none" stroke="${c(tone)}" stroke-width="${n(rnd.range(2.4, 4.6))}" opacity=".34"/>`;
  }
  svg += `<g filter="url(#cWash)">${wash}</g>`;
  svg += `<circle cx="${SUN[0]}" cy="${SUN[1]}" r="58" fill="url(#cGlow)"/>`;
  svg += `<circle cx="${SUN[0]}" cy="${SUN[1]}" r="${SUN_RADIUS}" fill="url(#cSun)" filter="url(#cSunEdge)"/>`;

  // Clouds: dark and thin high up, glowing where they cross the sun.
  const clouds = [
    [-8, 44, 8.5, 1.6, 'cloud-1', 'cloud-2', 0.6],
    [40, 108, 15, 1.9, 'cloud-1', 'cloud-2', 0.55],
    [-10, 31, 22.5, 1.5, 'cloud-1', 'cloud-2', 0.5],
    [58, 110, 27.5, 1.4, 'cloud-2', 'cloud-3', 0.55],
    [-6, 39, 34, 1.7, 'cloud-2', 'cloud-3', 0.65],
    [55, 108, 41.5, 2.3, 'cloud-3', 'cloud-4', 0.9],
    [-8, 49, 49.5, 2.1, 'cloud-3', 'cloud-4', 0.9],
    [64, 104, 54.5, 1.3, 'cloud-3', 'cloud-4', 0.75],
    [9, 37, 57.5, 1.0, 'cloud-3', 'cloud-4', 0.6],
  ];
  let soft = '';
  for (const [x0, x1, y, thick, tone, lightTone, opacity] of clouds) {
    soft += `<path d="${streak(x0, x1, y, thick, rnd)}" fill="${c(tone)}" opacity="${opacity}"/>`;
    const inset = (x1 - x0) * 0.16;
    soft += `<path d="${streak(x0 + inset, x1 - inset * 0.6, y + thick * 0.3, thick * 0.42, rnd)}" fill="${c(lightTone)}" opacity="${n(opacity * 0.7)}"/>`;
  }
  svg += `<g filter="url(#cCloud)">${soft}</g>`;
  // Two birds far away.
  svg += `<path d="M19.5 37.6q1.5 -1.7 2.9 -.2q1.2 -1.9 3.1 -.6M27.6 32.4q1 -1.2 2 -.1q.9 -1.3 2.1 -.4" fill="none" stroke="${c('bird')}" stroke-width=".45" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`;
  return svg;
}

// ---------------------------------------------------------------------------------------------
// Mountains
// ---------------------------------------------------------------------------------------------

// A range from its peaks: the flank of every peak that looks at the sun is lit, the other in
// shade. Returns its drawing and its outline (for the haze at its foot).
function range(peaks, { from, to, base }, rnd) {
  const count = peaks.length;
  const valleys = [[from, base - 0.6]];
  for (let i = 0; i < count - 1; i++) {
    const low = Math.max(peaks[i][1], peaks[i + 1][1]);
    valleys.push([(peaks[i][0] + peaks[i + 1][0]) / 2 + rnd.range(-1.2, 1.2), low + (base - low) * rnd.range(0.28, 0.46)]);
  }
  valleys.push([to, base - 0.6]);
  const between = (a, b, t, lift) => [a[0] + (b[0] - a[0]) * t + rnd.range(-0.5, 0.5), a[1] + (b[1] - a[1]) * t - lift];
  const outline = [[from, base]];
  let faces = '';
  let lines = '';
  peaks.forEach((peak, i) => {
    const left = valleys[i];
    const right = valleys[i + 1];
    const upLeft = between(left, peak, rnd.range(0.42, 0.62), rnd.range(0.3, 1.5));
    const upRight = between(peak, right, rnd.range(0.38, 0.58), rnd.range(0.3, 1.5));
    outline.push(left, upLeft, peak, upRight);
    const isLeftOfSun = peak[0] < SUN[0];
    // The spine runs from the peak down to the foot, leaning away from the sun.
    const foot = [peak[0] + (isLeftOfSun ? -1 : 1) * rnd.range(1.4, 3.4), base];
    const mid = [(peak[0] + foot[0]) / 2 + rnd.range(-0.9, 0.9), peak[1] + (base - peak[1]) * rnd.range(0.4, 0.55)];
    const rightSide = [peak, upRight, right, [right[0], base], foot, mid];
    const leftSide = [peak, mid, foot, [left[0], base], left, upLeft];
    const litSide = isLeftOfSun ? rightSide : leftSide;
    const shadeSide = isLeftOfSun ? leftSide : rightSide;
    faces += `<path d="${poly(shadeSide)}" fill="${c('peak-1')}" opacity=".8"/>`;
    faces += `<path d="${poly(litSide)}" fill="${c('peak-3')}" opacity=".92"/>`;
    // A smaller face below the peak catches the most light.
    const shoulder = isLeftOfSun ? upRight : upLeft;
    const low = [(shoulder[0] + mid[0]) / 2 + rnd.range(-0.6, 0.6), Math.max(shoulder[1], mid[1]) + rnd.range(0.8, 2)];
    faces += `<path d="${poly([peak, shoulder, low, mid])}" fill="${c('peak-4')}" opacity=".6"/>`;
    // A darker face low on the side in shade.
    const far = isLeftOfSun ? left : right;
    faces += `<path d="${poly([mid, foot, [far[0], base], [(far[0] + mid[0]) / 2, (far[1] + mid[1]) / 2 + 1]])}" fill="${c('shade')}" opacity=".16"/>`;
    lines += `<path d="${poly([peak, mid, foot], false)}" fill="none" stroke="${c('peak-1')}" stroke-width=".28" stroke-linejoin="round" opacity=".55"/>`;
    for (let k = 0; k < 3; k++) {
      const t = rnd.range(0.25, 0.8);
      const from2 = [peak[0] + (shoulder[0] - peak[0]) * t, peak[1] + (shoulder[1] - peak[1]) * t];
      const to2 = [from2[0] + (isLeftOfSun ? -1 : 1) * rnd.range(0.4, 1.4), from2[1] + rnd.range(2.5, 5)];
      lines += `<path d="M${n(from2[0])} ${n(from2[1])}L${n(to2[0])} ${n(to2[1])}" stroke="${c('peak-2')}" stroke-width=".3" stroke-linecap="round" opacity=".6"/>`;
    }
  });
  outline.push(valleys[count], [to, base]);
  const d = poly(outline);
  return { d, svg: `<path d="${d}" fill="${c('peak-2')}"/>${faces}${lines}` };
}

function mountains() {
  const rnd = makeRng(37);
  // A pale range far away, then the two ranges that frame the sun.
  const farLeft = poly([[-6, 68], [-6, 55], [2, 51.5], [8, 54], [15, 49.5], [23, 54.5], [30, 52.5], [38, 58], [45, 61.5], [45, 68]]);
  const farRight = poly([[62, 68], [62, 61], [68, 56.5], [75, 53], [81, 55.5], [88, 50], [95, 54], [101, 51.5], [106, 54], [106, 68]]);
  let svg = `<path d="${farLeft}${farRight}" fill="${c('far')}" opacity=".75"/>`;
  const left = range(
    [
      [3, 49.5],
      [15, 42.5],
      [28.5, 50],
    ],
    { from: -8, to: 40, base: HORIZON + 2 },
    rnd,
  );
  const right = range(
    [
      [73.5, 52],
      [87, 41.5],
      [100.5, 48.5],
    ],
    { from: 63, to: 108, base: HORIZON + 2 },
    rnd,
  );
  svg += left.svg + right.svg;
  // Haze at their feet: the ranges dissolve into the light of the evening.
  svg += `<clipPath id="cPeaks"><path d="${farLeft}${farRight}${left.d}${right.d}"/></clipPath>`;
  svg += `<rect x="-4" y="40" width="108" height="30" fill="url(#cMist)" clip-path="url(#cPeaks)"/>`;
  return svg;
}

// ---------------------------------------------------------------------------------------------
// Trees and small things
// ---------------------------------------------------------------------------------------------

// A leafy tree standing on `base`, its crown about `r` in radius, lit from the upper left.
function leafyTree(x, base, r, rnd) {
  const cy = base - r * 1.45;
  const shade = `<ellipse cx="${n(x + r * 0.95)}" cy="${n(base + r * 0.05)}" rx="${n(r * 1.2)}" ry="${n(r * 0.17)}" fill="${c('shadow')}" opacity=".36"/>`;
  let svg = `<path d="M${n(x - r * 0.17)} ${n(base)}Q${n(x - r * 0.06)} ${n(base - r * 0.5)} ${n(x - r * 0.2)} ${n(cy + r * 0.2)}L${n(x + r * 0.24)} ${n(cy + r * 0.2)}Q${n(x + r * 0.07)} ${n(base - r * 0.5)} ${n(x + r * 0.2)} ${n(base)}Z" fill="${c('trunk-1')}"/>`;
  svg += `<path d="M${n(x - r * 0.12)} ${n(base)}Q${n(x - r * 0.02)} ${n(base - r * 0.5)} ${n(x - r * 0.1)} ${n(cy + r * 0.6)}" fill="none" stroke="${c('trunk-2')}" stroke-width="${n(r * 0.09)}" stroke-linecap="round"/>`;
  svg += `<path d="${blob(x, cy, r, rnd, { points: 12, wobble: 0.16, squash: 0.9 })}" fill="${c('leaf-1')}"/>`;
  svg += `<path d="${blob(x - r * 0.13, cy - r * 0.15, r * 0.8, rnd, { points: 11, wobble: 0.17, squash: 0.9 })}" fill="${c('leaf-2')}"/>`;
  const clumps = 4 + Math.floor(rnd() * 3);
  for (let i = 0; i < clumps; i++) {
    const a = rnd.range(2.5, 5.4);
    const d = rnd.range(0.14, 0.55) * r;
    const px = x - r * 0.12 + Math.cos(a) * d;
    const py = cy - r * 0.12 + Math.sin(a) * d * 0.9;
    const size = rnd.range(0.2, 0.36) * r;
    svg += `<path d="${blob(px, py, size, rnd, { points: 7, wobble: 0.2 })}" fill="${c('leaf-3')}"/>`;
    if (i % 2 === 0) svg += `<path d="${blob(px - size * 0.3, py - size * 0.32, size * 0.42, rnd, { points: 6, wobble: 0.2 })}" fill="${c('leaf-4')}" opacity=".75"/>`;
  }
  // Dabs of the brush: depth on the side in shade.
  for (let i = 0; i < 5; i++) {
    const a = rnd.range(-0.5, 1.6);
    const d = rnd.range(0.35, 0.8) * r;
    svg += `<ellipse cx="${n(x + Math.cos(a) * d)}" cy="${n(cy + Math.sin(a) * d * 0.9)}" rx="${n(rnd.range(0.12, 0.2) * r)}" ry="${n(rnd.range(0.07, 0.12) * r)}" fill="${c('shadow')}" opacity=".3"/>`;
  }
  return { shade, svg };
}

// A fir standing on y, `s` high.
function fir(x, y, s, rnd) {
  let svg = '';
  svg += `<rect x="${n(x - s * 0.04)}" y="${n(y - s * 0.12)}" width="${n(s * 0.08)}" height="${n(s * 0.14)}" fill="${c('trunk-1')}"/>`;
  for (let k = 0; k < 4; k++) {
    const base = y - s * 0.08 - k * 0.2 * s;
    const half = 0.27 * s * (1 - k * 0.2);
    const tip = base - 0.42 * s;
    const lean = rnd.range(-0.02, 0.02) * s;
    svg += `<path d="M${n(x + lean)} ${n(tip)}L${n(x + half)} ${n(base)}L${n(x - half)} ${n(base)}Z" fill="${c('fir-1')}"/>`;
    svg += `<path d="M${n(x + lean)} ${n(tip)}L${n(x + half * 0.1)} ${n(base)}L${n(x - half)} ${n(base)}Z" fill="${c('fir-2')}"/>`;
    svg += `<path d="M${n(x + lean)} ${n(tip + 0.07 * s)}L${n(x - half * 0.45)} ${n(base)}L${n(x - half)} ${n(base)}Z" fill="${c('fir-3')}" opacity=".7"/>`;
  }
  return svg;
}

// A low bush.
function bush(x, y, r, rnd) {
  let svg = `<ellipse cx="${n(x + r * 0.6)}" cy="${n(y + r * 0.1)}" rx="${n(r * 1.3)}" ry="${n(r * 0.22)}" fill="${c('shadow')}" opacity=".32"/>`;
  svg += `<path d="${blob(x, y - r * 0.55, r, rnd, { points: 9, wobble: 0.2, squash: 0.7 })}" fill="${c('leaf-1')}"/>`;
  svg += `<path d="${blob(x - r * 0.2, y - r * 0.72, r * 0.68, rnd, { points: 8, wobble: 0.2, squash: 0.7 })}" fill="${c('leaf-2')}"/>`;
  svg += `<path d="${blob(x - r * 0.38, y - r * 0.9, r * 0.34, rnd, { points: 6, wobble: 0.2, squash: 0.8 })}" fill="${c('leaf-3')}"/>`;
  return svg;
}

// Blades of grass at (x, y).
function tuft(x, y, size, rnd, tones) {
  let svg = '';
  const tone = c(rnd.pick(tones));
  for (const lean of [-0.8, 0, 0.9, 0.35].slice(0, 2 + Math.floor(rnd() * 3))) {
    svg += `<path d="M${n(x)} ${n(y)}l${n(lean * size * rnd.range(0.6, 1.2))} ${n(-size * rnd.range(1.2, 2))}" stroke="${tone}" stroke-width="${n(0.16 + size * 0.11)}" stroke-linecap="round" opacity=".85"/>`;
  }
  return svg;
}

// ---------------------------------------------------------------------------------------------
// The settlement
// ---------------------------------------------------------------------------------------------

// Its view: turned so that the fronts and the left sides show, seen a little from above. Light
// from the upper left, as on the cards.
const VIEW = (() => {
  const cT = Math.cos(rad(-28));
  const sT = Math.sin(rad(-28));
  const cP = Math.cos(rad(15));
  const sP = Math.sin(rad(15));
  const right = [cT, 0, sT];
  const up = [-sT * sP, cP, cT * sP];
  const away = [-sT * cP, -sP, cT * cP];
  const level = [-sT, 0, cT];
  return {
    right,
    up,
    away,
    level,
    toViewer: mul(away, -1),
    light: unit(add(add(mul(right, -0.7), mul(up, 0.6)), mul(away, -0.15))),
  };
})();
const UNIT = 1.72;
const TOWN = [50.5, 68.4];
const project = (p) => [TOWN[0] + dot(p, VIEW.right) * UNIT, TOWN[1] - dot(p, VIEW.up) * UNIT];
const depthOf = (p) => dot(p, VIEW.away);
// The ridge the settlement stands on: highest in the middle of the picture.
const bell = (across) => -4.4 * (1 - Math.exp(-((across / 11) ** 2)));
const groundAt = (x, z) => bell(x * VIEW.right[0] + z * VIEW.right[2]);
const isSeen = (normal) => dot(normal, VIEW.toViewer) > 0.02;

function outward(points, centre) {
  const normal = unit(cross(sub(points[1], points[0]), sub(points[2], points[0])));
  return dot(normal, sub(points[0], centre)) < 0 ? mul(normal, -1) : normal;
}

// A face of a building: its colour, light or shade by its angle to the light, a thin contour.
function paint(points, normal, tone, line = 0.15) {
  const d = poly(points.map(project));
  const t = Math.max(0, dot(normal, VIEW.light));
  let svg = `<path d="${d}" fill="${c(`${tone}-2`)}"/>`;
  if (t > 0.5) svg += `<path d="${d}" fill="${c(`${tone}-3`)}" opacity="${n(Math.min(1, (t - 0.5) * 2.4))}"/>`;
  else svg += `<path d="${d}" fill="${c(`${tone}-1`)}" opacity="${n(Math.min(1, (0.5 - t) * 1.9))}"/>`;
  svg += `<path d="${d}" fill="none" stroke="${c('line')}" stroke-width="${n(line)}" stroke-linejoin="round"/>`;
  return svg;
}

// Places on a wall: `across` 0 to 1 along its foot, `high` in units of the world above it.
function onWall(points) {
  const [a, b] = [...points].sort((p, q) => p[1] - q[1]);
  const width = Math.hypot(...sub(b, a));
  return { width, at: (across, high) => [a[0] + (b[0] - a[0]) * across, a[1] + high, a[2] + (b[2] - a[2]) * across] };
}

const pane = (wall, across, half, from, to) => poly([wall.at(across - half, from), wall.at(across + half, from), wall.at(across + half, to), wall.at(across - half, to)].map(project));

// The ground a building stands on: the lowest point below its corners, so no corner hangs in the
// air, and the shade that lies around its foot.
function footing(x, z, halfLength, halfWidth, turn) {
  const ct = Math.cos(rad(turn));
  const st = Math.sin(rad(turn));
  const flat = (lx, lz) => [x + lx * ct + lz * st, z - lx * st + lz * ct];
  const corners = (grow) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => flat(a * (halfLength + grow), b * (halfWidth + grow)));
  const y = Math.min(...corners(0).map(([px, pz]) => groundAt(px, pz))) - 0.08;
  const around = poly(corners(0.38).map(([px, pz]) => project([px, y, pz])));
  return { y, contact: `<path d="${around}" fill="${c('shadow')}" opacity=".5" stroke="${c('shadow')}" stroke-opacity=".5" stroke-width=".5" stroke-linejoin="round"/>` };
}

function house({ x, z, w, d, h, roof, turn, hasChimney = false, hasDoor = false }, rnd) {
  const hw = w / 2;
  const hd = d / 2;
  const { y, contact } = footing(x, z, hw, hd, turn);
  const ct = Math.cos(rad(turn));
  const st = Math.sin(rad(turn));
  const at = (lx, ly, lz) => [x + lx * ct + lz * st, y + ly, z - lx * st + lz * ct];
  const over = 0.24;
  const centre = at(0, h * 0.6, 0);
  let svg = '';

  const walls = [
    { points: [at(-hw, 0, -hd), at(hw, 0, -hd), at(hw, h, -hd), at(-hw, h, -hd)], isGable: false },
    { points: [at(hw, 0, hd), at(-hw, 0, hd), at(-hw, h, hd), at(hw, h, hd)], isGable: false },
    { points: [at(hw, 0, -hd), at(hw, 0, hd), at(hw, h, hd), at(hw, h + roof, 0), at(hw, h, -hd)], isGable: true },
    { points: [at(-hw, 0, hd), at(-hw, 0, -hd), at(-hw, h, -hd), at(-hw, h + roof, 0), at(-hw, h, hd)], isGable: true },
  ];
  let needsDoor = hasDoor;
  for (const { points, isGable } of walls) {
    const normal = outward(points, centre);
    if (!isSeen(normal)) continue;
    svg += paint(points, normal, 'wall');
    const wall = onWall(points);
    // Timber: a beam below the windows, on a gable the tie beam and the post to the ridge.
    const beams = [[wall.at(0, h * 0.34), wall.at(1, h * 0.34)]];
    if (isGable) beams.push([wall.at(0, h), wall.at(1, h)], [wall.at(0.5, h), wall.at(0.5, h + roof)]);
    for (const [from, to] of beams) {
      const [p, q] = [project(from), project(to)];
      svg += `<path d="M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}" stroke="${c('beam')}" stroke-width=".13" opacity=".7"/>`;
    }
    const count = Math.max(1, Math.round(wall.width / 1.5));
    for (let k = 0; k < count; k++) {
      const across = (k + 0.5) / count;
      if (needsDoor && !isGable && k === 0) {
        svg += `<path d="${pane(wall, across, 0.24 / wall.width, 0, h * 0.62)}" fill="${c('beam')}" stroke="${c('line')}" stroke-width=".1"/>`;
        needsDoor = false;
        continue;
      }
      const isLit = rnd() < 0.72;
      svg += `<path d="${pane(wall, across, 0.2 / wall.width, h * 0.44, h * 0.8)}" fill="${c(isLit ? 'window' : 'beam')}" stroke="${c('beam')}" stroke-width=".11"/>`;
    }
    if (isGable) svg += `<path d="${pane(wall, 0.5, 0.15 / wall.width, h + roof * 0.2, h + roof * 0.48)}" fill="${c(rnd() < 0.5 ? 'window' : 'beam')}" stroke="${c('beam')}" stroke-width=".1"/>`;
  }

  // The roof: two slopes that reach over the walls, rows of tiles, a light ridge.
  const drop = (roof * over) / hd;
  const roofCentre = at(0, h + roof * 0.3, 0);
  const slopes = [
    [at(-hw - over, h - drop, -hd - over), at(hw + over, h - drop, -hd - over), at(hw + over, h + roof, 0), at(-hw - over, h + roof, 0)],
    [at(hw + over, h - drop, hd + over), at(-hw - over, h - drop, hd + over), at(-hw - over, h + roof, 0), at(hw + over, h + roof, 0)],
  ]
    .map((points) => ({ points, normal: outward(points, roofCentre) }))
    .filter((slope) => isSeen(slope.normal))
    .sort((a, b) => depthOf(b.points[0]) - depthOf(a.points[0]));
  for (const { points, normal } of slopes) {
    svg += paint(points, normal, 'roof');
    const [e0, e1, r1, r0] = points.map(project);
    for (const part of [0.3, 0.54, 0.78]) {
      svg += `<path d="M${n(e0[0] + (r0[0] - e0[0]) * part)} ${n(e0[1] + (r0[1] - e0[1]) * part)}L${n(e1[0] + (r1[0] - e1[0]) * part)} ${n(e1[1] + (r1[1] - e1[1]) * part)}" stroke="${c('roof-1')}" stroke-width=".11" opacity=".55"/>`;
    }
    svg += `<path d="M${n(e0[0])} ${n(e0[1])}L${n(e1[0])} ${n(e1[1])}" stroke="${c('line')}" stroke-width=".26" stroke-linecap="round"/>`;
    svg += `<path d="M${n(r0[0])} ${n(r0[1])}L${n(r1[0])} ${n(r1[1])}" stroke="${c('roof-4')}" stroke-width=".14" stroke-linecap="round" opacity=".85"/>`;
  }

  let smokeAt = null;
  if (hasChimney) {
    const foot = h + roof * 0.62;
    const stack = box({ centre: at(hw * 0.42, foot + 0.45, -hd * 0.38), size: [0.44, 1.1, 0.44], yaw: turn });
    for (const f of stack.faces) {
      if (f.axis === 1 && f.sign === -1) continue;
      if (isSeen(f.normal)) svg += paint(f.points, f.normal, 'stone', 0.12);
    }
    smokeAt = project(at(hw * 0.42, foot + 1.05, -hd * 0.38));
  }

  const foot = project(at(0, 0, 0));
  const reach = (Math.max(w, d) * 0.5 + h * 0.55) * UNIT;
  const shadow = `${contact}<ellipse cx="${n(foot[0] + reach * 0.75)}" cy="${n(foot[1] + 0.25)}" rx="${n(reach)}" ry="${n(0.55 * UNIT)}" fill="${c('shadow')}" opacity=".3"/>`;
  return { depth: depthOf(at(0, 0, 0)), svg, shadow, smokeAt };
}

function tower({ x, z, turn, size, height, spire }) {
  const { y, contact } = footing(x, z, size / 2, size / 2, turn);
  const body = box({ centre: [x, y + height / 2, z], size: [size, height, size], yaw: turn });
  let svg = '';
  for (const f of body.faces) {
    if (f.axis === 1 || !isSeen(f.normal)) continue;
    svg += paint(f.points, f.normal, 'stone');
    const wall = onWall(f.points);
    // The opening for the bell, a slit below it, the door.
    svg += `<path d="${pane(wall, 0.5, 0.2, height * 0.74, height * 0.9)}" fill="${c('beam')}" stroke="${c('line')}" stroke-width=".1"/>`;
    svg += `<path d="${pane(wall, 0.5, 0.09, height * 0.42, height * 0.56)}" fill="${c('window')}" stroke="${c('beam')}" stroke-width=".1"/>`;
    const [p, q] = [project(wall.at(0, height * 0.66)), project(wall.at(1, height * 0.66))];
    svg += `<path d="M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}" stroke="${c('stone-1')}" stroke-width=".16" opacity=".8"/>`;
  }
  const ct = Math.cos(rad(turn));
  const st = Math.sin(rad(turn));
  const at = (lx, ly, lz) => [x + lx * ct + lz * st, y + ly, z - lx * st + lz * ct];
  const half = size / 2 + 0.2;
  const corners = [at(-half, height, -half), at(half, height, -half), at(half, height, half), at(-half, height, half)];
  const tip = at(0, height + spire, 0);
  const middle = at(0, height + spire * 0.25, 0);
  corners
    .map((corner, i) => [corner, corners[(i + 1) % 4], tip])
    .map((points) => ({ points, normal: outward(points, middle) }))
    .filter((side) => isSeen(side.normal))
    .forEach(({ points, normal }) => {
      svg += paint(points, normal, 'roof');
    });
  const foot = project([x, y, z]);
  const shadow = `${contact}<ellipse cx="${n(foot[0] + height * UNIT * 0.5)}" cy="${n(foot[1] + 0.2)}" rx="${n(height * UNIT * 0.55)}" ry="${n(0.5 * UNIT)}" fill="${c('shadow')}" opacity=".3"/>`;
  return { depth: depthOf([x, y, z]), svg, shadow, smokeAt: null };
}

// Where the ridge meets the sky, from the left to the right edge of the picture.
function ridgeCrest() {
  const points = [];
  for (let across = -40; across <= 40; across += 4) {
    const p = add(mul(VIEW.right, across), mul(VIEW.level, 13));
    points.push(project([p[0], bell(across), p[2]]));
  }
  return points;
}

function settlement() {
  const rnd = makeRng(13);
  const buildings = [
    house({ x: -7.4, z: 3.9, w: 3.6, d: 2.6, h: 2.0, roof: 1.7, turn: -6 }, rnd),
    tower({ x: -0.6, z: 4.0, turn: 4, size: 1.8, height: 5.6, spire: 2.7 }),
    house({ x: 2.7, z: 3.9, w: 4.4, d: 2.5, h: 2.5, roof: 2.0, turn: 2 }, rnd),
    house({ x: 8.6, z: 3.6, w: 3.2, d: 2.6, h: 1.8, roof: 1.6, turn: 94 }, rnd),
    house({ x: -4.9, z: 0.3, w: 3.8, d: 2.8, h: 2.1, roof: 1.9, turn: 86, hasChimney: true }, rnd),
    house({ x: 0.4, z: -0.2, w: 4.0, d: 2.6, h: 2.0, roof: 1.8, turn: 4, hasDoor: true }, rnd),
    house({ x: 5.7, z: 0.2, w: 3.4, d: 2.6, h: 2.2, roof: 1.9, turn: 92 }, rnd),
    house({ x: 10.6, z: 0.4, w: 3.0, d: 2.3, h: 1.6, roof: 1.4, turn: -8, hasChimney: true }, rnd),
    house({ x: -9.2, z: -2.3, w: 3.2, d: 2.4, h: 1.6, roof: 1.5, turn: 6, hasDoor: true }, rnd),
    house({ x: -2.5, z: -3.3, w: 3.0, d: 2.4, h: 1.5, roof: 1.4, turn: 90 }, rnd),
    house({ x: 3.4, z: -3.1, w: 3.6, d: 2.4, h: 1.6, roof: 1.5, turn: -4, hasDoor: true }, rnd),
  ];
  // Trees and bushes between and beside the houses stand in the same order of depth.
  for (const [x, z, r] of [
    [-13.4, 1.6, 2.1],
    [-11.2, 4.6, 1.6],
    [13.8, -1.6, 2.2],
    [12.6, 4.4, 1.5],
    [6.4, 6.2, 1.7],
  ]) {
    const [px, py] = project([x, groundAt(x, z), z]);
    const tree = leafyTree(px, py, r, rnd);
    buildings.push({ depth: depthOf([x, 0, z]), svg: tree.svg, shadow: tree.shade, smokeAt: null });
  }
  for (const [x, z, r] of [
    [-6.2, -4.4, 0.75],
    [0.6, -5.2, 0.6],
    [7.6, -3.6, 0.8],
    [-12.2, -2.8, 0.7],
    [9.4, -2.4, 0.6],
  ]) {
    const [px, py] = project([x, groundAt(x, z), z]);
    buildings.push({ depth: depthOf([x, 0, z]), svg: bush(px, py, r, rnd), shadow: '', smokeAt: null });
  }
  buildings.sort((a, b) => b.depth - a.depth);
  let smoke = '';
  for (const building of buildings) {
    if (building.smokeAt === null) continue;
    const [sx, sy] = building.smokeAt;
    const spine = sample([[sx, sy], [sx + 0.3, sy - 1.6], [sx + 1.3, sy - 3.4], [sx + 3, sy - 4.8], [sx + 5.4, sy - 5.6]], 6);
    const left = spine.map(([px, py], i) => [px - 0.12 - (i / spine.length) * 0.75, py - (i / spine.length) * 0.5]);
    const right = spine.map(([px, py], i) => [px + 0.12 + (i / spine.length) * 0.5, py + (i / spine.length) * 0.75]);
    smoke += `<path d="${smoothClosed([...left, ...right.reverse()])}" fill="${c('smoke')}" opacity=".5"/>`;
  }
  return {
    shadows: buildings.map((building) => building.shadow).join(''),
    svg: buildings.map((building) => building.svg).join(''),
    smoke,
  };
}

// ---------------------------------------------------------------------------------------------
// The land
// ---------------------------------------------------------------------------------------------

const FOREST_CREST = [[-6, 62.2], [6, 60.6], [17, 61], [27, 63], [36, 66.2], [45, 69.5]];
const CLAY_CREST = [[55, 70], [64, 66.2], [73, 63.4], [83, 62], [94, 62.4], [106, 64]];
const MEADOW_CREST = [[-6, 74.6], [8, 73.4], [22, 75], [36, 78.2], [50, 79.8], [64, 78.6], [78, 79.4], [92, 80.8], [106, 81.2]];
const KNOLL_CREST = [[-6, 88], [8, 87], [18, 88.6], [26, 92], [31.5, 99], [35, 107], [36.5, 116]];
const FIELD_EDGE = [[49.5, 116], [52, 105.5], [57.5, 97.5], [68, 91.4], [80, 88], [93, 86.4], [106, 85.8]];
const WAY = [[43, 116], [44.6, 106], [48.2, 98.5], [52.6, 93], [51.4, 87.6], [46.6, 83.2], [43.6, 79.2], [45.4, 75.2], [48.6, 72.2], [49.6, 70.2]];
const wayWidth = (y) => 0.5 + 7.4 * Math.max(0, (y - 70) / 46) ** 1.6;

// Soft patches on a piece of ground, lighter and darker.
function patches(rnd, count, area, tones, opacity = 0.4) {
  let svg = '';
  for (let i = 0; i < count; i++) {
    svg += `<path d="${blob(rnd.range(area[0], area[1]), rnd.range(area[2], area[3]), rnd.range(2.5, 6.5), rnd, { wobble: 0.3, squash: 0.45 })}" fill="${c(rnd.pick(tones))}" opacity="${opacity}"/>`;
  }
  return `<g filter="url(#cSoft)">${svg}</g>`;
}

// The hill with the forest on the left and the slope of clay on the right, behind the ridge.
function farHills() {
  const rnd = makeRng(29);
  let back = `<rect x="-4" y="${HORIZON - 3}" width="108" height="20" fill="${c('plain')}"/>`;
  back += `<path d="${below(FOREST_CREST)}" fill="${c('hill-1')}"/>`;
  back += `<path d="${below(CLAY_CREST)}" fill="url(#cClay)"/>`;
  // Steps cut into the clay, each with a light edge above and shade below.
  for (const [drop, from] of [
    [1.7, 66],
    [3.4, 71],
    [5.2, 77],
  ]) {
    const step = CLAY_CREST.filter((p) => p[0] >= from - 6).map(([x, y]) => [x, y + drop + Math.sin(x * 0.3) * 0.25]);
    back += `<path d="${smoothOpen(step)}" fill="none" stroke="${c('clay-1')}" stroke-width=".7" opacity=".7"/>`;
    back += `<path d="${smoothOpen(step)}" transform="translate(0 -.45)" fill="none" stroke="${c('clay-4')}" stroke-width=".3" opacity=".8"/>`;
  }
  back += `<path d="${smoothOpen(CLAY_CREST)}" fill="none" stroke="${c('clay-4')}" stroke-width=".4" opacity=".8"/>`;

  // The forest: firs in rows up the hill, the nearer ones larger.
  let things = '';
  const firs = [];
  for (let row = 0; row < 4; row++) {
    for (let x = -5 + row * 0.9; x < 44 - row * 3; x += rnd.range(1.5, 2.3)) {
      const y = heightAt(FOREST_CREST, x) + 0.4 + row * 1.7 + rnd.range(-0.4, 0.4);
      firs.push([x, y, rnd.range(3.6, 5) + row * 0.5]);
    }
  }
  firs.sort((a, b) => a[1] - b[1]);
  for (const [x, y, s] of firs) things += fir(x, y, s, rnd);
  return { back, things };
}

// The ridge with the settlement.
function ridge() {
  const rnd = makeRng(53);
  const crest = ridgeCrest();
  let back = `<path d="${below(crest)}" fill="url(#cRidge)"/>`;
  back += patches(rnd, 14, [0, 100, 68, 80], ['hill-2', 'hill-4', 'hill-3']);
  // The low sun behind the ridge lights its edge.
  back += `<path d="${smoothOpen(crest)}" transform="translate(0 .35)" fill="none" stroke="${c('hill-5')}" stroke-width=".7" opacity=".75" filter="url(#cCloud)"/>`;
  const town = settlement();
  let things = '';
  // Trees along the ridge to both sides of the settlement.
  const trees = [];
  for (const [x, lift, r] of [
    [9.6, 1.6, 2.7],
    [13.4, 0.8, 1.7],
    [22.5, 2.2, 2.1],
    [81, 1.2, 2.5],
    [84.6, 2, 1.6],
    [91.4, 1.4, 2.9],
  ]) {
    trees.push(leafyTree(x, heightAt(crest, x) + lift, r, rnd));
  }
  things += trees.map((tree) => tree.shade).join('') + `<g filter="url(#cCloud)">${town.shadows}</g>`;
  things += trees.map((tree) => tree.svg).join('');
  return { back, things, town };
}

// The track from the settlement down to the viewer.
function way() {
  const rnd = makeRng(61);
  const line = sample(WAY, 10);
  const band = (grow, shift = 0) => {
    const left = line.map(([x, y]) => [x - (wayWidth(y) * grow) / 2 + shift * wayWidth(y), y]);
    const right = line.map(([x, y]) => [x + (wayWidth(y) * grow) / 2 + shift * wayWidth(y), y]);
    return poly([...left, ...right.reverse()]);
  };
  let svg = `<path d="${band(1.28)}" fill="${c('path-1')}" opacity=".85"/>`;
  svg += `<path d="${band(1)}" fill="${c('path-2')}"/>`;
  svg += `<path d="${band(0.4, -0.14)}" fill="${c('path-3')}" opacity=".6"/>`;
  // Ruts of the carts where the track is near.
  const near = line.filter(([, y]) => y > 86);
  for (const side of [-0.24, 0.22]) {
    svg += `<path d="${poly(near.map(([x, y]) => [x + side * wayWidth(y), y]), false)}" fill="none" stroke="${c('path-1')}" stroke-width=".4" stroke-linejoin="round" opacity=".5"/>`;
  }
  // Pebbles.
  for (let i = 0; i < 26; i++) {
    const [x, y] = rnd.pick(near);
    const size = wayWidth(y) * 0.045;
    svg += `<ellipse cx="${n(x + rnd.range(-0.4, 0.4) * wayWidth(y))}" cy="${n(y + rnd.range(-0.5, 0.5))}" rx="${n(size * 1.5)}" ry="${n(size)}" fill="${c(rnd() < 0.5 ? 'path-1' : 'path-3')}" opacity=".7"/>`;
  }
  let fringe = '';
  for (const [x, y] of line) {
    if (y < 74) continue;
    for (const side of [-1, 1]) {
      if (rnd() < 0.45) continue;
      fringe += tuft(x + side * wayWidth(y) * 0.62 + rnd.range(-0.3, 0.3), y + rnd.range(-0.2, 0.4), 0.35 + (y - 70) / 60, rnd, ['hill-1', 'hill-2', 'hill-4']);
    }
  }
  return { svg, fringe };
}

// The pasture in front of the ridge, with the flock.
function meadow() {
  const rnd = makeRng(43);
  let back = `<path d="${below(MEADOW_CREST)}" fill="url(#cMeadow)"/>`;
  back += patches(rnd, 22, [0, 100, 78, 108], ['hill-2', 'hill-4', 'hill-1', 'hill-3']);
  back += `<path d="${smoothOpen(MEADOW_CREST)}" transform="translate(0 .3)" fill="none" stroke="${c('hill-5')}" stroke-width=".5" opacity=".6" filter="url(#cCloud)"/>`;
  let things = '';
  for (let i = 0; i < 150; i++) {
    const x = rnd.range(2, 98);
    const y = rnd.range(heightAt(MEADOW_CREST, x) + 1.2, 110);
    things += tuft(x, y, 0.3 + (y - 74) / 55, rnd, ['hill-1', 'hill-2', 'hill-4', 'hill-2']);
  }
  for (let group = 0; group < 7; group++) {
    const gx = rnd.range(8, 92);
    const gy = rnd.range(80, 100);
    const tone = c(rnd.pick(['bloom-1', 'bloom-2', 'bloom-1']));
    for (let i = 0; i < 8; i++) things += `<circle cx="${n(gx + rnd.range(-3.5, 3.5))}" cy="${n(gy + rnd.range(-1.2, 1.2))}" r="${n(rnd.range(0.14, 0.26))}" fill="${tone}"/>`;
  }
  // Trees and bushes to the right of the track.
  const trees = [leafyTree(72, 83.6, 3.3, rnd), leafyTree(79.2, 85, 2.5, rnd), leafyTree(88, 84, 2.9, rnd)];
  things += trees.map((tree) => tree.shade).join('') + trees.map((tree) => tree.svg).join('');
  things += bush(65.5, 85.6, 1.2, rnd) + bush(9, 79.4, 1.3, rnd);
  // The flock: the same sheep as on the card "Wolle", by where their feet stand.
  const flock = [
    [27, 79.6, 1],
    [34.4, 81.6, 0],
    [24.6, 83.8, 0],
    [31.6, 86.4, 1],
    [39, 86, 0],
    [58.4, 85, 1],
    [62.6, 82.4, 0],
  ];
  flock
    .sort((a, b) => a[1] - b[1])
    .forEach(([x, y, turned], i) => {
      const scale = 0.076 + (y - 76) * 0.006;
      const flip = turned === 1 ? -1 : 1;
      things += `<ellipse cx="${n(x + 6 * scale)}" cy="${n(y + 0.5 * scale)}" rx="${n(19 * scale)}" ry="${n(4 * scale)}" fill="${c('shadow')}" opacity=".36"/>`;
      things += `<g transform="translate(${n(x)} ${n(y - 21 * scale)}) scale(${n(flip * scale)} ${n(scale)})">${sheep({ head: 'dark', detail: 'small', isGrazing: i % 3 !== 1, line: 0.2 / scale, seed: 200 + i })}</g>`;
    });
  return { back, things };
}

// The knoll in the foreground on the left, with its tree.
function knoll() {
  const rnd = makeRng(47);
  let back = `<path d="${below(KNOLL_CREST).replace(`L${WIDTH + 6} ${HEIGHT + 6}`, '')}" fill="url(#cKnoll)"/>`;
  back += patches(rnd, 12, [0, 32, 90, 110], ['hill-2', 'hill-6', 'hill-1'], 0.5);
  back += `<path d="${smoothOpen(KNOLL_CREST)}" transform="translate(0 .3)" fill="none" stroke="${c('hill-4')}" stroke-width=".55" opacity=".7" filter="url(#cCloud)"/>`;
  let things = '';
  const blades = [];
  for (let i = 0; i < 170; i++) {
    const y = rnd.range(88, 112);
    const reach = heightAt(KNOLL_CREST.map(([x, yy]) => [yy, x]), y);
    const x = rnd.range(1, Math.max(4, reach - 0.8));
    if (y < heightAt(KNOLL_CREST, x) + 0.6) continue;
    blades.push([x, y]);
  }
  blades.sort((a, b) => a[1] - b[1]);
  for (const [x, y] of blades) things += tuft(x, y, 0.6 + (y - 86) / 30, rnd, ['hill-2', 'hill-1', 'hill-3', 'hill-6']);
  for (const [gx, gy, tone] of [
    [9, 97, 'poppy'],
    [23, 101, 'bloom-2'],
    [14, 106, 'bloom-1'],
    [28, 95.5, 'poppy'],
  ]) {
    for (let i = 0; i < 7; i++) things += `<circle cx="${n(gx + rnd.range(-3, 3))}" cy="${n(gy + rnd.range(-1.6, 1.6))}" r="${n(rnd.range(0.26, 0.42))}" fill="${c(tone)}"/>`;
  }
  const tree = leafyTree(15.5, 89.6, 6.3, rnd);
  return { back, things, tree: tree.shade + tree.svg };
}

// The field of grain in the foreground on the right.
function field() {
  const rnd = makeRng(19);
  const shape = `${smoothOpen(FIELD_EDGE)}L${WIDTH + 6} ${HEIGHT + 6}Z`;
  let inside = '';
  // Rows run away from the viewer towards one point far behind the field.
  for (let xb = -30; xb <= 190; xb += 3.1) {
    const d = `M${n(xb)} 116L64 70`;
    inside += `<path d="${d}" stroke="${g('crop-1')}" stroke-width=".5" opacity=".34"/>`;
    inside += `<path d="${d}" transform="translate(.9 0)" stroke="${g('crop-4')}" stroke-width=".4" opacity=".3"/>`;
  }
  for (let i = 0; i < 560; i++) {
    const y = 86 + 26 * Math.sqrt(rnd());
    const x = rnd.range(48, 104);
    const size = 0.4 + ((y - 86) / 26) * 1.15;
    const tone = rnd.pick(['crop-3', 'crop-4', 'crop-1', 'crop-3']);
    inside += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(0.85 * size)}" ry="${n(0.3 * size)}" transform="rotate(${n(rnd.range(-80, -40))} ${n(x)} ${n(y)})" fill="${g(tone)}" opacity="${tone === 'crop-1' ? '.45' : '.75'}"/>`;
  }
  let back = `<clipPath id="cFieldClip"><path d="${shape}"/></clipPath>`;
  // The standing grain is a low wall towards the track: shade at its foot.
  back += `<path d="${smoothOpen(FIELD_EDGE)}" transform="translate(-.7 .5)" fill="none" stroke="${c('shadow')}" stroke-width="1.6" opacity=".3" filter="url(#cCloud)"/>`;
  back += `<path d="${shape}" fill="url(#cField)"/><g clip-path="url(#cFieldClip)">${patches(rnd, 10, [50, 104, 88, 110], ['hill-5', 'path-1'], 0.22)}${inside}</g>`;
  // Its edge: the tips of the stalks, lit by the low sun.
  let edge = '';
  const line = sample(FIELD_EDGE, 14);
  for (const [x, y] of line) {
    for (let k = 0; k < 3; k++) {
      const size = 0.5 + Math.max(0, (y - 85) / 30) * 1.3;
      const px = x + rnd.range(-0.5, 0.5);
      edge += `<path d="M${n(px)} ${n(y + 0.5)}l${n(rnd.range(-0.3, 0.3) * size)} ${n(-rnd.range(1.1, 2) * size)}" stroke="${g(rnd.pick(['crop-3', 'crop-4', 'crop-1']))}" stroke-width="${n(0.2 + size * 0.14)}" stroke-linecap="round" opacity=".9"/>`;
    }
  }
  back += edge;

  // Stalks close to the viewer, their ears those of the sheaf on the card "Getreide".
  const stalks = [];
  for (let i = 0; i < 9; i++) stalks.push({ x: 56.5 + i * 4.9 + rnd.range(-1.1, 1.1), top: rnd.range(97.5, 104.5), lean: rnd.range(-0.3, 0.42) });
  stalks.sort((a, b) => a.top - b.top);
  let stems = '';
  let heads = '';
  let awns = '';
  for (const stalk of stalks) {
    const foot = [stalk.x - stalk.lean * 7, 117];
    const bend = [stalk.x - stalk.lean * 2.4, (117 + stalk.top) / 2];
    const d = `M${n(foot[0])} ${n(foot[1])}Q${n(bend[0])} ${n(bend[1])} ${n(stalk.x)} ${n(stalk.top)}`;
    stems += `<path d="${d}" fill="none" stroke="${g('straw-1')}" stroke-width=".8" stroke-linecap="round"/>`;
    stems += `<path d="${d}" fill="none" stroke="${g('straw-3')}" stroke-width=".46" stroke-linecap="round"/>`;
    // A leaf bending away from the stalk.
    const leafAt = [bend[0] + (stalk.x - bend[0]) * 0.2, bend[1] + (stalk.top - bend[1]) * 0.2];
    const side = stalk.lean > 0 ? -1 : 1;
    stems += `<path d="M${n(leafAt[0])} ${n(leafAt[1])}q${n(side * 1.6)} -2.6 ${n(side * 3.6)} -1.4q${n(side * -1.9)} -.2 ${n(side * -3.6)} 1.4Z" fill="${g('straw-2')}" stroke="${g('straw-1')}" stroke-width=".14"/>`;
    const head = ear([stalk.x, stalk.top], -Math.PI / 2 + stalk.lean * 1.25, rnd.range(6.2, 7.6), rnd, true, rnd.pick(['straw-3', 'straw-2', 'straw-3']));
    heads += head.body;
    awns += head.awns;
  }
  return { back, stalks: `${stems}<g filter="url(#pLineSmall)">${heads}</g>${awns}` };
}

// ---------------------------------------------------------------------------------------------
// The whole picture
// ---------------------------------------------------------------------------------------------

function defs() {
  const stops = (list) => list.map(([offset, color, opacity]) => `<stop offset="${offset}" stop-color="${color}"${opacity === undefined ? '' : ` stop-opacity="${opacity}"`}/>`).join('');
  const down = (id, from, to, list) => `<linearGradient id="${id}" x1="0" x2="0" y1="${from}" y2="${to}" gradientUnits="userSpaceOnUse">${stops(list)}</linearGradient>`;
  const round = (id, at, radius, list) => `<radialGradient id="${id}" cx="${at[0]}" cy="${at[1]}" r="${radius}" gradientUnits="userSpaceOnUse">${stops(list)}</radialGradient>`;
  const blur = (id, size) => `<filter id="${id}" x="-12" y="-12" width="124" height="134" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="${size}"/></filter>`;
  return (
    sharedDefs({ halo: c('halo'), haze: c('haze'), shade: c('shade'), line: c('line') }) +
    down('cSky', 0, HORIZON, [
      [0, c('sky-1')],
      [0.2, c('sky-2')],
      [0.43, c('sky-3')],
      [0.64, c('sky-4')],
      [0.83, c('sky-5')],
      [1, c('sky-6')],
    ]) +
    round('cGlow', SUN, 58, [
      [0.4, c('glow'), 0.95],
      [0.62, c('sky-5'), 0.5],
      [1, c('sky-4'), 0],
    ]) +
    round('cSun', SUN, SUN_RADIUS, [
      [0, c('sun-1')],
      [0.62, c('sun-1')],
      [0.9, c('sun-2')],
      [1, c('sun-3')],
    ]) +
    down('cMist', 52, HORIZON + 2, [
      [0, c('haze'), 0],
      [1, c('haze'), 0.62],
    ]) +
    round('cBloom', [SUN[0], 63], 40, [
      [0, c('glow'), 0.5],
      [1, c('glow'), 0],
    ]) +
    down('cClay', 62, 72, [
      [0, c('clay-3')],
      [1, c('clay-2')],
    ]) +
    down('cRidge', 64, 80, [
      [0, c('hill-4')],
      [0.45, c('hill-3')],
      [1, c('hill-2')],
    ]) +
    down('cMeadow', 74, 108, [
      [0, c('hill-3')],
      [1, c('hill-2')],
    ]) +
    down('cKnoll', 87, 112, [
      [0, c('hill-1')],
      [1, c('hill-6')],
    ]) +
    down('cField', 86, 112, [
      [0, g('crop-3')],
      [0.5, g('crop-2')],
      [1, g('crop-1')],
    ]) +
    down('cLow', 90, HEIGHT, [
      [0, c('shadow'), 0],
      [1, c('shadow'), 0.34],
    ]) +
    blur('cWash', 2.2) +
    blur('cSoft', 0.9) +
    blur('cCloud', 0.32) +
    blur('cSunEdge', 0.4) +
    blur('cEdge', 3.4)
  );
}

/** The picture as SVG, 100 by 110 as the landscape before it; `css` adds the colours to check it by hand. */
export function coverSvg(css = '') {
  const back = (svg) => `<g filter="url(#pBack)">${svg}</g>`;
  const thing = (svg) => `<g filter="url(#pThing)">${svg}</g>`;
  const far = farHills();
  const top = ridge();
  const track = way();
  const pasture = meadow();
  const front = knoll();
  const grain = field();
  const body =
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${c('sky-3')}"/>` +
    back(sky()) +
    back(mountains()) +
    back(far.back) +
    thing(far.things) +
    `<circle cx="${SUN[0]}" cy="63" r="40" fill="url(#cBloom)"/>` +
    back(top.back) +
    thing(top.things) +
    `<g filter="url(#cCloud)">${top.town.smoke}</g>` +
    `<g filter="url(#pLineSmall)">${thing(top.town.svg)}</g>` +
    back(pasture.back + track.svg) +
    thing(pasture.things + track.fringe) +
    back(front.back + grain.back) +
    thing(front.things + front.tree + grain.stalks) +
    `<rect y="88" width="${WIDTH}" height="${HEIGHT - 88}" fill="url(#cLow)"/>` +
    `<rect x="-2" y="-2" width="${WIDTH + 4}" height="${HEIGHT + 4}" fill="none" stroke="${c('shade')}" stroke-width="9" opacity=".42" filter="url(#cEdge)"/>`;
  const style = css === '' ? '' : `<style>${css}</style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice">${style}<defs>${defs()}</defs>${body}</svg>`;
}
