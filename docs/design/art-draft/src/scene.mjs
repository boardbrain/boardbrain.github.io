// Shared building blocks of the resource cards in the chosen direction (PO 16.11.2026: V3 painted
// with a thin contour, R2 soft glow): one view and one light for every card, solid bodies drawn as
// projections of 3D shapes, the paint filters and the assembly of a picture.
import { n, poly } from './lib.mjs';

export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const unit = (a) => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));

const rad = (degrees) => (degrees * Math.PI) / 180;

// The view of every card: turned 38° to the side and 30° down, as the pile of logs. World: x to
// the right and towards the viewer, y up, z away to the right. Light from the upper left.
const cT = Math.cos(rad(38));
const sT = Math.sin(rad(38));
const cP = Math.cos(rad(30));
const sP = Math.sin(rad(30));
const RIGHT = [cT, 0, sT];
const UP = [-sT * sP, cP, cT * sP];
const AWAY = [-sT * cP, -sP, cT * cP];

export const TO_VIEWER = mul(AWAY, -1);
export const LIGHT = unit(add(add(mul(RIGHT, -0.55), mul(UP, 0.62)), mul(AWAY, -0.56)));

/** A camera drawing the world at `scale` units of the picture, its origin at `at`. */
export function camera(scale, at = [0, 0]) {
  return {
    scale,
    project: (p) => [at[0] + dot(p, RIGHT) * scale, at[1] - dot(p, UP) * scale],
    depth: (p) => dot(p, AWAY),
  };
}

/**
 * A box: `size` [length, height, width] around `centre`, tilted by `tilt` in its length–height
 * plane (one end lifted), then turned by `yaw` around the vertical.
 */
export function box({ centre, size, yaw = 0, tilt = 0 }) {
  const cy = Math.cos(rad(yaw));
  const sy = Math.sin(rad(yaw));
  const ct = Math.cos(rad(tilt));
  const st = Math.sin(rad(tilt));
  const turn = (v) => [v[0] * cy + v[2] * sy, v[1], -v[0] * sy + v[2] * cy];
  const axes = [turn([ct, st, 0]), turn([-st, ct, 0]), turn([0, 0, 1])];
  const half = size.map((part) => part / 2);
  const corner = (a, b, cc) => add(centre, add(add(mul(axes[0], a * half[0]), mul(axes[1], b * half[1])), mul(axes[2], cc * half[2])));
  const faces = [];
  for (let axis = 0; axis < 3; axis++) {
    for (const sign of [1, -1]) {
      const u = (axis + 1) % 3;
      const v = (axis + 2) % 3;
      const at = (a, b) => {
        const k = [0, 0, 0];
        k[axis] = sign;
        k[u] = a;
        k[v] = b;
        return corner(k[0], k[1], k[2]);
      };
      faces.push({ normal: mul(axes[axis], sign), points: [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)], axis, sign });
    }
  }
  const vertices = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const cc of [-1, 1]) vertices.push(corner(a, b, cc));
  return { faces, vertices, centre, axes, size };
}

/** A convex body from points: its triangles, found by trying every three points. */
export function hull(points) {
  const faces = [];
  const middle = mul(points.reduce(add, [0, 0, 0]), 1 / points.length);
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = j + 1; k < points.length; k++) {
        let normal = cross(sub(points[j], points[i]), sub(points[k], points[i]));
        if (Math.hypot(...normal) < 1e-9) continue;
        normal = unit(normal);
        let order = [points[i], points[j], points[k]];
        if (dot(normal, sub(points[i], middle)) < 0) {
          normal = mul(normal, -1);
          order = [points[i], points[k], points[j]];
        }
        if (points.every((p) => dot(normal, sub(p, points[i])) < 1e-6)) faces.push({ normal, points: order });
      }
    }
  }
  return { faces, vertices: points, centre: middle };
}

/**
 * The order to draw solid bodies that do not run into each other: a body behind a plane that
 * separates it from another one, seen from the viewer, comes first.
 */
export function drawOrder(bodies) {
  const count = bodies.length;
  const before = bodies.map(() => new Set());
  const relate = (i, j) => {
    for (const [a, b] of [
      [i, j],
      [j, i],
    ]) {
      for (const face of bodies[a].faces) {
        if (bodies[b].vertices.every((v) => dot(face.normal, sub(v, face.points[0])) > -0.02)) {
          // b lies outside this face of a: b is in front when the face looks at the viewer.
          if (dot(face.normal, TO_VIEWER) > 0) before[b].add(a);
          else before[a].add(b);
          return;
        }
      }
    }
    const depth = (body) => dot(body.centre, AWAY);
    if (depth(bodies[i]) > depth(bodies[j])) before[j].add(i);
    else before[i].add(j);
  };
  for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) relate(i, j);
  const order = [];
  const done = new Set();
  while (order.length < count) {
    const next = [...Array(count).keys()].find((i) => !done.has(i) && [...before[i]].every((k) => done.has(k)));
    if (next === undefined) throw new Error('the bodies cover each other in a circle');
    done.add(next);
    order.push(next);
  }
  return order;
}

/** How brightly a face is lit, 0 to 1. */
export const lit = (normal) => Math.max(0, dot(normal, LIGHT));

/**
 * A face of a body: its colour, then light or shade over it by its angle to the light. Colours
 * are tokens; light and shade are their opacity, so no colour is computed.
 */
export function face(points2d, normal, { base, light, dark, line, lineWidth = 0.45 }) {
  const d = poly(points2d);
  const t = lit(normal);
  let svg = `<path d="${d}" fill="${base}"/>`;
  if (t > 0.5) svg += `<path d="${d}" fill="${light}" opacity="${n(Math.min(1, (t - 0.5) * 1.9))}"/>`;
  else svg += `<path d="${d}" fill="${dark}" opacity="${n(Math.min(1, (0.5 - t) * 1.7))}"/>`;
  if (line !== undefined) svg += `<path d="${d}" fill="none" stroke="${line}" stroke-width="${n(lineWidth)}" stroke-linejoin="round"/>`;
  return svg;
}

/** The faces of a body the viewer sees. */
export const seen = (body) => body.faces.filter((f) => dot(f.normal, TO_VIEWER) > 0.001);

/**
 * Filters and gradients every picture uses: soft shade, the dark edge inside the frame, haze,
 * the glow R2 around the resource, the brush (uneven edges and grain) for the background and,
 * finer, for the resource, and a thin contour around a whole shape.
 */
export function sharedDefs({ halo, haze, shade, line }) {
  const brush = (id, region, wave, move, grainAt, strength) => `
    <filter id="${id}" ${region} color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${wave}" numOctaves="2" seed="4" result="wave"/>
      <feDisplacementMap in="SourceGraphic" in2="wave" scale="${move}" xChannelSelector="R" yChannelSelector="G" result="moved"/>
      <feTurbulence type="fractalNoise" baseFrequency="${grainAt}" numOctaves="3" seed="9" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="${strength} ${strength} 0 0 ${n(0.5 - strength)}  ${strength} ${strength} 0 0 ${n(0.5 - strength)}  ${strength} ${strength} 0 0 ${n(0.5 - strength)}  0 0 0 0 1" result="gray"/>
      <feBlend in="gray" in2="moved" mode="soft-light" result="textured"/>
      <feComposite in="textured" in2="moved" operator="in"/>
    </filter>`;
  return `
    <filter id="pSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter>
    <filter id="pSofter" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="pEdge" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.6"/></filter>
    <linearGradient id="pHaze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${haze}" stop-opacity=".3"/>
      <stop offset=".42" stop-color="${haze}" stop-opacity="0"/>
      <stop offset=".7" stop-color="${shade}" stop-opacity="0"/>
      <stop offset="1" stop-color="${shade}" stop-opacity=".22"/>
    </linearGradient>
    <filter id="pGlow" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="fat"/>
      <feGaussianBlur in="fat" stdDeviation="1.1" result="near"/>
      <feGaussianBlur in="fat" stdDeviation="3.4" result="wide"/>
      <feComponentTransfer in="wide" result="wideSoft"><feFuncA type="linear" slope=".75"/></feComponentTransfer>
      <feComponentTransfer in="near" result="nearFull"><feFuncA type="linear" slope="1.5"/></feComponentTransfer>
      <feFlood flood-color="${halo}" result="light"/>
      <feComposite in="light" in2="wideSoft" operator="in" result="glowWide"/>
      <feComposite in="light" in2="nearFull" operator="in" result="glowNear"/>
      <feMerge><feMergeNode in="glowWide"/><feMergeNode in="glowNear"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="pLine" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius=".4" result="fat"/>
      <feFlood flood-color="${line}"/>
      <feComposite in2="fat" operator="in" result="rim"/>
      <feMerge><feMergeNode in="rim"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="pLineSmall" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius=".28" result="fat"/>
      <feFlood flood-color="${line}"/>
      <feComposite in2="fat" operator="in" result="rim"/>
      <feMerge><feMergeNode in="rim"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${brush('pBack', 'x="0" y="0" width="100" height="150" filterUnits="userSpaceOnUse"', '.5', '1.5', '1.1', 0.28)}
    ${brush('pThing', 'x="-10%" y="-10%" width="120%" height="120%"', '.9', '.45', '1.4', 0.22)}`;
}

/**
 * A picture: the painted background, haze and the dark edge inside the frame, then the resource
 * as a sticker with its glow. `corner` is the small symbol of the four corners.
 */
export function picture({ colors, defs = '', back, props = '', thing, corner }) {
  const all = `${sharedDefs(colors)}${defs}<g id="pCorner">${corner}</g>`;
  let body = `<g filter="url(#pBack)">${back}</g>`;
  // Small things of the scene keep their shape: they get the finer brush of the resource.
  if (props !== '') body += `<g filter="url(#pThing)">${props}</g>`;
  body += `<rect width="100" height="150" fill="url(#pHaze)"/>`;
  body += `<rect x="3.5" y="3.5" width="93" height="143" fill="none" stroke="${colors.shade}" stroke-width="5" opacity=".5" filter="url(#pEdge)"/>`;
  body += `<g filter="url(#pGlow)"><g filter="url(#pThing)">${thing}</g></g>`;
  return { defs: all, body, corner: 'pCorner' };
}
