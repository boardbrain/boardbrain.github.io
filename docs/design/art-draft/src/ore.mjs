// Resource card "Erz": a lump of ore made of faces as a sticker over mountains seen from above at
// an angle: two ranges with a valley between them, lit from the upper left, a stream and firs
// in the valley. The lump is a real convex body, so its faces fit and its light is right.
import { blob, makeRng, n, poly, smoothOpen } from './lib.mjs';
import { camera, face, hull, lit, picture, seen, sub } from './scene.mjs';

/** Colours of the card; they become tokens `--color-art-…` when the card is built for real. */
export const PALETTE = {
  'rock-1': '#2a2d35',
  'rock-2': '#4b505b',
  'rock-3': '#727885',
  'rock-4': '#aab0bc',
  'rock-5': '#17191e',
  'vein-1': '#a8623a',
  'vein-2': '#e3a465',
  glint: '#f1f4fa',
  'peak-1': '#474459',
  'peak-2': '#77748d',
  'peak-3': '#a5a2b8',
  'peak-4': '#dad8e5',
  'snow-1': '#bfcbe0',
  'snow-2': '#f7f9fd',
  'moss-1': '#4c5a3d',
  'moss-2': '#73825a',
  'moss-3': '#98a274',
  scree: '#8d8893',
  'fir-1': '#1f3527',
  'fir-2': '#33523a',
  'fir-3': '#537c57',
  'water-1': '#4f7396',
  'water-2': '#a9c8dc',
  line: '#15161a',
  shade: '#14121b',
  haze: '#e6e4f2',
  halo: '#fffae0',
};

const c = (name) => `var(--o-${name})`;

// ---------------------------------------------------------------------------------------------
// The lump of ore
// ---------------------------------------------------------------------------------------------

// Points on an uneven oval body, flat below so it lies; its long side across the picture.
export function lump(seed, count) {
  const rnd = makeRng(seed);
  const cT = Math.cos((38 * Math.PI) / 180);
  const sT = Math.sin((38 * Math.PI) / 180);
  const points = [];
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1;
    const a = rnd() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const grow = rnd.range(0.74, 1.1);
    const x = s * Math.cos(a) * 2.7 * grow;
    const y = Math.max(-1.45, u * 2.05 * grow);
    const z = s * Math.sin(a) * 2.1 * grow;
    points.push([x * cT - z * sT, y, x * sT + z * cT]);
  }
  return hull(points);
}

export function drawLump(body, scale, centre, { isSmall = false, id = 'ol' } = {}) {
  const rnd = makeRng(9);
  const flat = camera(scale);
  const faces = seen(body);
  const all = faces.flatMap((f) => f.points.map(flat.project));
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const cam = camera(scale, [centre[0] - (Math.min(...xs) + Math.max(...xs)) / 2, centre[1] - (Math.min(...ys) + Math.max(...ys)) / 2]);
  const tones = { base: c('rock-2'), light: c('rock-4'), dark: c('rock-5') };
  let svg = '';
  let outline = '';
  // Faces that lie almost in one plane read as one face: no line between them.
  for (const f of faces) svg += `<path d="${poly(f.points.map(cam.project))}" fill="${c('rock-2')}" stroke="${c('rock-2')}" stroke-width=".3" stroke-linejoin="round"/>`;
  const edges = [];
  for (let i = 0; i < faces.length; i++) {
    for (let j = i + 1; j < faces.length; j++) {
      const shared = faces[i].points.filter((p) => faces[j].points.some((q) => Math.hypot(...sub(p, q)) < 1e-6));
      const turn = faces[i].normal[0] * faces[j].normal[0] + faces[i].normal[1] * faces[j].normal[1] + faces[i].normal[2] * faces[j].normal[2];
      if (shared.length === 2 && turn < 0.965) edges.push(shared.map(cam.project));
    }
  }
  for (const f of faces) {
    const points = f.points.map(cam.project);
    outline += poly(points);
    svg += face(points, f.normal, tones);
    if (isSmall) continue;
    // Pits and bright grains, more on the larger faces.
    const area = Math.abs((points[1][0] - points[0][0]) * (points[2][1] - points[0][1]) - (points[2][0] - points[0][0]) * (points[1][1] - points[0][1])) / 2;
    for (let i = 0; i < Math.min(14, Math.round(area / 5)); i++) {
      let a = rnd();
      let b = rnd();
      if (a + b > 1) {
        a = 1 - a;
        b = 1 - b;
      }
      const x = points[0][0] + (points[1][0] - points[0][0]) * a + (points[2][0] - points[0][0]) * b;
      const y = points[0][1] + (points[1][1] - points[0][1]) * a + (points[2][1] - points[0][1]) * b;
      const isBright = rnd() < 0.35;
      svg += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rnd.range(0.18, 0.5))}" ry="${n(rnd.range(0.14, 0.32))}" transform="rotate(${n(rnd.range(-60, 60))} ${n(x)} ${n(y)})" fill="${c(isBright ? 'rock-4' : 'rock-5')}" opacity="${isBright ? '.6' : '.5'}"/>`;
    }
  }
  for (const [a, b] of edges) {
    svg += `<path d="M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}" stroke="${c('rock-1')}" stroke-width="${isSmall ? '.2' : '.32'}" stroke-linecap="round" opacity=".85"/>`;
  }
  if (!isSmall) {
    // Edges between two lit faces catch the light.
    for (let i = 0; i < faces.length; i++) {
      for (let j = i + 1; j < faces.length; j++) {
        const shared = faces[i].points.filter((p) => faces[j].points.some((q) => Math.hypot(...sub(p, q)) < 1e-6));
        const isSharp = faces[i].normal[0] * faces[j].normal[0] + faces[i].normal[1] * faces[j].normal[1] + faces[i].normal[2] * faces[j].normal[2] < 0.9;
        if (shared.length === 2 && isSharp && Math.max(lit(faces[i].normal), lit(faces[j].normal)) > 0.55) {
          const [a, b] = shared.map(cam.project);
          svg += `<path d="M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}" stroke="${c('rock-4')}" stroke-width=".32" stroke-linecap="round" opacity=".8"/>`;
        }
      }
    }
    // Veins of ore running through the rock, and a few glints.
    let veins = '';
    for (const [from, to, width] of [
      [[-24, -6], [-4, 3], 0.5],
      [[-6, 2], [9, -9], 0.36],
      [[8, 13], [22, 2], 0.42],
    ]) {
      const points = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        points.push([centre[0] + from[0] + (to[0] - from[0]) * t + rnd.range(-0.6, 0.6), centre[1] + from[1] + (to[1] - from[1]) * t + rnd.range(-0.6, 0.6)]);
      }
      const d = smoothOpen(points);
      veins += `<path d="${d}" fill="none" stroke="${c('vein-1')}" stroke-width="${n(width)}" stroke-linecap="round" stroke-dasharray="3.2 .7 1.6 1.1 4 .9" opacity=".7"/>`;
      veins += `<path d="${d}" transform="translate(-.12 -.2)" fill="none" stroke="${c('vein-2')}" stroke-width="${n(width * 0.35)}" stroke-linecap="round" stroke-dasharray="2.4 1.6 1 2.2" opacity=".9"/>`;
    }
    svg += `<clipPath id="${id}"><path d="${outline}"/></clipPath><g clip-path="url(#${id})">${veins}</g>`;
    const bright = faces.filter((f) => lit(f.normal) > 0.45);
    for (let i = 0; i < 7 && bright.length > 0; i++) {
      const points = bright[Math.floor(rnd() * bright.length)].points.map(cam.project);
      const x = (points[0][0] + points[1][0] + points[2][0]) / 3 + rnd.range(-1.5, 1.5);
      const y = (points[0][1] + points[1][1] + points[2][1]) / 3 + rnd.range(-1.5, 1.5);
      const r = rnd.range(0.6, 1.1);
      svg += `<path d="M${n(x)} ${n(y - r)}L${n(x + r * 0.22)} ${n(y - r * 0.22)}L${n(x + r)} ${n(y)}L${n(x + r * 0.22)} ${n(y + r * 0.22)}L${n(x)} ${n(y + r)}L${n(x - r * 0.22)} ${n(y + r * 0.22)}L${n(x - r)} ${n(y)}L${n(x - r * 0.22)} ${n(y - r * 0.22)}Z" fill="${c('glint')}" opacity=".9"/>`;
    }
  }
  return svg;
}

// ---------------------------------------------------------------------------------------------
// The mountains
// ---------------------------------------------------------------------------------------------

// A range along a ridge running from the lower left to the upper right: its flank to the upper
// left lies in the light, the one to the lower right in the shade. Both are broken into faces.
function range(ridge, { litWidth, shadeWidth, snowFrom }, rnd) {
  const count = ridge.length;
  const normal = ridge.map((p, i) => {
    const before = ridge[Math.max(0, i - 1)];
    const after = ridge[Math.min(count - 1, i + 1)];
    const dx = after[0] - before[0];
    const dy = after[1] - before[1];
    const length = Math.hypot(dx, dy);
    return [dy / length, -dx / length];
  });
  const foot = (i, width, sign) => {
    const reach = width * (0.7 + 0.55 * ridge[i][2]) * rnd.range(0.86, 1.14);
    return [ridge[i][0] + sign * normal[i][0] * reach + rnd.range(-1.5, 1.5), ridge[i][1] + sign * normal[i][1] * reach + rnd.range(-1.5, 1.5)];
  };
  const litFeet = ridge.map((_, i) => foot(i, litWidth, 1));
  const shadeFeet = ridge.map((_, i) => foot(i, shadeWidth, -1));
  let svg = '';
  let snow = '';
  const flank = (feet, isLit) => {
    for (let i = 0; i < count - 1; i++) {
      const [a, b, fa, fb] = [ridge[i], ridge[i + 1], feet[i], feet[i + 1]];
      const mid = [(a[0] + b[0] + fa[0] + fb[0]) / 4 + rnd.range(-2, 2), (a[1] + b[1] + fa[1] + fb[1]) / 4 + rnd.range(-2, 2)];
      const parts = [
        [[a, b, mid], 'high'],
        [[a, mid, fa], 'side'],
        [[b, fb, mid], 'side'],
        [[fa, mid, fb], 'low'],
      ];
      for (const [points, where] of parts) {
        const d = poly(points.map((p) => [p[0], p[1]]));
        svg += `<path d="${d}" fill="${c(isLit ? 'peak-3' : 'peak-1')}" stroke="${c(isLit ? 'peak-3' : 'peak-1')}" stroke-width=".3" stroke-linejoin="round"/>`;
        if (isLit) {
          const brighter = where === 'high' ? rnd.range(0.35, 0.7) : where === 'side' ? rnd.range(-0.35, 0.4) : rnd.range(-0.5, 0.05);
          svg += `<path d="${d}" fill="${c(brighter > 0 ? 'peak-4' : 'peak-2')}" opacity="${n(Math.abs(brighter))}"/>`;
        } else {
          const tone = where === 'low' ? rnd.range(-0.45, 0) : rnd.range(-0.2, 0.5);
          svg += `<path d="${d}" fill="${c(tone > 0 ? 'peak-2' : 'shade')}" opacity="${n(Math.abs(tone))}"/>`;
        }
      }
      // Gullies down the flank and layers of rock along it.
      svg += `<path d="M${n(a[0])} ${n(a[1])}Q${n((a[0] + fa[0]) / 2 + rnd.range(-1.2, 1.2))} ${n((a[1] + fa[1]) / 2 + rnd.range(-1.2, 1.2))} ${n(fa[0])} ${n(fa[1])}" fill="none" stroke="${c(isLit ? 'peak-1' : 'shade')}" stroke-width="${n(rnd.range(0.3, 0.6))}" opacity="${isLit ? '.4' : '.45'}" stroke-linecap="round"/>`;
      for (let k = 0; k < 3; k++) {
        const t = rnd.range(0.2, 0.85);
        const s = rnd.range(0.1, 0.5);
        const e = s + rnd.range(0.2, 0.45);
        const at = (u) => [a[0] + (b[0] - a[0]) * u + (((fa[0] + fb[0]) / 2 - (a[0] + b[0]) / 2) * t), a[1] + (b[1] - a[1]) * u + (((fa[1] + fb[1]) / 2 - (a[1] + b[1]) / 2) * t)];
        const [p, q] = [at(s), at(e)];
        svg += `<path d="M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}" stroke="${c(isLit ? 'peak-2' : 'peak-2')}" stroke-width=".35" stroke-linecap="round" opacity="${isLit ? '.45' : '.3'}"/>`;
      }
      // Snow on the high parts, ending in tongues down the flank.
      const height = (a[2] + b[2]) / 2;
      if (height > snowFrom) {
        const reach = Math.min(0.62, (height - snowFrom) * 1.6 + 0.2);
        const down = (from, t, jig) => [from[0] + (mid[0] - from[0]) * t + jig[0], from[1] + (mid[1] - from[1]) * t + jig[1]];
        const tongue = [
          [a[0], a[1]],
          [b[0], b[1]],
          down(b, reach * 0.8, [0, 0]),
          down([(a[0] + b[0]) / 2 + (b[0] - a[0]) * 0.2, (a[1] + b[1]) / 2 + (b[1] - a[1]) * 0.2], reach * 0.45, [0, 0]),
          down([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], reach * 1.15, [rnd.range(-1, 1), rnd.range(-1, 1)]),
          down([(a[0] + b[0]) / 2 - (b[0] - a[0]) * 0.2, (a[1] + b[1]) / 2 - (b[1] - a[1]) * 0.2], reach * 0.5, [0, 0]),
          down(a, reach * 0.9, [0, 0]),
        ];
        snow += `<path d="${poly(tongue)}" fill="${c(isLit ? 'snow-2' : 'snow-1')}" opacity="${isLit ? '.95' : '.85'}"/>`;
      }
    }
  };
  flank(shadeFeet, false);
  flank(litFeet, true);
  svg += snow;
  svg += `<path d="${poly(ridge.map((p) => [p[0], p[1]]), false)}" fill="none" stroke="${c('peak-4')}" stroke-width=".5" stroke-linejoin="round" opacity=".85"/>`;
  // Loose rock where the flanks meet the valley.
  for (const feet of [litFeet, shadeFeet]) {
    for (let i = 0; i < count - 1; i++) {
      for (let k = 0; k < 7; k++) {
        const t = rnd();
        const x = feet[i][0] + (feet[i + 1][0] - feet[i][0]) * t + rnd.range(-2, 2);
        const y = feet[i][1] + (feet[i + 1][1] - feet[i][1]) * t + rnd.range(-2, 2);
        svg += `<path d="${blob(x, y, rnd.range(0.4, 1.1), rnd, { points: 6, wobble: 0.25, squash: 0.7 })}" fill="${c(rnd.pick(['scree', 'peak-2', 'peak-3']))}" opacity=".9"/>`;
      }
    }
  }
  return svg;
}

// A small fir in the valley.
function fir(x, y, s, rnd) {
  let svg = `<ellipse cx="${n(x + s * 0.5)}" cy="${n(y + s * 0.15)}" rx="${n(s * 0.6)}" ry="${n(s * 0.22)}" fill="${c('shade')}" opacity=".4"/>`;
  for (let k = 0; k < 3; k++) {
    const base = y - k * 0.32 * s;
    const half = 0.42 * s * (1 - k * 0.24);
    const tip = base - 0.7 * s;
    const lean = rnd.range(-0.04, 0.04) * s;
    svg += `<path d="M${n(x + lean)} ${n(tip)}L${n(x + half)} ${n(base)}L${n(x - half)} ${n(base)}Z" fill="${c('fir-1')}"/>`;
    svg += `<path d="M${n(x + lean)} ${n(tip)}L${n(x + half * 0.08)} ${n(base)}L${n(x - half)} ${n(base)}Z" fill="${c('fir-2')}"/>`;
    svg += `<path d="M${n(x + lean)} ${n(tip + 0.12 * s)}L${n(x - half * 0.45)} ${n(base)}L${n(x - half)} ${n(base)}Z" fill="${c('fir-3')}" opacity=".7"/>`;
  }
  return svg;
}

function mountains() {
  const rnd = makeRng(31);
  // The valley: moss and rubble, lighter where the light reaches it.
  let svg = `<rect width="100" height="150" fill="${c('moss-1')}"/>`;
  for (let i = 0; i < 26; i++) {
    svg += `<path d="${blob(rnd.range(0, 100), rnd.range(0, 150), rnd.range(4, 9), rnd, { wobble: 0.3, squash: 0.65 })}" fill="${c(rnd.pick(['moss-2', 'moss-3', 'scree', 'moss-2']))}" opacity=".5" filter="url(#pSoft)"/>`;
  }
  // The far range fills the upper left, the near one the lower right.
  svg += range(
    [
      [-12, 100, 0.5],
      [5, 79, 0.72],
      [17, 61, 0.92],
      [32, 45, 1],
      [46, 28, 0.84],
      [62, 13, 0.96],
      [80, -7, 0.7],
    ],
    { litWidth: 30, shadeWidth: 15, snowFrom: 0.78 },
    rnd,
  );
  // The stream down the valley, from the upper right to the lower left.
  const bed = [
    [99, 12],
    [88, 26],
    [77, 37],
    [70, 49],
    [60, 57],
    [51, 71],
    [41, 81],
    [33, 93],
    [22, 104],
    [15, 117],
    [3, 127],
    [-6, 140],
  ];
  svg += `<path d="${smoothOpen(bed)}" fill="none" stroke="${c('moss-1')}" stroke-width="4.4" stroke-linecap="round" opacity=".7"/>`;
  svg += `<path d="${smoothOpen(bed)}" fill="none" stroke="${c('water-1')}" stroke-width="2.3" stroke-linecap="round"/>`;
  for (let i = 0; i < bed.length - 1; i++) {
    const [p, q] = [bed[i], bed[i + 1]];
    for (let k = 0; k < 2; k++) {
      const s = rnd.range(0.05, 0.6);
      const e = s + rnd.range(0.15, 0.35);
      const off = rnd.range(-0.6, 0.6);
      svg += `<path d="M${n(p[0] + (q[0] - p[0]) * s + off)} ${n(p[1] + (q[1] - p[1]) * s + off)}L${n(p[0] + (q[0] - p[0]) * e + off)} ${n(p[1] + (q[1] - p[1]) * e + off)}" stroke="${c('water-2')}" stroke-width="${n(rnd.range(0.3, 0.6))}" stroke-linecap="round" opacity=".8"/>`;
    }
  }
  let props = '';
  const firs = [
    [84, 34], [79, 43], [90, 40], [73, 55], [66, 62], [58, 74], [47, 84], [38, 96], [27, 104], [29, 113],
    [18, 121], [9, 118], [12, 131], [93, 28], [63, 68], [44, 91],
  ];
  firs
    .sort((a, b) => a[1] - b[1])
    .forEach(([x, y]) => {
      svg += fir(x + rnd.range(-1.5, 1.5), y + rnd.range(-1.5, 1.5), 3 + (y / 150) * 2.6, rnd);
    });
  svg += range(
    [
      [20, 162, 0.6],
      [38, 139, 0.8],
      [53, 122, 1],
      [67, 103, 0.88],
      [82, 85, 1],
      [96, 65, 0.8],
      [112, 46, 0.6],
    ],
    { litWidth: 19, shadeWidth: 26, snowFrom: 0.86 },
    rnd,
  );
  return { svg, props };
}

/** The picture of the card in the chosen direction. */
export function orePicture() {
  const body = lump(11, 20);
  const thing = `<g filter="url(#pLine)">${drawLump(body, 9.6, [50, 75])}</g>`;
  const corner = `<g filter="url(#pLineSmall)">${drawLump(lump(11, 20), 1.42, [0, 0], { isSmall: true, id: 'oc' })}</g>`;
  const back = mountains();
  return picture({
    colors: { halo: c('halo'), haze: c('haze'), shade: c('shade'), line: c('line') },
    back: back.svg,
    props: back.props,
    thing,
    corner,
  });
}
