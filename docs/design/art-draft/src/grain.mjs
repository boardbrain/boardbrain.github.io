// Resource card "Getreide": a sheaf tied with a band as a sticker over fields seen from above at
// an angle: standing grain, the edge where it has been cut, stubble with small sheaves, a track.
import { blob, makeRng, n, smoothOpen } from './lib.mjs';
import { picture } from './scene.mjs';

/** Colours of the card; they become tokens `--color-art-…` when the card is built for real. */
export const PALETTE = {
  'crop-1': '#a3741c',
  'crop-2': '#d6a533',
  'crop-3': '#eec654',
  'crop-4': '#f9e08c',
  'crop-5': '#734d12',
  'stub-1': '#b3945a',
  'stub-2': '#d9bf84',
  'stub-3': '#efdcaa',
  'track-1': '#6a4924',
  'track-2': '#99703e',
  'track-3': '#c29d66',
  'leaf-1': '#2f4c1c',
  'leaf-2': '#587e2b',
  'leaf-3': '#85a83d',
  'leaf-4': '#b5cd5d',
  'straw-1': '#86590f',
  'straw-2': '#c68f27',
  'straw-3': '#eab948',
  'straw-4': '#fce594',
  'straw-5': '#5a390a',
  'band-1': '#643f13',
  'band-2': '#a8752b',
  poppy: '#d6412c',
  corn: '#4a6ed0',
  line: '#3b2507',
  shade: '#3a2505',
  haze: '#fff1bc',
  halo: '#fffae0',
};

const c = (name) => `var(--g-${name})`;

// An ear of grain from `at` in direction `angle` (radians, 0 = to the right).
export function ear(at, angle, length, rnd, isFull, tone = 'straw-3') {
  const u = [Math.cos(angle), Math.sin(angle)];
  const v = [-u[1], u[0]];
  const turn = (angle * 180) / Math.PI;
  let body = '';
  let awns = '';
  if (!isFull) {
    const mid = [at[0] + (u[0] * length) / 2, at[1] + (u[1] * length) / 2];
    body += `<ellipse cx="${n(mid[0])}" cy="${n(mid[1])}" rx="${n(length / 2)}" ry="${n(length * 0.17)}" transform="rotate(${n(turn)} ${n(mid[0])} ${n(mid[1])})" fill="${c(tone)}" stroke="${c('straw-1')}" stroke-width=".5"/>`;
    return { body, awns };
  }
  const pairs = 6;
  for (let k = 0; k <= pairs; k++) {
    const along = ((k + 0.5) / (pairs + 0.6)) * length;
    const slim = 1 - (along / length) * 0.35;
    for (const side of k === pairs ? [0] : [-1, 1]) {
      const x = at[0] + u[0] * along + v[0] * side * 0.74 * slim;
      const y = at[1] + u[1] * along + v[1] * side * 0.74 * slim;
      const lean = turn + side * 27;
      body += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(1.22 * slim)}" ry="${n(0.64 * slim)}" transform="rotate(${n(lean)} ${n(x)} ${n(y)})" fill="${c(tone)}" stroke="${c('straw-1')}" stroke-width=".17"/>`;
      body += `<ellipse cx="${n(x - 0.15)}" cy="${n(y - 0.18)}" rx="${n(0.6 * slim)}" ry="${n(0.2 * slim)}" transform="rotate(${n(lean)} ${n(x)} ${n(y)})" fill="${c('straw-4')}" opacity=".8"/>`;
      const reach = rnd.range(2.3, 3.8);
      const away = angle + side * rnd.range(0.2, 0.42);
      awns += `<path d="M${n(x)} ${n(y)}L${n(x + Math.cos(away) * reach)} ${n(y + Math.sin(away) * reach)}" stroke="${c('straw-2')}" stroke-width=".19" stroke-linecap="round"/>`;
    }
  }
  return { body, awns };
}

/**
 * A sheaf standing on y = 20, its band around y = 0, about 36 wide and 46 high. `detail`: 'full'
 * or 'small' (in the field and in the corners). Returns its parts: the stubble it stands on, the
 * sheaf itself (to get a contour as a whole) and the fine awns that lie over the contour.
 */
export function sheaf({ detail = 'full', seed = 5, id = 'gs' }) {
  const rnd = makeRng(seed);
  const isFull = detail === 'full';
  const foot = (x) => 19 + 2.2 * Math.sqrt(Math.max(0, 1 - (x / 14.5) ** 2));
  const waist = 4.2;
  const side = (t) => `Q${n(t * (waist + 10.3 * 0.28))} 9`;

  // Below the band: stalks spreading to the foot, lighter on the left, darker on the right.
  const count = isFull ? 30 : 8;
  let skirt = '';
  const feet = [];
  for (let i = 0; i <= count; i++) {
    const t = -1 + (2 * i) / count;
    feet.push([t * 14.5, foot(t * 14.5) + (i === 0 || i === count ? 0 : rnd.range(-0.5, 0.6))]);
  }
  const outline = `M${-waist} 1${side(-1)} ${n(feet[0][0])} ${n(feet[0][1])}${feet.slice(1).map((p) => `L${n(p[0])} ${n(p[1])}`).join('')}${side(1)} ${waist} 1Z`;
  skirt += `<clipPath id="${id}k"><path d="${outline}"/></clipPath><path d="${outline}" fill="${c('straw-2')}"/><g clip-path="url(#${id}k)">`;
  for (let i = 0; i < count; i++) {
    const t0 = -1 + (2 * i) / count;
    const t1 = -1 + (2 * (i + 1)) / count;
    const d = `M${n(t0 * waist)} 1${side(t0)} ${n(feet[i][0])} ${n(feet[i][1] + 1)}L${n(feet[i + 1][0])} ${n(feet[i + 1][1] + 1)}${side(t1)} ${n(t1 * waist)} 1Z`;
    const tone = rnd.pick(['straw-2', 'straw-3', 'straw-3', 'straw-2', 'straw-4']);
    skirt += `<path d="${d}" fill="${c(tone)}" stroke="${c('straw-1')}" stroke-width="${isFull ? '.24' : '.6'}" stroke-opacity=".75"/>`;
  }
  skirt += `<rect x="-16" y="0" width="13" height="24" fill="${c('straw-4')}" opacity=".3"${isFull ? ' filter="url(#pSoft)"' : ''}/>`;
  skirt += `<rect x="4.5" y="0" width="12" height="24" fill="${c('straw-1')}" opacity=".5"${isFull ? ' filter="url(#pSoft)"' : ''}/>`;
  skirt += `<rect x="-6" y="1" width="12" height="3.2" fill="${c('straw-5')}" opacity=".4"${isFull ? ' filter="url(#pSoft)"' : ''}/>`;
  skirt += `</g>`;

  // Above the band: the stalks fan out and bend outwards under the weight of the ears.
  let fan = `<path d="M${-waist} -1L-10.5 -10Q0 -17 10.5 -10L${waist} -1Z" fill="${c('straw-1')}"/>`;
  let awns = '';
  const stalks = isFull ? 26 : 8;
  const layers = [[], []];
  for (let j = 0; j < stalks; j++) {
    const t = -1 + (2 * (j + 0.5)) / stalks + rnd.range(-0.03, 0.03);
    const isBack = j % 2 === 0;
    const angle = (t * (isBack ? 44 : 56) * Math.PI) / 180;
    const length = (isBack ? 15.5 : 12.5) + 5 * (1 - Math.abs(t)) + rnd.range(-1.2, 1.2);
    const root = [t * (waist - 0.4), -1];
    const bend = [root[0] + Math.sin(angle * 0.55) * length * 0.55, root[1] - Math.cos(angle * 0.55) * length * 0.55];
    const tip = [root[0] + Math.sin(angle) * length, root[1] - Math.cos(angle) * length * 0.94];
    const d = `M${n(root[0])} ${n(root[1])}Q${n(bend[0])} ${n(bend[1])} ${n(tip[0])} ${n(tip[1])}`;
    let part = `<path d="${d}" fill="none" stroke="${c('straw-1')}" stroke-width="${isFull ? '1.25' : '2.4'}" stroke-linecap="round"/>`;
    part += `<path d="${d}" fill="none" stroke="${c(isBack ? 'straw-2' : t < 0 ? 'straw-4' : 'straw-3')}" stroke-width="${isFull ? '.8' : '1.5'}" stroke-linecap="round"/>`;
    const heading = Math.atan2(tip[1] - bend[1], tip[0] - bend[0]) + t * 0.3;
    const head = ear(tip, heading, isFull ? rnd.range(6.6, 8) : 7.5, rnd, isFull, isBack ? 'straw-2' : 'straw-3');
    part += head.body;
    awns += head.awns;
    layers[isBack ? 0 : 1].push(part);
  }
  fan += layers[0].join('') + layers[1].join('');

  if (!isFull) {
    // Small (PO 16.11.2026: not single sticks): a full head of plump ears, two rows deep.
    fan = `<path d="M${-waist} -1L-10.5 -9.5Q0 -17 10.5 -9.5L${waist} -1Z" fill="${c('straw-2')}" stroke="${c('straw-1')}" stroke-width=".6" stroke-linejoin="round"/>`;
    for (const x of [-2.4, -0.8, 0.8, 2.4]) fan += `<path d="M${n(x)} -1L${n(x * 3.2)} -11" stroke="${c('straw-1')}" stroke-width=".5" opacity=".6"/>`;
    const head = (t, spread, reach, rx, ry, tone) => {
      const angle = (t * spread * Math.PI) / 180;
      const cx = Math.sin(angle) * reach;
      const cy = -1 - Math.cos(angle) * reach * 0.95;
      const turn = (Math.atan2(-Math.cos(angle), Math.sin(angle)) * 180) / Math.PI + t * 16;
      return (
        `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${rx}" ry="${ry}" transform="rotate(${n(turn)} ${n(cx)} ${n(cy)})" fill="${c(tone)}" stroke="${c('straw-1')}" stroke-width=".55"/>` +
        `<ellipse cx="${n(cx - 0.3)}" cy="${n(cy - 0.5)}" rx="${n(rx * 0.55)}" ry="${n(ry * 0.3)}" transform="rotate(${n(turn)} ${n(cx)} ${n(cy)})" fill="${c('straw-4')}" opacity=".75"/>`
      );
    };
    const outer = [];
    for (let j = 0; j < 11; j++) {
      const t = -1 + (2 * j) / 10;
      outer.push({ away: Math.abs(t), svg: head(t, 70, 13 + 2.2 * (1 - Math.abs(t)), 4.7, 2.15, j % 2 === 0 ? 'straw-2' : 'straw-3') });
    }
    fan += outer.sort((a, b) => b.away - a.away).map((part) => part.svg).join('');
    for (let j = 0; j < 6; j++) fan += head(-0.8 + (1.6 * j) / 5, 58, 8.6 + (j % 2) * 1.1, 4.2, 2, 'straw-3');
    awns = '';
  }

  // The band of twisted straw with its knot.
  let band = `<path d="M5 -.2q3.4 .4 4.6 2.6M5 .6q2 1.6 2.4 4.2" fill="none" stroke="${c('line')}" stroke-width="1.5" stroke-linecap="round"/><path d="M5 -.2q3.4 .4 4.6 2.6M5 .6q2 1.6 2.4 4.2" fill="none" stroke="${c('band-2')}" stroke-width=".85" stroke-linecap="round"/>`;
  band += `<path d="M-5 -1.9Q0 -.5 5 -1.9L5.2 1.6Q0 3.2 -5.2 1.6Z" fill="${c('band-2')}" stroke="${c('line')}" stroke-width="${isFull ? '.35' : '.8'}" stroke-linejoin="round"/>`;
  if (isFull) {
    for (let i = 0; i < 7; i++) {
      const x = -4.3 + i * 1.4;
      band += `<path d="M${n(x)} ${n(-1.2 + (1 - (x / 5) ** 2) * 1.2)}l1 ${n(2.9)}" stroke="${c('band-1')}" stroke-width=".42" stroke-linecap="round" opacity=".85"/>`;
    }
    band += `<path d="M-4.6 -1.5Q0 -.2 4.6 -1.5" fill="none" stroke="${c('straw-4')}" stroke-width=".3" opacity=".7"/>`;
  }

  // The stubble it stands on, with its shade.
  let ground = '';
  if (isFull) {
    ground += `<path d="${blob(1, 21.7, 17.5, rnd, { points: 16, wobble: 0.14, squash: 0.15 })}" fill="${c('stub-1')}"/>`;
    ground += `<path d="${blob(0, 21.3, 14, rnd, { points: 14, wobble: 0.16, squash: 0.12 })}" fill="${c('stub-2')}"/>`;
    ground += `<ellipse cx="6" cy="22" rx="13" ry="2" fill="${c('shade')}" opacity=".4" filter="url(#pSoft)"/>`;
    for (let i = 0; i < 60; i++) {
      const x = rnd.range(-17, 19);
      const y = rnd.range(20, 24.6);
      ground += `<path d="M${n(x)} ${n(y)}l${n(rnd.range(-0.5, 0.5))} ${n(-rnd.range(0.8, 1.8))}" stroke="${c(rnd.pick(['stub-2', 'stub-3', 'stub-1']))}" stroke-width=".4" stroke-linecap="round"/>`;
    }
  }
  return { ground, body: skirt + fan + band, awns };
}

// A leafy tree seen from above at an angle, lit from the upper left.
function tree(x, y, r, rnd) {
  let svg = `<path d="${blob(x + r * 0.55, y + r * 0.7, r * 0.95, rnd, { squash: 0.75 })}" fill="${c('shade')}" opacity=".4"/>`;
  svg += `<path d="${blob(x, y, r, rnd, { points: 12, wobble: 0.16 })}" fill="${c('leaf-1')}"/>`;
  svg += `<path d="${blob(x - r * 0.13, y - r * 0.16, r * 0.8, rnd, { points: 11, wobble: 0.17 })}" fill="${c('leaf-2')}"/>`;
  for (let i = 0; i < 5; i++) {
    const a = rnd.range(2.3, 5.3);
    const d = rnd.range(0.12, 0.5) * r;
    const cx = x - r * 0.12 + Math.cos(a) * d;
    const cy = y - r * 0.14 + Math.sin(a) * d;
    const size = rnd.range(0.2, 0.36) * r;
    svg += `<path d="${blob(cx, cy, size, rnd, { points: 7, wobble: 0.2 })}" fill="${c('leaf-3')}"/>`;
    if (i % 2 === 0) svg += `<path d="${blob(cx - size * 0.3, cy - size * 0.32, size * 0.42, rnd, { points: 6, wobble: 0.2 })}" fill="${c('leaf-4')}" opacity=".7"/>`;
  }
  return svg;
}

function fields() {
  const rnd = makeRng(19);
  // Rows of the field run towards a point far above the card.
  const row = (xb, y) => {
    const t = (150 - y) / 155;
    return 50 + (xb - 50) * (1 - 0.42 * t) + 7 * t + Math.sin(t * 3 + xb * 0.03) * 1.4;
  };
  let svg = `<rect width="100" height="150" fill="${c('crop-2')}"/>`;
  for (let i = 0; i < 6; i++) {
    const y = 4 + i * 16;
    const points = [];
    for (let x = -10; x <= 110; x += 20) points.push([x, y + (x - 50) * 0.18 + rnd.range(-3, 3)]);
    svg += `<path d="${smoothOpen(points)}" fill="none" stroke="${c(i % 2 === 0 ? 'crop-3' : 'crop-1')}" stroke-width="${n(rnd.range(6, 11))}" opacity="${i % 2 === 0 ? '.55' : '.32'}" filter="url(#pSofter)"/>`;
  }
  for (let xb = -40; xb <= 140; xb += 2.9) {
    const points = [];
    for (let y = -6; y <= 100; y += 12) points.push([row(xb, y), y]);
    svg += `<path d="${smoothOpen(points)}" fill="none" stroke="${c('crop-1')}" stroke-width=".5" opacity=".34"/>`;
    svg += `<path d="${smoothOpen(points)}" transform="translate(.9 0)" fill="none" stroke="${c('crop-4')}" stroke-width=".4" opacity=".3"/>`;
  }
  for (let i = 0; i < 520; i++) {
    const y = rnd.range(0, 98);
    const x = rnd.range(2, 98);
    const size = 0.55 + y / 170;
    const tone = rnd.pick(['crop-3', 'crop-4', 'crop-1', 'crop-3']);
    svg += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(0.85 * size)}" ry="${n(0.3 * size)}" transform="rotate(${n(rnd.range(-80, -40))} ${n(x)} ${n(y)})" fill="${c(tone)}" opacity="${tone === 'crop-1' ? '.45' : '.75'}"/>`;
  }

  // Where the grain has been cut: stubble towards the viewer, the standing grain as a low wall.
  const front = [
    [-6, 93],
    [12, 87],
    [30, 91],
    [47, 84],
    [61, 70],
    [74, 60],
    [88, 57],
    [106, 54],
  ];
  const cut = smoothOpen(front);
  svg += `<path d="${cut}L106 156L-6 156Z" fill="${c('stub-2')}"/>`;
  let stubble = '';
  for (let i = 0; i < 16; i++) {
    stubble += `<path d="${blob(rnd.range(0, 100), rnd.range(70, 150), rnd.range(4, 9), rnd, { wobble: 0.3, squash: 0.55 })}" fill="${c(rnd.pick(['stub-3', 'stub-1']))}" opacity=".4" filter="url(#pSoft)"/>`;
  }
  for (let xb = -40; xb <= 140; xb += 2.9) {
    for (let y = 56; y <= 150; y += rnd.range(1.6, 2.8)) {
      const x = row(xb, y) + rnd.range(-0.3, 0.3);
      const size = 0.6 + y / 190;
      stubble += `<path d="M${n(x)} ${n(y)}l${n(rnd.range(-0.3, 0.3))} ${n(-size * rnd.range(0.7, 1.3))}" stroke="${c(rnd() < 0.7 ? 'stub-1' : 'stub-3')}" stroke-width="${n(0.3 + size * 0.12)}" stroke-linecap="round" opacity=".85"/>`;
    }
  }
  svg += `<clipPath id="gStub"><path d="${cut}L106 156L-6 156Z"/></clipPath><g clip-path="url(#gStub)">${stubble}`;
  svg += `<path d="${cut}" transform="translate(1 1.6)" fill="none" stroke="${c('shade')}" stroke-width="3.4" opacity=".4" filter="url(#pSoft)"/></g>`;
  svg += `<path d="${cut}" transform="translate(0 -1.2)" fill="none" stroke="${c('crop-5')}" stroke-width="2.8" stroke-linecap="round"/>`;
  for (let x = -4; x <= 104; x += rnd.range(0.7, 1.3)) {
    // Height of the cut edge at x, between the points of the line.
    let k = 0;
    while (k < front.length - 2 && front[k + 1][0] < x) k++;
    const t = Math.min(1, Math.max(0, (x - front[k][0]) / (front[k + 1][0] - front[k][0])));
    const y = front[k][1] + (front[k + 1][1] - front[k][1]) * t;
    svg += `<path d="M${n(x)} ${n(y + 0.2)}l${n(rnd.range(-0.25, 0.25))} ${n(-rnd.range(1.8, 3))}" stroke="${c(rnd.pick(['crop-3', 'crop-1', 'crop-4']))}" stroke-width=".4" stroke-linecap="round" opacity=".9"/>`;
  }
  for (let i = 0; i < 26; i++) {
    const x = rnd.range(4, 96);
    let k = 0;
    while (k < front.length - 2 && front[k + 1][0] < x) k++;
    const y = front[k][1] + ((front[k + 1][1] - front[k][1]) * (x - front[k][0])) / (front[k + 1][0] - front[k][0]) - rnd.range(3.5, 12);
    svg += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rnd.range(0.4, 0.7))}" fill="${c(rnd() < 0.6 ? 'poppy' : 'corn')}"/>`;
  }

  // The track along the right: two ruts, grass between them and at its sides.
  const way = [
    [64, 158],
    [73, 134],
    [82, 112],
    [86, 92],
    [83, 72],
    [84, 52],
    [89, 30],
    [97, 4],
  ];
  const wide = (y) => 3.4 + 3.4 * (y / 150);
  const shifted = (off) => way.map(([x, y]) => [x + off * wide(y), y]);
  const band = (from, to, fill) => `<path d="${smoothOpen(shifted(from))}L${shifted(to).reverse().map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}Z" fill="${fill}"/>`;
  let props = '';
  svg += band(-0.72, 0.72, c('leaf-2')) + band(-0.56, 0.56, c('track-2'));
  svg += band(-0.42, -0.18, c('track-1')) + band(0.18, 0.42, c('track-1'));
  // Grass between the ruts: tufts, uneven.
  for (let y = 2; y < 150; y += rnd.range(0.5, 1.5)) {
    let k = 0;
    while (k < way.length - 2 && way[k + 1][1] > y) k++;
    const t = (y - way[k][1]) / (way[k + 1][1] - way[k][1]);
    const x = way[k][0] + (way[k + 1][0] - way[k][0]) * t + rnd.range(-0.12, 0.12) * wide(y);
    const size = 0.5 + y / 200;
    svg += `<path d="M${n(x)} ${n(y)}l${n(rnd.range(-0.5, 0.5) * size)} ${n(-rnd.range(0.8, 1.6) * size)}" stroke="${c(rnd.pick(['leaf-2', 'leaf-3', 'leaf-3', 'leaf-4']))}" stroke-width="${n(0.4 * size + 0.15)}" stroke-linecap="round" opacity=".85"/>`;
  }
  svg += `<path d="${smoothOpen(shifted(-0.5))}" fill="none" stroke="${c('track-3')}" stroke-width=".4" opacity=".7"/>`;

  // A hedge along the far end of the field and a tree by the track.
  for (let x = 6; x <= 64; x += rnd.range(3.6, 5.2)) {
    const y = 9.5 + Math.sin(x * 0.09) * 1.6;
    props += `<path d="${blob(x + 1.2, y + 1.5, 2.6, rnd, { squash: 0.7 })}" fill="${c('shade')}" opacity=".35"/>`;
    props += `<path d="${blob(x, y, rnd.range(2.2, 3), rnd, { points: 9, wobble: 0.2 })}" fill="${c('leaf-1')}"/>`;
    props += `<path d="${blob(x - 0.5, y - 0.6, rnd.range(1.3, 1.9), rnd, { points: 8, wobble: 0.22 })}" fill="${c('leaf-2')}"/>`;
    props += `<path d="${blob(x - 0.9, y - 1, 0.8, rnd, { points: 6, wobble: 0.22 })}" fill="${c('leaf-3')}"/>`;
  }
  props += tree(71, 35, 6.6, rnd) + tree(63, 27, 4.4, rnd);

  // Small sheaves on the stubble, larger towards the viewer.
  const stooks = [
    [17, 103],
    [28, 110],
    [58, 100],
    [24, 121],
    [47, 126],
    [15, 134],
    [36, 135],
    [84, 128],
    [90, 104],
  ];
  stooks
    .sort((a, b) => a[1] - b[1])
    .forEach(([x, y], i) => {
      const scale = 0.1 + (y / 150) * 0.16;
      const part = sheaf({ detail: 'small', seed: 30 + i, id: `gm${i}` });
      props += `<ellipse cx="${n(x + 9 * scale)}" cy="${n(y + 21 * scale)}" rx="${n(17 * scale)}" ry="${n(4.4 * scale)}" fill="${c('shade')}" opacity=".4"/>`;
      props += `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rnd.range(-7, 7))}) scale(${n(scale)})">${part.body}</g>`;
    });
  return { svg, props };
}

/** The picture of the card in the chosen direction. */
export function grainPicture() {
  const large = sheaf({ detail: 'full', seed: 5, id: 'gs' });
  const scale = 1.2;
  const place = `translate(50 ${n(75 + 1.5 * scale)}) scale(${scale})`;
  const thing = `<g transform="${place}">${large.ground}<g filter="url(#pLine)">${large.body}</g>${large.awns}</g>`;
  const small = sheaf({ detail: 'small', seed: 77, id: 'gc' });
  const corner = `<g filter="url(#pLineSmall)"><g transform="translate(0 .5) scale(.19)">${small.body}</g></g>`;
  const back = fields();
  return picture({
    colors: { halo: c('halo'), haze: c('haze'), shade: c('shade'), line: c('line') },
    back: back.svg,
    props: back.props,
    thing,
    corner,
  });
}
