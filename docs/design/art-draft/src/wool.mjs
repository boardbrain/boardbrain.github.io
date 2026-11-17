// Resource card "Wolle": a sheep standing on a patch of grass as a sticker over a pasture seen
// from above at an angle. Every sheep of the card is the same animal: the large one, the flocks
// and the symbol of the corners.
import { blob, makeRng, n, smoothClosed, smoothOpen } from './lib.mjs';
import { picture } from './scene.mjs';

/** Colours of the card; they become tokens `--color-art-…` when the card is built for real. */
export const PALETTE = {
  'field-1': '#4c8a2c',
  'field-2': '#69a93a',
  'field-3': '#8dc850',
  'field-4': '#bade70',
  'field-5': '#356625',
  'bloom-1': '#f7e37c',
  'bloom-2': '#f6f3ea',
  'stone-1': '#625d52',
  'stone-2': '#9c9686',
  'stone-3': '#cbc5b4',
  'wool-1': '#b6a586',
  'wool-2': '#eadfc7',
  'wool-3': '#faf5e8',
  'wool-4': '#8c7a5e',
  'face-1': '#1f1a17',
  'face-2': '#3c332d',
  'face-3': '#63564b',
  'pale-1': '#a48a69',
  'pale-2': '#d9c4a1',
  'pale-3': '#efe0c5',
  hoof: '#1b1613',
  eye: '#dba640',
  line: '#33251a',
  shade: '#143010',
  haze: '#e8f4c6',
  halo: '#fffae0',
};

const c = (name) => `var(--s-${name})`;

// A woolly outline: bumps of uneven size around an oval.
function fleece(cx, cy, rx, ry, rnd, bumps, lift = 0.2) {
  const at = (a, grow = 1) => [cx + Math.cos(a) * rx * grow, cy + Math.sin(a) * ry * grow];
  const angles = [];
  let a = rnd() * 0.3;
  const step = (Math.PI * 2) / bumps;
  while (a < Math.PI * 2 - step * 0.5) {
    angles.push(a);
    a += step * rnd.range(0.72, 1.28);
  }
  const start = at(angles[0]);
  let d = `M${n(start[0])} ${n(start[1])}`;
  angles.forEach((angle, i) => {
    const next = i + 1 < angles.length ? angles[i + 1] : angles[0] + Math.PI * 2;
    const mid = at((angle + next) / 2, 1 + lift * rnd.range(0.8, 1.25));
    const end = at(next);
    d += `Q${n(mid[0])} ${n(mid[1])} ${n(end[0])} ${n(end[1])}`;
  });
  return `${d}Z`;
}

// A leg from where it leaves the fleece down to the hoof; `hock` bends the hind legs.
function leg(x, top, ground, hock, colors, line) {
  const knee = top + (ground - top) * 0.47;
  const ankle = ground - 2.6;
  const bend = hock ? 1.5 : -0.25;
  const left = [
    [x - (hock ? 2.3 : 1.8), top],
    [x - 1.25 + bend, knee],
    [x - 1.0 + bend * 0.25, ankle - 1.2],
    [x - 1.2, ankle],
  ];
  const right = [
    [x + 1.2, ankle],
    [x + 1.0 + bend * 0.25, ankle - 1.2],
    [x + 1.35 + bend, knee],
    [x + (hock ? 2.3 : 1.8), top],
  ];
  const shape = `${smoothOpen(left)}L${n(right[0][0])} ${n(right[0][1])}${smoothOpen(right).replace(/^M[^C]*/, '')}Z`;
  const hoofD = `M${n(x - 1.3)} ${n(ankle - 0.1)}L${n(x + 1.3)} ${n(ankle - 0.1)}L${n(x + 1.6)} ${n(ground)}L${n(x - 1.75)} ${n(ground)}Z`;
  return (
    `<path d="${shape}" fill="${colors.mid}" stroke="${c('line')}" stroke-width="${n(line)}" stroke-linejoin="round"/>` +
    `<path d="${smoothOpen([right[1], right[2], right[3]])}" fill="none" stroke="${colors.dark}" stroke-width="${n(line * 1.6)}" opacity=".55" stroke-linecap="round" transform="translate(-.5 0)"/>` +
    `<path d="${hoofD}" fill="${c('hoof')}" stroke="${c('line')}" stroke-width="${n(line)}" stroke-linejoin="round"/>`
  );
}

/**
 * A sheep facing left, its body around (2, 0), about 49 wide and 40 high, standing on y = 21.
 * `head`: 'dark' or 'light' face and legs. `detail`: 'full' or 'small' (flock and corners).
 * `isGrazing` lowers the head. `line` is the width of the contour in the units of the sheep.
 */
export function sheep({ head = 'dark', detail = 'full', isGrazing = false, line = 0.45, seed = 3 }) {
  const rnd = makeRng(seed);
  const isFull = detail === 'full';
  const skin =
    head === 'dark'
      ? { dark: c('face-1'), mid: c('face-2'), light: c('face-3') }
      : { dark: c('pale-1'), mid: c('pale-2'), light: c('pale-3') };
  const ground = 21;
  let svg = '';

  // Far legs first, a little higher and darker, then the tail.
  const far = `${leg(-5.6, 6.5, ground - 0.7, false, skin, line)}${leg(14.9, 5.5, ground - 0.7, true, skin, line)}`;
  svg += `${far}<g opacity=".3">${far.replaceAll(skin.mid, skin.dark).replaceAll(/stroke="[^"]*"/g, 'stroke="none"')}</g>`;
  svg += `<path d="${fleece(20.4, -0.6, 2.7, 3.9, rnd, 6, 0.3)}" fill="${c('wool-2')}" stroke="${c('line')}" stroke-width="${n(line)}" stroke-linejoin="round"/>`;
  svg += leg(-9.6, 7, ground, false, skin, line) + leg(11.4, 6, ground, true, skin, line);

  // The fleece: light on the back, shade under the belly and at the rear, curls all over.
  const body = fleece(2, 0, 17.4, 11.8, rnd, isFull ? 22 : 12, isFull ? 0.2 : 0.26);
  const clip = `sc${seed}${head[0]}${detail[0]}`;
  svg += `<clipPath id="${clip}"><path d="${body}"/></clipPath>`;
  svg += `<path d="${body}" fill="${c('wool-2')}"/><g clip-path="url(#${clip})">`;
  svg += `<ellipse cx="5" cy="10.5" rx="19" ry="8" fill="${c('wool-1')}" opacity=".8" filter="url(#pSoft)"/>`;
  svg += `<ellipse cx="18" cy="2" rx="6" ry="12" fill="${c('wool-1')}" opacity=".45" filter="url(#pSoft)"/>`;
  svg += `<ellipse cx="-1" cy="-8.5" rx="14" ry="5" fill="${c('wool-3')}" opacity=".95" filter="url(#pSoft)"/>`;
  if (isFull) {
    for (let i = 0; i < 64; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * 0.92;
      const x = 2 + Math.cos(a) * 17 * d;
      const y = Math.sin(a) * 11.4 * d;
      const r = rnd.range(0.9, 1.9);
      const turn = rnd.range(0, 360);
      const isLow = y > 1 || x > 10;
      svg += `<path d="M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 1 1 ${n(r * 1.6)} ${n(r * 0.7)}" transform="rotate(${n(turn)} ${n(x)} ${n(y)})" fill="none" stroke="${c(isLow ? 'wool-4' : 'wool-1')}" stroke-width="${n(rnd.range(0.28, 0.42))}" stroke-linecap="round" opacity="${n(isLow ? rnd.range(0.45, 0.7) : rnd.range(0.5, 0.85))}"/>`;
    }
    for (let i = 0; i < 12; i++) {
      const x = rnd.range(-10, 10);
      const y = rnd.range(-9.5, -4);
      const r = rnd.range(1, 1.8);
      svg += `<path d="M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 0 1 ${n(r * 2)} 0" fill="none" stroke="${c('wool-3')}" stroke-width=".5" stroke-linecap="round" opacity=".9"/>`;
    }
  }
  svg += `</g><path d="${body}" fill="none" stroke="${c('line')}" stroke-width="${n(line)}" stroke-linejoin="round"/>`;

  // The head, lowered when grazing.
  const hx = -17;
  const hy = -4.5;
  const p = (x, y) => [hx + x, hy + y];
  const outline = smoothClosed([
    p(5, -6.5),
    p(1.5, -8.6),
    p(-2.8, -7.6),
    p(-5.6, -4.8),
    p(-7.8, -0.6),
    p(-9.3, 3.4),
    p(-9.5, 5.6),
    p(-8.3, 7.4),
    p(-5.6, 7.9),
    p(-2.6, 6),
    p(1.2, 3.6),
    p(4.6, 1),
    p(6.2, -3),
  ]);
  const ear = (base, tip, bulge) => {
    const [bx, by] = p(...base);
    const [tx, ty] = p(...tip);
    const mx = (bx + tx) / 2;
    const my = (by + ty) / 2;
    return `M${n(bx)} ${n(by)}Q${n(mx + bulge[0])} ${n(my + bulge[1])} ${n(tx)} ${n(ty)}Q${n(mx - bulge[0] * 0.6)} ${n(my - bulge[1] * 0.6)} ${n(bx)} ${n(by)}Z`;
  };
  let headSvg = '';
  const headClip = `${clip}h`;
  headSvg += `<clipPath id="${headClip}"><path d="${outline}"/></clipPath><path d="${outline}" fill="${skin.mid}"/>`;
  headSvg += `<g clip-path="url(#${headClip})">`;
  headSvg += `<ellipse cx="${n(hx - 5.2)}" cy="${n(hy - 3.2)}" rx="6.5" ry="2.6" transform="rotate(62 ${n(hx - 5.2)} ${n(hy - 3.2)})" fill="${skin.light}" opacity=".75" filter="url(#pSoft)"/>`;
  headSvg += `<ellipse cx="${n(hx - 1)}" cy="${n(hy + 6.2)}" rx="8" ry="3" transform="rotate(-24 ${n(hx - 1)} ${n(hy + 6.2)})" fill="${skin.dark}" opacity=".7" filter="url(#pSoft)"/>`;
  headSvg += `<ellipse cx="${n(hx - 8.1)}" cy="${n(hy + 5.4)}" rx="2.1" ry="2.5" fill="${skin.light}" opacity=".55"/>`;
  headSvg += `</g><path d="${outline}" fill="none" stroke="${c('line')}" stroke-width="${n(line)}" stroke-linejoin="round"/>`;
  if (isFull) {
    const [ex, ey] = p(-3.3, -3.1);
    headSvg += `<ellipse cx="${n(ex)}" cy="${n(ey)}" rx="1.15" ry=".9" fill="${c('eye')}" stroke="${c('line')}" stroke-width=".3"/>`;
    headSvg += `<ellipse cx="${n(ex)}" cy="${n(ey)}" rx=".66" ry=".3" fill="${c('hoof')}"/><circle cx="${n(ex - 0.35)}" cy="${n(ey - 0.3)}" r=".2" fill="${c('wool-3')}"/>`;
    headSvg += `<path d="M${n(ex - 1.5)} ${n(ey - 0.5)}Q${n(ex)} ${n(ey - 1.5)} ${n(ex + 1.5)} ${n(ey - 0.4)}" fill="none" stroke="${c('line')}" stroke-width=".35" stroke-linecap="round"/>`;
    const [nx, ny] = p(-8.9, 4.6);
    headSvg += `<ellipse cx="${n(nx)}" cy="${n(ny)}" rx=".55" ry=".33" transform="rotate(-35 ${n(nx)} ${n(ny)})" fill="${c('hoof')}"/>`;
    const [m1, m2, m3] = [p(-9.2, 6.3), p(-7.6, 6.9), p(-5.9, 6.2)];
    headSvg += `<path d="M${n(m1[0])} ${n(m1[1])}Q${n(m2[0])} ${n(m2[1])} ${n(m3[0])} ${n(m3[1])}" fill="none" stroke="${c('hoof')}" stroke-width=".3" stroke-linecap="round" opacity=".8"/>`;
  } else {
    const [ex, ey] = p(-3.3, -3.1);
    headSvg += `<circle cx="${n(ex)}" cy="${n(ey)}" r=".9" fill="${head === 'dark' ? c('eye') : c('hoof')}"/>`;
  }
  // The tuft of wool on the head, then the near ear lying on it.
  headSvg += `<path d="${fleece(hx + 1.2, hy - 7.8, 4.9, 2.5, rnd, 9, 0.26)}" fill="${c('wool-2')}" stroke="${c('line')}" stroke-width="${n(line)}" stroke-linejoin="round"/>`;
  const nearEar = ear([3.4, -6.2], [10.2, -4], [0.4, -3.2]);
  headSvg += `<path d="${nearEar}" fill="${skin.mid}" stroke="${c('line')}" stroke-width="${n(line)}" stroke-linejoin="round"/>`;
  headSvg += `<path d="${ear([4.6, -5.8], [9, -4.4], [0.2, -1.5])}" fill="${skin.light}" opacity=".6"/>`;
  svg += isGrazing ? `<g transform="rotate(-38 ${n(hx + 5)} ${n(hy)}) translate(-.5 2.5)">${headSvg}</g>` : headSvg;
  return svg;
}

// The patch of grass the large sheep stands on, in two layers: behind and in front of the hooves.
function patch(rnd) {
  let behind = `<path d="${blob(3, 21.4, 21, rnd, { points: 18, wobble: 0.13, squash: 0.17 })}" fill="${c('field-5')}"/>`;
  behind += `<path d="${blob(1.5, 20.9, 17.5, rnd, { points: 16, wobble: 0.16, squash: 0.14 })}" fill="${c('field-1')}"/>`;
  behind += `<ellipse cx="7" cy="21.6" rx="15" ry="2.3" fill="${c('shade')}" opacity=".4" filter="url(#pSoft)"/>`;
  const blades = (count, yFrom, yTo, tones) => {
    let out = '';
    for (let i = 0; i < count; i++) {
      const x = rnd.range(-19, 25);
      const y = rnd.range(yFrom, yTo) + Math.abs(x - 3) * 0.02;
      const h = rnd.range(1.8, 4.2);
      const lean = rnd.range(-1.6, 1.6);
      out += `<path d="M${n(x)} ${n(y)}Q${n(x + lean * 0.3)} ${n(y - h * 0.6)} ${n(x + lean)} ${n(y - h)}" fill="none" stroke="${c(rnd.pick(tones))}" stroke-width="${n(rnd.range(0.45, 0.8))}" stroke-linecap="round"/>`;
    }
    return out;
  };
  behind += blades(70, 18.6, 22.4, ['field-1', 'field-2', 'field-5']);
  const front = blades(54, 22, 25.4, ['field-2', 'field-3', 'field-1', 'field-4']);
  return { behind, front };
}

function pasture(head) {
  const rnd = makeRng(41);
  let svg = `<rect width="100" height="150" fill="${c('field-2')}"/>`;
  // Rolling ground: wide soft bands and patches, lighter and darker.
  for (let i = 0; i < 7; i++) {
    const y = 10 + i * 21 + rnd.range(-5, 5);
    const points = [];
    for (let x = -10; x <= 110; x += 20) points.push([x, y + Math.sin(x * 0.05 + i) * 6 + rnd.range(-2, 2)]);
    svg += `<path d="${smoothOpen(points)}" fill="none" stroke="${c(i % 2 === 0 ? 'field-3' : 'field-1')}" stroke-width="${n(rnd.range(9, 15))}" opacity=".5" filter="url(#pSofter)"/>`;
  }
  for (let i = 0; i < 22; i++) {
    svg += `<path d="${blob(rnd.range(0, 100), rnd.range(0, 150), rnd.range(3, 8), rnd, { wobble: 0.3, squash: 0.6 })}" fill="${c(rnd.pick(['field-3', 'field-1', 'field-4', 'field-5']))}" opacity=".32" filter="url(#pSoft)"/>`;
  }
  // Tufts of grass, denser towards the viewer, and flowers in loose groups.
  for (let i = 0; i < 260; i++) {
    const y = 150 * Math.sqrt(rnd());
    const x = rnd.range(4, 96);
    const size = 0.6 + (y / 150) * 1.1;
    const tone = c(rnd.pick(['field-1', 'field-5', 'field-3', 'field-4']));
    for (const lean of [-0.8, 0, 0.9, 0.3].slice(0, 2 + Math.floor(rnd() * 3))) {
      svg += `<path d="M${n(x)} ${n(y)}l${n(lean * size * rnd.range(0.6, 1.2))} ${n(-size * rnd.range(1.2, 2))}" stroke="${tone}" stroke-width="${n(0.22 + size * 0.12)}" stroke-linecap="round" opacity=".8"/>`;
    }
  }
  for (let g = 0; g < 9; g++) {
    const gx = rnd.range(8, 92);
    const gy = rnd.range(8, 142);
    const tone = c(rnd.pick(['bloom-1', 'bloom-2', 'bloom-1']));
    for (let i = 0; i < 9; i++) {
      svg += `<circle cx="${n(gx + rnd.range(-5, 5))}" cy="${n(gy + rnd.range(-3, 3))}" r="${n(rnd.range(0.22, 0.42) * (0.7 + gy / 300))}" fill="${tone}"/>`;
    }
  }
  let props = '';
  // A dry stone wall across the far pasture, with its shade.
  const wall = [];
  for (let x = -4; x <= 104; x += 2) wall.push([x, 37 - Math.sin(x * 0.045 + 0.4) * 7 - x * 0.07]);
  props += `<path d="${smoothOpen(wall)}" transform="translate(.9 1.1)" fill="none" stroke="${c('shade')}" stroke-width="2.4" opacity=".4" filter="url(#pSoft)"/>`;
  props += `<path d="${smoothOpen(wall)}" fill="none" stroke="${c('stone-1')}" stroke-width="2.3" stroke-linecap="round"/>`;
  for (const [x, y] of wall) {
    for (let i = 0; i < 3; i++) {
      const sx = x + rnd.range(-1, 1);
      const sy = y + rnd.range(-0.75, 0.6);
      props += `<path d="${blob(sx, sy, rnd.range(0.42, 0.74), rnd, { points: 6, wobble: 0.22, squash: 0.75 })}" fill="${c(sy < y ? 'stone-3' : 'stone-2')}"/>`;
    }
  }
  // A few stones lying in the grass.
  for (const [x, y, r] of [
    [14, 58, 1.6],
    [84, 96, 2.1],
    [72, 137, 1.7],
    [22, 122, 1.2],
  ]) {
    props += `<ellipse cx="${n(x + r * 0.6)}" cy="${n(y + r * 0.5)}" rx="${n(r * 1.3)}" ry="${n(r * 0.6)}" fill="${c('shade')}" opacity=".35"/>`;
    props += `<path d="${blob(x, y, r, rnd, { points: 7, wobble: 0.18, squash: 0.7 })}" fill="${c('stone-2')}" stroke="${c('stone-1')}" stroke-width=".3"/>`;
    props += `<path d="${blob(x - r * 0.25, y - r * 0.2, r * 0.5, rnd, { points: 6, wobble: 0.2, squash: 0.6 })}" fill="${c('stone-3')}"/>`;
  }
  // The flocks: far and small beyond the wall, nearer and larger below, in loose groups.
  const flock = [
    [21, 17, 0], [29, 22, 1], [37, 15, 0], [18, 27, 1], [70, 15, 1], [79, 19, 0], [62, 23, 1], [84, 28, 0],
    [14, 52, 1], [86, 53, 0], [89, 63, 1],
    [19, 107, 0], [26, 117, 1], [18, 126, 1], [78, 109, 1], [83, 121, 0], [69, 127, 0], [43, 129, 1], [55, 133, 0], [32, 133, 1],
  ];
  flock
    .map(([x, y, turned], i) => ({ x: x + rnd.range(-0.8, 0.8), y: y + rnd.range(-0.6, 0.6), turned, i }))
    .sort((a, b) => a.y - b.y)
    .forEach(({ x, y, turned, i }) => {
      const scale = 0.105 + (y / 150) * 0.135;
      const flip = turned === 1 ? -1 : 1;
      props += `<ellipse cx="${n(x + 3.5 * scale)}" cy="${n(y + 21.5 * scale)}" rx="${n(19 * scale)}" ry="${n(4.2 * scale)}" fill="${c('shade')}" opacity=".38"/>`;
      props += `<g transform="translate(${n(x)} ${n(y)}) scale(${n(flip * scale)} ${n(scale)})">${sheep({ head, detail: 'small', isGrazing: i % 3 !== 0, line: 0.24 / scale, seed: 60 + i })}</g>`;
    });
  return { svg, props };
}

/** The picture of the card in the chosen direction; `head` 'dark' or 'light'. */
export function woolPicture({ head }) {
  const rnd = makeRng(8);
  const ground = patch(rnd);
  const scale = 1.13;
  const large = `<g transform="translate(${n(50 + 2.2 * scale)} ${n(75 - 5 * scale)}) scale(${scale})">${ground.behind}${sheep({ head, detail: 'full', line: 0.42, seed: 3 })}${ground.front}</g>`;
  const back = pasture(head);
  const small = `<g transform="translate(.2 -.5) scale(.168)" filter="url(#pLineSmall)">${sheep({ head, detail: 'small', line: 1.6, seed: 90 })}</g>`;
  return picture({
    colors: { halo: c('halo'), haze: c('haze'), shade: c('shade'), line: c('line') },
    back: back.svg,
    props: back.props,
    thing: large,
    corner: small,
  });
}
