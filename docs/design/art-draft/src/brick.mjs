// Resource card "Lehm": four bricks (B2) as a sticker over a clay pit seen from above at an
// angle. The bricks are real boxes: two on the ground, one across both, one leaning with its
// lower edge on the ground and its underside on the upper edge of the front brick.
import { blob, makeRng, n, poly, smoothClosed, smoothOpen } from './lib.mjs';
import { add, box, camera, dot, drawOrder, face, lit, mul, picture, seen, sub, TO_VIEWER } from './scene.mjs';

/** Colours of the card; they become tokens `--color-art-…` when the card is built for real. */
export const PALETTE = {
  'earth-1': '#6f381f',
  'earth-2': '#a55c31',
  'earth-3': '#c47c46',
  'earth-4': '#e3ab73',
  'earth-5': '#4a2212',
  'pool-1': '#5d7a72',
  'pool-2': '#9dbdb0',
  'grass-1': '#5c6a2a',
  'grass-2': '#8b9a3f',
  'brick-1': '#74200f',
  'brick-2': '#c44a25',
  'brick-3': '#e86c3c',
  'brick-4': '#f8a674',
  'timber-1': '#33200f',
  'timber-2': '#6f4a29',
  'timber-3': '#a97f4d',
  rail: '#cdb89b',
  line: '#35120a',
  shade: '#260d06',
  haze: '#f3cda0',
  halo: '#fffae0',
};

const c = (name) => `var(--b-${name})`;
const BRICK = { base: c('brick-2'), light: c('brick-3'), dark: c('brick-1'), line: c('line') };
const SIZE = [2.4, 0.7, 1.15];

// ---------------------------------------------------------------------------------------------
// Bricks
// ---------------------------------------------------------------------------------------------

// A point on a face: u along its first edge, v along its last.
const onFace = (f, u, v) => add(f.points[0], add(mul(sub(f.points[1], f.points[0]), u), mul(sub(f.points[3], f.points[0]), v)));

function drawBrick(body, cam, rnd, { isSmall = false } = {}) {
  let svg = '';
  const faces = seen(body).sort((a, b) => lit(a.normal) - lit(b.normal));
  for (const f of faces) {
    const points = f.points.map(cam.project);
    svg += face(points, f.normal, { ...BRICK, lineWidth: isSmall ? 0.5 : 0.45 });
    if (isSmall) continue;
    // Grains of sand and small pits of fired clay.
    const grains = Math.round(rnd.range(5, 9) * (f.axis === 1 ? 1.6 : f.axis === 2 ? 1 : 0.5));
    for (let i = 0; i < grains; i++) {
      const [x, y] = cam.project(onFace(f, rnd.range(0.07, 0.93), rnd.range(0.1, 0.9)));
      const isLight = rnd() < 0.4;
      svg += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rnd.range(0.14, 0.34))}" ry="${n(rnd.range(0.1, 0.22))}" transform="rotate(${n(rnd.range(-40, 40))} ${n(x)} ${n(y)})" fill="${c(isLight ? 'brick-4' : 'brick-1')}" opacity="${isLight ? '.5' : '.42'}"/>`;
    }
  }
  if (!isSmall) {
    // Worn edges catch the light where two faces in view meet.
    for (let i = 0; i < faces.length; i++) {
      for (let j = i + 1; j < faces.length; j++) {
        const shared = faces[i].points.filter((p) => faces[j].points.some((q) => Math.hypot(...sub(p, q)) < 1e-6));
        if (shared.length === 2 && Math.max(lit(faces[i].normal), lit(faces[j].normal)) > 0.6) {
          const [a, b] = shared.map(cam.project);
          svg += `<path d="M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}" stroke="${c('brick-4')}" stroke-width=".3" stroke-linecap="round" opacity=".75"/>`;
        }
      }
    }
  }
  const outline = faces.map((f) => poly(f.points.map(cam.project))).join('');
  return { svg, outline, points: faces.flatMap((f) => f.points.map(cam.project)) };
}

// Draws bodies in the right order, each casting a soft shade on those behind it, and centres them.
function drawPile(bodies, scale, centre, id, options = {}) {
  const cam = camera(scale);
  const rnd = makeRng(77);
  const drawn = drawOrder(bodies).map((index) => drawBrick(bodies[index], cam, rnd, options));
  const xs = drawn.flatMap((d) => d.points.map((p) => p[0]));
  const ys = drawn.flatMap((d) => d.points.map((p) => p[1]));
  const dx = centre[0] - (Math.min(...xs) + Math.max(...xs)) / 2;
  const dy = centre[1] - (Math.min(...ys) + Math.max(...ys)) / 2;
  let defs = '';
  let svg = '';
  drawn.forEach((d, i) => {
    if (i > 0) {
      defs += `<clipPath id="${id}${i}">${drawn.slice(0, i).map((before) => `<path d="${before.outline}"/>`).join('')}</clipPath>`;
      const move = options.isSmall ? '.3 .4' : '1 1.4';
      svg += `<g clip-path="url(#${id}${i})"><path d="${d.outline}" transform="translate(${move})" fill="${c('shade')}" opacity=".5"${options.isSmall ? '' : ' filter="url(#pSoft)"'}/></g>`;
    }
    svg += d.svg;
  });
  return { defs, svg: `<g transform="translate(${n(dx)} ${n(dy)})">${svg}</g>` };
}

function bricks() {
  const [length, height, width] = SIZE;
  const front = box({ centre: [0, height / 2, 0], size: SIZE });
  const back = box({ centre: [0.55, height / 2, 1.6], size: SIZE, yaw: -10 });
  const across = box({ centre: [-0.55, height * 1.5, 0.72], size: SIZE, yaw: 84 });
  // The leaning brick: its lower edge on the ground at x0 in front of the pile, its underside on
  // the upper right edge of the front brick, so its angle follows from where it stands.
  const tilt = 28;
  const a = (tilt * Math.PI) / 180;
  const x0 = length / 2 + height / Math.tan(a);
  const along = [-Math.cos(a), Math.sin(a)];
  const up = [Math.sin(a), Math.cos(a)];
  const leaning = box({
    centre: [x0 + (length / 2) * along[0] + (height / 2) * up[0], 0.01 + (length / 2) * along[1] + (height / 2) * up[1], -0.08],
    size: [length, height, width * 0.98],
    tilt: -tilt,
  });
  return [front, back, across, leaning];
}

function cornerBricks() {
  const [, height] = SIZE;
  return [
    box({ centre: [0, height / 2, 0], size: SIZE }),
    box({ centre: [0.1, height / 2, 1.3], size: SIZE }),
    box({ centre: [-0.15, height * 1.5, 0.62], size: SIZE, yaw: 6 }),
  ];
}

// ---------------------------------------------------------------------------------------------
// The clay pit
// ---------------------------------------------------------------------------------------------

// The rim of a level of the pit: an uneven oval.
function rim(cx, cy, rx, ry, rnd) {
  const p = [rnd() * 6, rnd() * 6, rnd() * 6];
  const radius = (a) => 1 + 0.022 * Math.sin(2 * a + p[0]) + 0.018 * Math.sin(3 * a + p[1]) + 0.012 * Math.sin(5 * a + p[2]);
  const at = (a) => [cx + Math.cos(a) * rx * radius(a), cy + Math.sin(a) * ry * radius(a)];
  const points = [];
  for (let i = 0; i < 40; i++) points.push(at((i / 40) * Math.PI * 2));
  return { d: smoothClosed(points), at };
}

// Thin timber between two points of a small 3D model.
function timber(cam, from, to, width = 0.55) {
  const [a, b] = [cam.project(from), cam.project(to)];
  const d = `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`;
  return `<path d="${d}" stroke="${c('timber-1')}" stroke-width="${n(width + 0.35)}" stroke-linecap="round"/><path d="${d}" stroke="${c('timber-2')}" stroke-width="${n(width)}" stroke-linecap="round"/><path d="${d}" transform="translate(-.12 -.1)" stroke="${c('timber-3')}" stroke-width="${n(width * 0.35)}" stroke-linecap="round" opacity=".8"/>`;
}

// The hoist of the pit: a timber tower with a platform and an arm with a rope.
function tower(x, y) {
  const cam = camera(3, [x, y]);
  const w = 1.15;
  const posts = [
    [-w, w],
    [w, w],
    [-w, -w],
    [w, -w],
  ];
  let svg = `<ellipse cx="${n(x + 5)}" cy="${n(y + 2.2)}" rx="7" ry="2.6" fill="${c('shade')}" opacity=".38" filter="url(#pSoft)"/>`;
  const levels = [0, 2.3, 4.6];
  // Far side first, the near posts last.
  const sides = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
  ];
  for (const [i, j] of sides) {
    for (let k = 1; k < levels.length; k++) {
      svg += timber(cam, [posts[i][0], levels[k], posts[i][1]], [posts[j][0], levels[k], posts[j][1]], 0.45);
      const isBraced = (i === 2 && j === 3) || (i === 1 && j === 3);
      if (isBraced) svg += timber(cam, [posts[i][0], levels[k - 1], posts[i][1]], [posts[j][0], levels[k], posts[j][1]], 0.35);
    }
    if (i === 0) svg += timber(cam, [posts[0][0], 0, posts[0][1]], [posts[0][0], 4.6, posts[0][1]]);
  }
  for (const index of [1, 2, 3]) svg += timber(cam, [posts[index][0], 0, posts[index][1]], [posts[index][0], 4.6, posts[index][1]]);
  // Platform and arm.
  const deck = box({ centre: [0, 4.75, 0], size: [2.9, 0.22, 2.9] });
  for (const f of seen(deck)) svg += face(f.points.map(cam.project), f.normal, { base: c('timber-2'), light: c('timber-3'), dark: c('timber-1'), line: c('timber-1'), lineWidth: 0.3 });
  svg += timber(cam, [0.4, 4.9, -0.2], [0.4, 6.6, -0.2], 0.5);
  svg += timber(cam, [0.4, 6.5, -0.2], [0.4, 6.1, -2.6], 0.45);
  const top = cam.project([0.4, 6.1, -2.6]);
  const low = cam.project([0.4, 2.2, -2.6]);
  svg += `<path d="M${n(top[0])} ${n(top[1])}L${n(low[0])} ${n(low[1])}" stroke="${c('timber-1')}" stroke-width=".22"/>`;
  const bucket = box({ centre: [0.4, 1.85, -2.6], size: [0.8, 0.7, 0.8] });
  for (const f of seen(bucket)) svg += face(f.points.map(cam.project), f.normal, { base: c('timber-2'), light: c('timber-3'), dark: c('timber-1'), line: c('timber-1'), lineWidth: 0.25 });
  return svg;
}

// A cart loaded with bricks, standing on the rails; `yaw` turns it along them.
function cart(x, y, yaw) {
  const cam = camera(3.3, [x, y]);
  const wood = { base: c('timber-2'), light: c('timber-3'), dark: c('timber-1'), line: c('timber-1'), lineWidth: 0.3 };
  let svg = `<ellipse cx="${n(x + 2.4)}" cy="${n(y + 1.2)}" rx="5.2" ry="2" fill="${c('shade')}" opacity=".4" filter="url(#pSoft)"/>`;
  const body = box({ centre: [0, 0.95, 0], size: [2.5, 0.95, 1.4], yaw });
  const visibleSide = dot(body.axes[2], TO_VIEWER) > 0 ? 1 : -1;
  const wheel = (along, side) => {
    const centre = add([0, 0.42, 0], add(mul(body.axes[0], along), mul(body.axes[2], side * 0.74)));
    const points = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      points.push(cam.project(add(centre, add(mul(body.axes[0], Math.cos(a) * 0.42), [0, Math.sin(a) * 0.42, 0]))));
    }
    const hub = cam.project(centre);
    return `<path d="${smoothClosed(points)}" fill="${c('timber-1')}" stroke="${c('line')}" stroke-width=".3"/><circle cx="${n(hub[0])}" cy="${n(hub[1])}" r=".3" fill="${c('timber-3')}"/>`;
  };
  svg += wheel(-0.75, -visibleSide) + wheel(0.75, -visibleSide);
  for (const f of seen(body).sort((a, b) => lit(a.normal) - lit(b.normal))) svg += face(f.points.map(cam.project), f.normal, wood);
  const load = [
    box({ centre: add([0, 1.62, 0], mul(body.axes[0], -0.55)), size: [1.05, 0.4, 0.95], yaw: yaw + 8 }),
    box({ centre: add([0, 1.62, 0], mul(body.axes[0], 0.6)), size: [1.05, 0.4, 0.95], yaw: yaw - 6 }),
    box({ centre: [0, 2.02, 0], size: [1.05, 0.4, 0.95], yaw: yaw + 80 }),
  ];
  for (const index of drawOrder(load)) {
    for (const f of seen(load[index]).sort((a, b) => lit(a.normal) - lit(b.normal))) svg += face(f.points.map(cam.project), f.normal, { ...BRICK, lineWidth: 0.25 });
  }
  svg += wheel(-0.75, visibleSide) + wheel(0.75, visibleSide);
  return svg;
}

// A small stack of bricks left to dry.
function stack(x, y, yaw) {
  const cam = camera(2.1, [x, y]);
  const rows = [
    box({ centre: [0, 0.35, 0], size: [2.4, 0.7, 2.3], yaw }),
    box({ centre: [0, 1.05, 0], size: [2.4, 0.7, 2.3], yaw: yaw + 90 }),
  ];
  let svg = `<ellipse cx="${n(x + 2)}" cy="${n(y + 0.9)}" rx="3.6" ry="1.5" fill="${c('shade')}" opacity=".35" filter="url(#pSoft)"/>`;
  for (const row of rows) {
    for (const f of seen(row).sort((a, b) => lit(a.normal) - lit(b.normal))) {
      svg += face(f.points.map(cam.project), f.normal, { ...BRICK, lineWidth: 0.25 });
      if (f.axis !== 1) {
        const [p, q] = [cam.project(onFace(f, 0.5, 0)), cam.project(onFace(f, 0.5, 1))];
        svg += `<path d="M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}" stroke="${c('line')}" stroke-width=".2" opacity=".8"/>`;
      }
    }
  }
  return svg;
}

function pit() {
  const rnd = makeRng(5);
  let defs = `
    <linearGradient id="bLit" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${c('earth-5')}" stop-opacity=".5"/>
      <stop offset=".4" stop-color="${c('earth-5')}" stop-opacity="0"/>
      <stop offset=".55" stop-color="${c('earth-4')}" stop-opacity="0"/>
      <stop offset="1" stop-color="${c('earth-4')}" stop-opacity=".55"/>
    </linearGradient>`;
  // The ground around the pit: dry earth with patches of grass.
  let svg = `<rect width="100" height="150" fill="${c('earth-3')}"/>`;
  for (let i = 0; i < 16; i++) {
    svg += `<path d="${blob(rnd.range(0, 100), rnd.range(0, 150), rnd.range(4, 9), rnd, { wobble: 0.3, squash: 0.7 })}" fill="${c(rnd.pick(['earth-2', 'earth-4']))}" opacity=".5" filter="url(#pSoft)"/>`;
  }
  for (const [gx, gy] of [
    [12, 24],
    [22, 12],
    [90, 134],
    [80, 142],
    [93, 118],
    [8, 138],
    [91, 30],
  ]) {
    svg += `<path d="${blob(gx, gy, rnd.range(4, 7), rnd, { wobble: 0.3, squash: 0.65 })}" fill="${c('grass-1')}" opacity=".85"/>`;
    svg += `<path d="${blob(gx - 1, gy - 1, rnd.range(2, 3.6), rnd, { wobble: 0.3, squash: 0.6 })}" fill="${c('grass-2')}" opacity=".8"/>`;
  }

  // Four levels, each lower and smaller: the far wall of a level is in view, its near wall hidden.
  const levels = [
    { cx: 50, cy: 67, rx: 47, ry: 64, wall: 6.6 },
    { cx: 52, cy: 72.6, rx: 36, ry: 47.5, wall: 6 },
    { cx: 52.5, cy: 79, rx: 26.5, ry: 35.5, wall: 5.4 },
    { cx: 52, cy: 85, rx: 17.5, ry: 23, wall: 5 },
  ];
  const edges = [];
  levels.forEach((level, k) => {
    const edge = rim(level.cx, level.cy, level.rx, level.ry, rnd);
    edges.push(edge);
    defs += `<clipPath id="bk${k}"><path d="${edge.d}"/></clipPath>`;
    svg += `<path d="${edge.d}" fill="${c('earth-1')}"/><g clip-path="url(#bk${k})">`;
    // The wall: lit on the right, where it faces the light, shaded on the left; runnels of rain.
    svg += `<rect width="100" height="150" fill="url(#bLit)"/>`;
    for (let a = Math.PI * 1.02; a < Math.PI * 1.98; a += rnd.range(0.035, 0.08)) {
      const [x, y] = edge.at(a);
      const drop = level.wall * rnd.range(0.45, 1);
      svg += `<path d="M${n(x)} ${n(y)}Q${n(x + rnd.range(-0.5, 0.5))} ${n(y + drop / 2)} ${n(x + rnd.range(-0.4, 0.4))} ${n(y + drop)}" fill="none" stroke="${c('earth-5')}" stroke-width="${n(rnd.range(0.25, 0.55))}" stroke-linecap="round" opacity="${n(rnd.range(0.3, 0.6))}"/>`;
    }
    // The floor of the level, with the shade the wall casts on it and patches of lighter clay.
    svg += `<g transform="translate(0 ${level.wall})"><path d="${edge.d}" fill="${c(k % 2 === 0 ? 'earth-2' : 'earth-3')}"/>`;
    svg += `<path d="${edge.d}" fill="none" stroke="${c('shade')}" stroke-width="7" opacity=".42" transform="translate(2.2 1.6)" filter="url(#pSoft)"/></g>`;
    for (let i = 0; i < 9; i++) {
      const a = rnd() * Math.PI * 2;
      const [x, y] = edge.at(a);
      const px = level.cx + (x - level.cx) * rnd.range(0.82, 0.95);
      const py = level.cy + (y - level.cy) * rnd.range(0.82, 0.95) + level.wall;
      svg += `<path d="${blob(px, py, rnd.range(1.6, 3.6), rnd, { wobble: 0.3, squash: 0.55 })}" fill="${c(rnd.pick(['earth-4', 'earth-1']))}" opacity=".3"/>`;
    }
    svg += `</g>`;
    svg += `<path d="${edge.d}" fill="none" stroke="${c('earth-4')}" stroke-width=".5" opacity=".7"/>`;
  });
  // Water at the bottom of the pit.
  svg += `<path d="${blob(52, 102.5, 8, rnd, { wobble: 0.14, squash: 0.42 })}" fill="${c('pool-1')}"/>`;
  svg += `<path d="${blob(50.5, 101.9, 4.8, rnd, { wobble: 0.2, squash: 0.3 })}" fill="${c('pool-2')}" opacity=".6"/>`;
  let props = '';

  // Everything standing in the pit stands on the outer level, clear of its edges (PO 16.11.2026:
  // nothing may reach over a cliff). The far side of the level lies between the foot of its wall
  // and the edge of the next level; rails and cart follow the middle of the level.
  const rimAt = (edge, x, isFar) => {
    let best = null;
    for (let a = isFar ? Math.PI : 0; a <= (isFar ? 2 : 1) * Math.PI; a += 0.01) {
      const p = edge.at(a);
      if (best === null || Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
    }
    return best[1];
  };
  const farLevel = (x, share) => {
    const foot = rimAt(edges[0], x, true) + levels[0].wall;
    const edge = rimAt(edges[1], x, true);
    return foot + (edge - foot) * share;
  };
  const onTrack = (a, grow) => {
    const outer = edges[0].at(a);
    const inner = edges[1].at(a);
    const across = [outer[0] - inner[0], outer[1] - inner[1]];
    const width = Math.hypot(across[0], across[1]);
    return [inner[0] + across[0] * 0.5 + (across[0] / width) * grow, inner[1] + across[1] * 0.5 + (across[1] / width) * grow];
  };
  const from = Math.PI * 0.41;
  const to = Math.PI * 1.03;
  for (let a = from; a <= to; a += 0.033) {
    const [p, q] = [onTrack(a, -1.5), onTrack(a, 1.5)];
    props += `<path d="M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}" stroke="${c('timber-1')}" stroke-width=".75" stroke-linecap="round" opacity=".85"/>`;
  }
  for (const grow of [-0.85, 0.85]) {
    const points = [];
    for (let a = from; a <= to + 0.001; a += 0.03) points.push(onTrack(a, grow));
    props += `<path d="${smoothOpen(points)}" fill="none" stroke="${c('timber-1')}" stroke-width=".7"/><path d="${smoothOpen(points)}" fill="none" stroke="${c('rail')}" stroke-width=".32"/>`;
  }
  // The rails end at buffers of timber.
  for (const end of [from - 0.012, to + 0.012]) {
    const [end1, end2] = [onTrack(end, -1.8), onTrack(end, 1.8)];
    const buffer = `M${n(end1[0])} ${n(end1[1])}L${n(end2[0])} ${n(end2[1])}`;
    props += `<path d="${buffer}" stroke="${c('timber-1')}" stroke-width="1.7" stroke-linecap="round"/><path d="${buffer}" stroke="${c('timber-2')}" stroke-width="1" stroke-linecap="round"/>`;
  }
  const cartAt = onTrack(Math.PI * 0.59, 0);
  props += cart(cartAt[0], cartAt[1] + 0.4, 0);
  const lowStack = onTrack(Math.PI * 0.33, 0);
  props += stack(57, farLevel(57, 0.42), 12) + stack(65.5, farLevel(65.5, 0.5), -8) + stack(lowStack[0], lowStack[1], 20);
  props += tower(77.5, farLevel(77.5, 0.56));

  // Lumps of clay lying about.
  for (let i = 0; i < 46; i++) {
    const x = rnd.range(6, 94);
    const y = rnd.range(8, 142);
    const r = rnd.range(0.3, 0.8);
    svg += `<ellipse cx="${n(x + r * 0.5)}" cy="${n(y + r * 0.5)}" rx="${n(r * 1.2)}" ry="${n(r * 0.6)}" fill="${c('shade')}" opacity=".3"/>`;
    svg += `<path d="${blob(x, y, r, rnd, { points: 6, wobble: 0.25, squash: 0.75 })}" fill="${c(rnd.pick(['earth-1', 'earth-4', 'earth-2']))}"/>`;
  }
  return { defs, svg, props };
}

/** The picture of the card in the chosen direction. */
export function brickPicture() {
  const pile = drawPile(bricks(), 11.6, [50, 75], 'bc');
  const small = drawPile(cornerBricks(), 2.25, [0, 0], 'bs', { isSmall: true });
  const back = pit();
  return picture({
    colors: { halo: c('halo'), haze: c('haze'), shade: c('shade'), line: c('line') },
    defs: pile.defs + small.defs + back.defs,
    back: back.svg,
    props: back.props,
    thing: pile.svg,
    corner: small.svg,
  });
}
