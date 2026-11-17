// Resource card "Holz": a pile of five logs (W2) as a sticker over a forest seen from above at
// an angle, as on the cards of the board game. Drawn from code: every shape of the pile is a
// projection of a 3D pile, so the logs really lie on each other; one light from the upper left.
import { blob, makeRng, n, poly, smoothClosed, smoothOpen } from './lib.mjs';

/** Colours of the card; they become tokens `--color-art-…` when the card is built for real. */
export const PALETTE = {
  'ground-1': '#2a4822',
  'ground-2': '#365c2b',
  'ground-3': '#213a1c',
  'ground-4': '#4a7a3c',
  'leaf-1': '#22461c',
  'leaf-2': '#3a7228',
  'leaf-3': '#5b9b36',
  'leaf-4': '#8fc454',
  'leafy-2': '#4d7926',
  'leafy-3': '#7ba538',
  'leafy-4': '#b3d25e',
  'fir-1': '#123222',
  'fir-2': '#1c4a32',
  'fir-3': '#2c6944',
  'fir-4': '#4f935f',
  shade: '#0b1a0c',
  'water-1': '#1a382e',
  'water-2': '#3d7c92',
  'water-3': '#7dbbcb',
  'water-4': '#e6f5f3',
  haze: '#c4e3d6',
  'bark-1': '#371f10',
  'bark-2': '#774724',
  'bark-3': '#a66d3a',
  'bark-4': '#d6a36a',
  'wood-1': '#f1d19a',
  'wood-2': '#dfb070',
  'wood-3': '#b07a40',
  'wood-4': '#6b411d',
  'wood-5': '#fcebc6',
  line: '#2a180c',
  halo: '#fffae0',
};

const c = (name) => `var(--w-${name})`;
const rad = (degrees) => (degrees * Math.PI) / 180;

// ---------------------------------------------------------------------------------------------
// The pile of logs
// ---------------------------------------------------------------------------------------------

// View: turned 38° to the side and 30° down. World: x across the logs, y up, z along the logs.
const YAW = rad(38);
const PITCH = rad(30);
const cT = Math.cos(YAW);
const sT = Math.sin(YAW);
const cP = Math.cos(PITCH);
const sP = Math.sin(PITCH);
// Units of the picture per unit of the world; set by the pile being drawn.
let SCALE = 6.2;

const project = (x, y, z) => {
  const depth = -x * sT + z * cT;
  return [(x * cT + z * sT) * SCALE, (-y * cP - depth * sP) * SCALE];
};

// Direction to the light in the world: from the upper left, slightly from the front.
const LIGHT = (() => {
  const right = [cT, 0, sT];
  const up = [-sT * sP, cP, cT * sP];
  const away = [-sT * cP, -sP, cT * cP];
  const v = [0, 1, 2].map((i) => -0.55 * right[i] + 0.62 * up[i] - 0.56 * away[i]);
  const length = Math.hypot(...v);
  return v.map((part) => part / length);
})();

// The angle around a log that faces the viewer; the outline lies a quarter turn to each side.
const FACING = Math.atan2(sP, sT * cP);
const EDGE_A = FACING - Math.PI / 2;
const EDGE_B = FACING + Math.PI / 2;

// The logs: three on the ground touching each other, two in the grooves above. Radii and lengths
// differ a little, so the pile is not symmetric.
function pileLogs(layout) {
  if (layout === 'three') {
    const low = [
      { x: 0, y: 1, r: 1 },
      { x: 2 * Math.sqrt(1.05), y: 1.05, r: 1.05 },
    ];
    const dx = low[1].x - low[0].x;
    const dy = low[1].y - low[0].y;
    const d = Math.hypot(dx, dy);
    const da = 0.96 + low[0].r;
    const db = 0.96 + low[1].r;
    const along = (da * da - db * db + d * d) / (2 * d);
    const height = Math.sqrt(da * da - along * along);
    const high = { x: low[0].x + (along * dx - height * dy) / d, y: low[0].y + (along * dy + height * dx) / d, r: 0.96 };
    const span = [
      [0, 3.5],
      [0.25, 3.3],
      [0.5, 2.9],
    ];
    return [...low, high].map((log, i) => ({ ...log, z0: span[i][0], z1: span[i][0] + span[i][1], seed: 300 + i * 13 }));
  }
  const radii = [1.04, 1.02, 1.07];
  const xs = [0];
  xs.push(xs[0] + 2 * Math.sqrt(radii[0] * radii[1]));
  xs.push(xs[1] + 2 * Math.sqrt(radii[1] * radii[2]));
  const bottom = radii.map((r, i) => ({ x: xs[i], y: r, r }));
  const onTop = (a, b, r) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const da = r + a.r;
    const db = r + b.r;
    const along = (da * da - db * db + d * d) / (2 * d);
    const height = Math.sqrt(da * da - along * along);
    return { x: a.x + (along * dx - height * dy) / d, y: a.y + (along * dy + height * dx) / d, r };
  };
  const top = [onTop(bottom[0], bottom[1], 0.97), onTop(bottom[1], bottom[2], 0.91)];
  if (Math.hypot(top[1].x - top[0].x, top[1].y - top[0].y) < top[0].r + top[1].r) {
    throw new Error('the upper logs run into each other');
  }
  // The upper logs lie a little further back, so every cut end of the lower row stays in view.
  const ends = [
    [-0.2, 7.0],
    [0.1, 7.4],
    [-0.05, 6.6],
    [0.3, 6.9],
    [0.5, 6.2],
  ];
  return [...bottom, ...top].map((log, i) => ({
    ...log,
    z0: ends[i][0],
    z1: ends[i][0] + ends[i][1],
    seed: 100 + i * 17,
  }));
}

function ring(log, z, rho, from, to, steps, cx = 0, cy = 0, wobble = null) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    const r = rho * (wobble === null ? 1 : wobble(a));
    points.push(project(log.x + cx + Math.cos(a) * r, log.y + cy + Math.sin(a) * r, z));
  }
  return points;
}

function drawLog(log, style, index, isSmall = false) {
  const rnd = makeRng(log.seed);
  const { z0, z1 } = log;
  const hull = [
    ...ring(log, z1, log.r, EDGE_A, EDGE_B, 24),
    ...ring(log, z0, log.r, EDGE_B, EDGE_A + Math.PI * 2, 24),
  ];
  const hullD = poly(hull);
  let defs = '';
  let svg = `<path d="${hullD}" fill="${c('bark-2')}"/>`;

  // Light around the log: brightness of the surface at angle a.
  const lit = (a) => Math.max(0, Math.cos(a) * LIGHT[0] + Math.sin(a) * LIGHT[1]);
  const band = (from, to) =>
    poly([...ring(log, z0, log.r, from, to, 10), ...ring(log, z1, log.r, to, from, 10)]);

  if (style === 'flat') {
    // Three clear tones with hard edges.
    const steps = 40;
    let lightFrom = null;
    let lightTo = null;
    let darkFrom = null;
    let darkTo = null;
    for (let i = 0; i <= steps; i++) {
      const a = EDGE_A + ((EDGE_B - EDGE_A) * i) / steps;
      if (lit(a) > 0.62) {
        lightFrom ??= a;
        lightTo = a;
      }
      if (lit(a) < 0.2) {
        darkFrom ??= a;
        darkTo = a;
      }
    }
    if (lightFrom !== null) svg += `<path d="${band(lightFrom, lightTo)}" fill="${c('bark-3')}"/>`;
    if (darkFrom !== null) svg += `<path d="${band(darkFrom, darkTo)}" fill="${c('bark-1')}" opacity=".7"/>`;
  } else {
    // Soft roundness: two gradients across the log, one for light, one for shade.
    const mid = (z0 + z1) / 2;
    const centre = project(log.x, log.y, mid);
    const axis = project(0, 0, 1);
    const origin = project(0, 0, 0);
    const dir = [axis[0] - origin[0], axis[1] - origin[1]];
    const length = Math.hypot(dir[0], dir[1]);
    const across = [-dir[1] / length, dir[0] / length];
    const offset = (a) => {
      const p = project(log.x + Math.cos(a) * log.r, log.y + Math.sin(a) * log.r, mid);
      return (p[0] - centre[0]) * across[0] + (p[1] - centre[1]) * across[1];
    };
    const oa = offset(EDGE_A);
    const ob = offset(EDGE_B);
    const at = (o) => [centre[0] + across[0] * o, centre[1] + across[1] * o];
    const [x1, y1] = at(oa);
    const [x2, y2] = at(ob);
    const stops = (color, strength) => {
      let list = '';
      for (let i = 0; i <= 12; i++) {
        const a = EDGE_A + ((EDGE_B - EDGE_A) * i) / 12;
        const where = (offset(a) - oa) / (ob - oa);
        list += `<stop offset="${n(where)}" stop-color="${color}" stop-opacity="${n(Math.min(1, Math.max(0, strength(lit(a)))))}"/>`;
      }
      return list;
    };
    const gradient = (id, color, strength) =>
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stops(color, strength)}</linearGradient>`;
    defs += gradient(`wl${index}`, c('bark-4'), (t) => (t - 0.42) * 1.5);
    defs += gradient(`wd${index}`, c('bark-1'), (t) => (0.42 - t) * 2.3);
    svg += `<path d="${hullD}" fill="url(#wl${index})"/><path d="${hullD}" fill="url(#wd${index})"/>`;
  }

  // Bark: furrows along the log, each a little wavy; more and finer ones when painted.
  const furrows = isSmall ? 0 : style === 'flat' ? 7 : 34;
  for (let i = 0; i < furrows; i++) {
    const a = rnd.range(EDGE_A + 0.22, EDGE_B - 0.12);
    const start = rnd.range(z0 + 0.25, z1 - 1.6);
    const end = Math.min(z1 - 0.2, start + rnd.range(1.1, style === 'flat' ? 3.4 : 2.6));
    const phase = rnd() * 6;
    const points = [];
    for (let k = 0; k <= 6; k++) {
      const z = start + ((end - start) * k) / 6;
      const wave = a + Math.sin(phase + k * 1.1) * 0.035;
      points.push(project(log.x + Math.cos(wave) * log.r, log.y + Math.sin(wave) * log.r, z));
    }
    const isLit = lit(a) > 0.55;
    if (style === 'flat') {
      svg += `<path d="${smoothOpen(points)}" fill="none" stroke="${c(isLit ? 'bark-2' : 'bark-1')}" stroke-width=".55" stroke-linecap="round" opacity="${isLit ? '.9' : '.75'}"/>`;
    } else {
      const width = rnd.range(0.22, 0.48);
      svg += `<path d="${smoothOpen(points)}" fill="none" stroke="${c('bark-1')}" stroke-width="${n(width)}" stroke-linecap="round" opacity="${n(rnd.range(0.35, 0.7))}"/>`;
      if (isLit && rnd() < 0.6) {
        svg += `<path d="${smoothOpen(points)}" transform="translate(-.12 -.3)" fill="none" stroke="${c('bark-4')}" stroke-width="${n(width * 0.7)}" stroke-linecap="round" opacity=".4"/>`;
      }
    }
  }

  // The cut end: bark, sapwood, heartwood, uneven growth rings around an off-centre pith, cracks.
  const cap = poly(ring(log, z0, log.r, 0, Math.PI * 2, 40));
  const wobble = (() => {
    const p1 = rnd() * 6;
    const p2 = rnd() * 6;
    return (a) => 1 + 0.035 * Math.sin(2 * a + p1) + 0.025 * Math.sin(3 * a + p2);
  })();
  const pith = [rnd.range(-0.13, 0.13) * log.r, rnd.range(-0.13, 0.13) * log.r];
  const woodR = log.r * 0.86;
  svg += `<path d="${cap}" fill="${c('bark-1')}"/>`;
  svg += `<path d="${smoothClosed(ring(log, z0, woodR, 0, Math.PI * 2, 28, 0, 0, wobble).slice(0, -1))}" fill="${c('wood-1')}"/>`;
  svg += `<path d="${smoothClosed(ring(log, z0, woodR * 0.56, 0, Math.PI * 2, 20, pith[0], pith[1], wobble).slice(0, -1))}" fill="${c('wood-2')}" opacity="${style === 'flat' ? '.75' : '.6'}"/>`;
  const reach = woodR - Math.hypot(pith[0], pith[1]) - 0.05 * log.r;
  const rings = isSmall ? 1 : style === 'flat' ? 3 : 6;
  let at = reach * (isSmall ? 0.55 : style === 'flat' ? 0.3 : 0.14);
  for (let k = 0; k < rings && at < reach; k++) {
    const d = smoothClosed(ring(log, z0, at, 0, Math.PI * 2, 20, pith[0], pith[1], wobble).slice(0, -1));
    svg += `<path d="${d}" fill="none" stroke="${c('wood-3')}" stroke-width="${n(isSmall ? 0.3 : style === 'flat' ? 0.42 : rnd.range(0.16, 0.3))}" opacity="${n(style === 'flat' ? 0.9 : rnd.range(0.55, 0.9))}"/>`;
    at += (reach * (style === 'flat' ? 0.3 : rnd.range(0.11, 0.2)));
  }
  if (!isSmall) svg += `<path d="${poly(ring(log, z0, 0.07 * log.r, 0, Math.PI * 2, 8, pith[0], pith[1]))}" fill="${c('wood-4')}"/>`;
  // One fine drying crack on some of the logs; two would read as the hands of a clock.
  const cracks = isSmall || rnd() < 0.35 ? 0 : 1;
  for (let k = 0; k < cracks; k++) {
    const a = rnd() * Math.PI * 2;
    const far = rnd.range(0.3, 0.55) * reach;
    const tip = project(log.x + pith[0] + Math.cos(a) * far, log.y + pith[1] + Math.sin(a) * far, z0);
    const left = project(log.x + pith[0] + Math.cos(a + 1.5) * 0.045, log.y + pith[1] + Math.sin(a + 1.5) * 0.045, z0);
    const right = project(log.x + pith[0] + Math.cos(a - 1.5) * 0.045, log.y + pith[1] + Math.sin(a - 1.5) * 0.045, z0);
    svg += `<path d="${poly([left, tip, right])}" fill="${c('wood-4')}" opacity=".6"/>`;
  }
  if (style !== 'flat') {
    // A light edge where the saw left the rim, and the bark standing out against the wood.
    svg += `<path d="${poly(ring(log, z0, woodR * 0.97, 2.2, 4.4, 14), false)}" fill="none" stroke="${c('wood-5')}" stroke-width=".3" stroke-linecap="round" opacity=".7"/>`;
  }

  // Contour: clear and dark when drawn, thin when mixed, none when painted.
  const line = isSmall ? 0.5 : style === 'flat' ? 0.75 : style === 'mix' ? 0.5 : 0;
  if (line > 0) {
    svg += `<path d="${hullD}" fill="none" stroke="${c('line')}" stroke-width="${n(line)}" stroke-linejoin="round"/>`;
    svg += `<path d="${cap}" fill="none" stroke="${c('line')}" stroke-width="${n(line)}"/>`;
  } else {
    svg += `<path d="${cap}" fill="none" stroke="${c('bark-1')}" stroke-width=".3"/>`;
  }
  const depth = (-log.x * sT + ((z0 + z1) / 2) * cT) * cP - log.y * sP;
  return { svg, defs, hullD, depth, points: hull };
}

function pile(style, { layout = 'five', scale = 6.2, centre = [50, 74.5], id = 'wc' } = {}) {
  SCALE = scale;
  const isSmall = layout === 'three';
  const drawn = pileLogs(layout)
    .map((log, i) => drawLog(log, isSmall ? 'flat' : style, i, isSmall))
    .sort((a, b) => b.depth - a.depth);
  // Centre of the pile on the centre of the picture.
  const all = drawn.flatMap((log) => log.points);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const dx = centre[0] - (Math.min(...xs) + Math.max(...xs)) / 2;
  const dy = centre[1] - (Math.min(...ys) + Math.max(...ys)) / 2;
  let defs = '';
  let svg = '';
  drawn.forEach((log, i) => {
    defs += log.defs;
    if (i > 0) {
      // Shade a log casts on the logs behind and below it, only where those are.
      defs += `<clipPath id="${id}${i}">${drawn
        .slice(0, i)
        .map((before) => `<path d="${before.hullD}"/>`)
        .join('')}</clipPath>`;
      svg += `<g clip-path="url(#${id}${i})"><path d="${log.hullD}" transform="translate(${isSmall ? '.3 .4' : '.9 1.25'})" fill="${c('line')}" opacity="${style === 'flat' ? '.42' : '.5'}"${isSmall ? '' : ' filter="url(#wSoft)"'}/></g>`;
    }
    svg += log.svg;
  });
  return { defs, svg: `<g transform="translate(${n(dx)} ${n(dy)})">${svg}</g>` };
}

// ---------------------------------------------------------------------------------------------
// The forest
// ---------------------------------------------------------------------------------------------

// A leafy tree seen from above at an angle: an uneven crown, lit from the upper left.
function leafyTree(x, y, r, rnd, style, isYellow) {
  const mid = isYellow ? 'leafy-2' : 'leaf-2';
  const light = isYellow ? 'leafy-3' : 'leaf-3';
  const top = isYellow ? 'leafy-4' : 'leaf-4';
  const shade = `<path d="${blob(x + r * 0.5, y + r * 0.62, r * 0.95, rnd, { squash: 0.8 })}" fill="${c('shade')}" opacity=".42"/>`;
  let svg = `<path d="${blob(x, y, r, rnd, { points: 12, wobble: 0.16 })}" fill="${c('leaf-1')}"/>`;
  svg += `<path d="${blob(x - r * 0.13, y - r * 0.16, r * 0.8, rnd, { points: 11, wobble: 0.17 })}" fill="${c(mid)}"/>`;
  const clumps = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < clumps; i++) {
    const a = rnd.range(2.3, 5.3);
    const d = rnd.range(0.12, 0.5) * r;
    const cx = x - r * 0.12 + Math.cos(a) * d;
    const cy = y - r * 0.14 + Math.sin(a) * d;
    const size = rnd.range(0.2, 0.36) * r;
    svg += `<path d="${blob(cx, cy, size, rnd, { points: 7, wobble: 0.2 })}" fill="${c(light)}"/>`;
    if (rnd() < 0.45) {
      svg += `<path d="${blob(cx - size * 0.3, cy - size * 0.32, size * 0.42, rnd, { points: 6, wobble: 0.2 })}" fill="${c(top)}" opacity="${style === 'flat' ? '.6' : '.7'}"/>`;
    }
  }
  if (style !== 'flat') {
    // Dabs of the brush: leaves in the light, depth in the shade.
    for (let i = 0; i < 7; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd.range(0.2, 0.85) * r;
      const cx = x + Math.cos(a) * d;
      const cy = y + Math.sin(a) * d;
      const isShade = Math.cos(a - 0.9) > 0.1;
      svg += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rnd.range(0.1, 0.2) * r)}" ry="${n(rnd.range(0.07, 0.13) * r)}" transform="rotate(${n(rnd.range(-50, 20))} ${n(cx)} ${n(cy)})" fill="${c(isShade ? 'shade' : light)}" opacity="${isShade ? '.3' : '.55'}"/>`;
    }
  }
  return { shade, svg };
}

// A fir seen from above at an angle: tiers of branches up to the tip, left half in the light.
function fir(x, y, s, rnd, style) {
  const lean = rnd.range(-0.06, 0.06) * s;
  const shade = `<path d="${blob(x + s * 0.42, y + s * 0.2, s * 0.5, rnd, { squash: 0.6 })}" fill="${c('shade')}" opacity=".45"/>`;
  let svg = '';
  const tiers = 4;
  for (let k = 0; k < tiers; k++) {
    const base = y - k * 0.3 * s;
    const half = 0.5 * s * (1 - k * 0.2);
    const tipX = x + lean * (k + 1);
    const tipY = base - 0.66 * s * (1 - k * 0.07);
    const teeth = 5 - (k > 1 ? 1 : 0);
    const skirt = [];
    for (let j = 0; j <= teeth * 2; j++) {
      const u = j / (teeth * 2);
      const sag = Math.sin(u * Math.PI) * 0.15 * s;
      const tooth = j % 2 === 0 ? 0.07 * s : -0.045 * s;
      skirt.push([x - half + 2 * half * u + rnd.range(-0.03, 0.03) * s, base + sag + tooth + rnd.range(-0.025, 0.025) * s]);
    }
    svg += `<path d="${poly([[tipX, tipY], ...skirt.slice().reverse()])}" fill="${c(k === 0 ? 'fir-1' : 'fir-2')}"/>`;
    // The lit half ends at an uneven line a little left of the middle.
    const cut = Math.floor(skirt.length * 0.46);
    const litPart = skirt.slice(0, cut + 1);
    const last = litPart[litPart.length - 1];
    const inner = [last[0] + 0.03 * s, (last[1] + tipY) / 2 + rnd.range(-0.04, 0.04) * s];
    svg += `<path d="${poly([[tipX, tipY], ...litPart, inner])}" fill="${c('fir-3')}"/>`;
    if (k > 0 || style !== 'flat') {
      const first = skirt[0];
      const edge = skirt[1];
      svg += `<path d="${poly([[tipX - 0.02 * s, tipY + 0.1 * s], first, edge])}" fill="${c('fir-4')}" opacity="${style === 'flat' ? '.75' : '.6'}"/>`;
    }
  }
  return { shade, svg };
}

// A stump of a felled tree in the clearing.
function stump(x, y, s) {
  const top = (rx, ry) => `M${n(x - rx)} ${n(y)}A${n(rx)} ${n(ry)} 0 1 0 ${n(x + rx)} ${n(y)}A${n(rx)} ${n(ry)} 0 1 0 ${n(x - rx)} ${n(y)}Z`;
  const h = s * 0.75;
  const ry = s * 0.56;
  let svg = `<ellipse cx="${n(x + s * 0.75)}" cy="${n(y + h + s * 0.25)}" rx="${n(s * 1.2)}" ry="${n(s * 0.55)}" fill="${c('shade')}" opacity=".4"/>`;
  svg += `<path d="M${n(x - s)} ${n(y)}V${n(y + h)}A${n(s)} ${n(ry)} 0 0 0 ${n(x + s)} ${n(y + h)}V${n(y)}Z" fill="${c('bark-2')}"/>`;
  svg += `<path d="M${n(x + s * 0.1)} ${n(y)}V${n(y + h + ry)}A${n(s)} ${n(ry)} 0 0 0 ${n(x + s)} ${n(y + h)}V${n(y)}Z" fill="${c('bark-1')}" opacity=".75"/>`;
  svg += `<path d="${top(s, ry)}" fill="${c('wood-1')}"/>`;
  svg += `<path d="${top(s * 0.55, ry * 0.55)}" fill="none" stroke="${c('wood-3')}" stroke-width="${n(s * 0.13)}"/>`;
  return svg;
}

// The stream: a line from the top to the lower left, wider towards the viewer.
const STREAM = [
  [35, -6],
  [31, 12],
  [37, 28],
  [31, 44],
  [21, 58],
  [15, 76],
  [21, 94],
  [18, 110],
  [10, 126],
  [13, 156],
];

function streamSamples() {
  const samples = [];
  for (let i = 0; i < STREAM.length - 1; i++) {
    const p0 = STREAM[Math.max(0, i - 1)];
    const p1 = STREAM[i];
    const p2 = STREAM[i + 1];
    const p3 = STREAM[Math.min(STREAM.length - 1, i + 2)];
    for (let k = 0; k < 10; k++) {
      const t = k / 10;
      const at = (a, b, cc, d) =>
        0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (-a + 3 * b - 3 * cc + d) * t * t * t);
      samples.push([at(p0[0], p1[0], p2[0], p3[0]), at(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  samples.push(STREAM[STREAM.length - 1]);
  return samples;
}

const streamWidth = (y) => 2.3 + 2.3 * Math.max(0, Math.min(1, y / 150));

function stream(samples, rnd) {
  const side = (extra, sign) =>
    samples.map((p, i) => {
      const before = samples[Math.max(0, i - 1)];
      const after = samples[Math.min(samples.length - 1, i + 1)];
      const dx = after[0] - before[0];
      const dy = after[1] - before[1];
      const length = Math.hypot(dx, dy);
      const half = (streamWidth(p[1]) / 2 + extra) * (1 + 0.16 * Math.sin(i * 0.9 + sign));
      return [p[0] + (sign * -dy * half) / length, p[1] + (sign * dx * half) / length];
    });
  const band = (extra) => smoothClosed([...side(extra, 1), ...side(extra, -1).reverse()]);
  let svg = `<path d="${band(0.75)}" fill="${c('water-1')}"/>`;
  svg += `<path d="${band(0)}" fill="${c('water-2')}"/>`;
  let i = 2;
  while (i < samples.length - 6) {
    const length = 3 + Math.floor(rnd() * 6);
    const part = samples.slice(i, Math.min(samples.length, i + length));
    const off = rnd.range(-0.3, 0.3) * streamWidth(part[0][1]);
    const isBright = rnd() < 0.35;
    svg += `<path d="${smoothOpen(part.map((p) => [p[0] + off, p[1]]))}" fill="none" stroke="${c(isBright ? 'water-4' : 'water-3')}" stroke-width="${n(isBright ? rnd.range(0.2, 0.32) : rnd.range(0.45, 0.95))}" stroke-linecap="round" opacity="${isBright ? '.8' : '.7'}"/>`;
    i += Math.max(2, Math.floor(length * rnd.range(0.4, 1.1)));
  }
  return svg;
}

function forest(style) {
  const rnd = makeRng(23);
  const samples = streamSamples();
  const streamAt = (y) => {
    let best = samples[0];
    for (const p of samples) if (Math.abs(p[1] - y) < Math.abs(best[1] - y)) best = p;
    return best[0];
  };
  const clearing = { x: 68, y: 121, rx: 14, ry: 8 };

  let svg = `<rect width="100" height="150" fill="${c('ground-1')}"/>`;
  // Floor of the forest: large uneven patches, lighter and darker.
  for (let i = 0; i < 26; i++) {
    const tone = rnd.pick(['ground-2', 'ground-3', 'ground-2', 'ground-3', 'ground-4']);
    svg += `<path d="${blob(rnd.range(0, 100), rnd.range(0, 150), rnd.range(5, 12), rnd, { wobble: 0.3, squash: 0.7 })}" fill="${c(tone)}" opacity="${tone === 'ground-4' ? '.45' : '.7'}"${style === 'flat' ? '' : ' filter="url(#wSoft)"'}/>`;
  }
  svg += `<path d="${blob(clearing.x, clearing.y, clearing.rx, rnd, { wobble: 0.18, squash: clearing.ry / clearing.rx })}" fill="${c('ground-4')}"/>`;
  svg += `<path d="${blob(clearing.x - 2, clearing.y - 1, clearing.rx * 0.6, rnd, { wobble: 0.2, squash: 0.5 })}" fill="${c('leafy-3')}" opacity=".35"/>`;

  // Trees: scattered on an uneven grid, firs and leafy trees in stands, larger towards the viewer.
  const trees = [];
  const step = 7.4;
  for (let row = 0, y = -2; y < 158; y += step * 0.82, row++) {
    for (let x = (row % 2) * step * 0.5 - 2; x < 104; x += step) {
      const tx = x + rnd.range(-2.7, 2.7);
      const ty = y + rnd.range(-2.4, 2.4);
      const near = 0.84 + 0.36 * Math.max(0, Math.min(1, ty / 150));
      const stand = Math.sin(tx * 0.075 + 1.2) + Math.sin(ty * 0.052 + 0.5) + Math.sin((tx - ty) * 0.04 + 2.3);
      const isFir = stand + rnd.range(-0.7, 0.7) > 0.35;
      const size = (isFir ? rnd.range(6.4, 9) : rnd.range(3.5, 5.3)) * near;
      if (rnd() < 0.1) continue;
      const reach = isFir ? size * 0.42 : size * 0.72;
      if (Math.abs(tx - streamAt(ty)) < streamWidth(ty) / 2 + reach) continue;
      const inClearing = ((tx - clearing.x) / (clearing.rx + reach * 0.5)) ** 2 + ((ty - clearing.y) / (clearing.ry + reach * 0.4)) ** 2;
      if (inClearing < 1) continue;
      trees.push({ x: tx, y: ty, size, isFir, isYellow: rnd() < 0.28 });
    }
  }
  trees.sort((a, b) => a.y - b.y);
  const drawn = trees.map((tree) =>
    tree.isFir
      ? fir(tree.x, tree.y + tree.size * 0.35, tree.size, rnd, style)
      : leafyTree(tree.x, tree.y, tree.size, rnd, style, tree.isYellow),
  );
  // Shade lies on the ground only; the stream runs over it, the trees stand above both.
  svg += drawn.map((tree) => tree.shade).join('');
  svg += stream(samples, makeRng(51));
  svg += stump(62, 119, 1.5) + stump(71, 123.5, 1.8) + stump(75.5, 117.5, 1.25);
  svg += drawn.map((tree) => tree.svg).join('');
  return svg;
}

// ---------------------------------------------------------------------------------------------
// The whole picture
// ---------------------------------------------------------------------------------------------

/**
 * The picture of the card. `style`: 'flat' (drawn: clear tones, dark contour), 'paint' (painted:
 * soft roundness, bark and brush texture, no contour) or 'mix' (painted, the pile with a thin
 * contour). `halo`: 'thin' (thin light rim, PO 01.11.2026) or 'glow' (soft glow as on the cards
 * of the board game).
 */
export function woodPicture({ style, halo }) {
  const logs = pile(style);
  const isPainted = style !== 'flat';
  let defs = `
    <filter id="wSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter>
    <filter id="wEdge" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.6"/></filter>
    <linearGradient id="wHaze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c('haze')}" stop-opacity=".3"/>
      <stop offset=".42" stop-color="${c('haze')}" stop-opacity="0"/>
      <stop offset=".7" stop-color="${c('shade')}" stop-opacity="0"/>
      <stop offset="1" stop-color="${c('shade')}" stop-opacity=".22"/>
    </linearGradient>
    <filter id="wHaloThin" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius=".8"/>
      <feGaussianBlur stdDeviation=".3" result="rim"/>
      <feFlood flood-color="${c('halo')}" flood-opacity=".95"/>
      <feComposite in2="rim" operator="in"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="wHaloGlow" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="fat"/>
      <feGaussianBlur in="fat" stdDeviation="1.1" result="near"/>
      <feGaussianBlur in="fat" stdDeviation="3.4" result="wide"/>
      <feComponentTransfer in="wide" result="wideSoft"><feFuncA type="linear" slope=".75"/></feComponentTransfer>
      <feComponentTransfer in="near" result="nearFull"><feFuncA type="linear" slope="1.5"/></feComponentTransfer>
      <feFlood flood-color="${c('halo')}" result="light"/>
      <feComposite in="light" in2="wideSoft" operator="in" result="glowWide"/>
      <feComposite in="light" in2="nearFull" operator="in" result="glowNear"/>
      <feMerge><feMergeNode in="glowWide"/><feMergeNode in="glowNear"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="wPaintBack" x="0" y="0" width="100" height="150" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="2" seed="4" result="wave"/>
      <feDisplacementMap in="SourceGraphic" in2="wave" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="moved"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed="9" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values=".28 .28 0 0 .22  .28 .28 0 0 .22  .28 .28 0 0 .22  0 0 0 0 1" result="gray"/>
      <feBlend in="gray" in2="moved" mode="soft-light" result="textured"/>
      <feComposite in="textured" in2="moved" operator="in"/>
    </filter>
    <filter id="wPaintPile" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="6" result="wave"/>
      <feDisplacementMap in="SourceGraphic" in2="wave" scale=".45" xChannelSelector="R" yChannelSelector="G" result="moved"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="3" seed="12" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values=".22 .22 0 0 .28  .22 .22 0 0 .28  .22 .22 0 0 .28  0 0 0 0 1" result="gray"/>
      <feBlend in="gray" in2="moved" mode="soft-light" result="textured"/>
      <feComposite in="textured" in2="moved" operator="in"/>
    </filter>`;
  defs += logs.defs;
  // The symbol of the corners: a small pile of three in the same view, drawn clearly.
  const small = pile('flat', { layout: 'three', scale: 1.45, centre: [0, 0], id: 'wk' });
  defs += small.defs + `<g id="wCorner">${small.svg}</g>`;

  let body = `<g${isPainted ? ' filter="url(#wPaintBack)"' : ''}>${forest(style)}</g>`;
  body += `<rect width="100" height="150" fill="url(#wHaze)"/>`;
  body += `<rect x="3.5" y="3.5" width="93" height="143" fill="none" stroke="${c('shade')}" stroke-width="5" opacity=".55" filter="url(#wEdge)"/>`;
  body += `<g filter="url(#${halo === 'glow' ? 'wHaloGlow' : 'wHaloThin'})"><g${isPainted ? ' filter="url(#wPaintPile)"' : ''}>${logs.svg}</g></g>`;
  return { defs, body, corner: 'wCorner' };
}
