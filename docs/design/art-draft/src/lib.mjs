// Shared helpers of the art generators (preview stage of the graphics round, 16.11.2026).
// Everything is deterministic: shapes come from a seeded generator, never from Math.random.
import { readFileSync } from 'node:fs';

export const ROOT = 'C:/dev/boardbrain';

/** Seeded generator (Mulberry32), returns numbers in [0, 1). */
export function makeRng(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (min, max) => min + (max - min) * next();
  next.pick = (list) => list[Math.floor(next() * list.length)];
  return next;
}

/** Number with two decimals at most. */
export const n = (value) => String(Math.round(value * 100) / 100);

/** Straight path through points. */
export function poly(points, close = true) {
  return `M${points.map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}${close ? 'Z' : ''}`;
}

/** Smooth closed path through points (Catmull-Rom as cubic Béziers). */
export function smoothClosed(points) {
  const count = points.length;
  let d = `M${n(points[0][0])} ${n(points[0][1])}`;
  for (let i = 0; i < count; i++) {
    const p0 = points[(i - 1 + count) % count];
    const p1 = points[i];
    const p2 = points[(i + 1) % count];
    const p3 = points[(i + 2) % count];
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(
      p2[0] - (p3[0] - p1[0]) / 6,
    )} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return `${d}Z`;
}

/** Smooth open path through points. */
export function smoothOpen(points) {
  const count = points.length;
  let d = `M${n(points[0][0])} ${n(points[0][1])}`;
  for (let i = 0; i < count - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(count - 1, i + 2)];
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(
      p2[0] - (p3[0] - p1[0]) / 6,
    )} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
}

/** An irregular blob: a closed smooth curve whose radius wobbles around `radius`. */
export function blob(cx, cy, radius, rnd, { points = 11, wobble = 0.14, squash = 1 } = {}) {
  const phase = rnd() * Math.PI * 2;
  const list = [];
  for (let i = 0; i < points; i++) {
    const angle = phase + (i / points) * Math.PI * 2;
    const r = radius * (1 + rnd.range(-wobble, wobble));
    list.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * squash]);
  }
  return smoothClosed(list);
}

// The top-level elements of an SVG source: [start, end] of each child of <svg>.
function topLevel(svg) {
  const pattern = /<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g;
  const parts = [];
  let depth = 0;
  let start = -1;
  let match;
  while ((match = pattern.exec(svg)) !== null) {
    const isClose = match[1] === '/';
    const isSelf = match[4] === '/';
    if (!isClose) {
      if (depth === 1) start = match.index;
      if (!isSelf) depth++;
      else if (depth === 1) parts.push(svg.slice(start, pattern.lastIndex));
    } else {
      depth--;
      if (depth === 1) parts.push(svg.slice(start, pattern.lastIndex));
    }
  }
  return parts;
}

/**
 * The frame S4 of an existing resource card (design I2-C): everything but its picture. The
 * picture is the one top-level group clipped to the window of the card.
 */
export function frameOf(name) {
  const svg = readFileSync(`${ROOT}/scripts/art/${name}.svg`, 'utf8');
  const parts = topLevel(svg);
  const picture = parts.findIndex((part) => part.startsWith('<g clip-path='));
  if (picture < 0) throw new Error(`${name}: no clipped picture found`);
  const clip = /clip-path="url\(#([^)]+)\)"/.exec(parts[picture])[1];
  // The four symbols of the corners are groups moved into the corners.
  const isCorner = (part) => part.startsWith('<g transform="translate(');
  return {
    before: parts.slice(0, picture).join(''),
    after: parts.slice(picture + 1).filter((part) => !isCorner(part)).join(''),
    oldCorners: parts.slice(picture + 1).filter(isCorner).join(''),
    clip,
    oldPicture: parts[picture],
  };
}

/** A whole card: frame S4 around a new picture. */
export function card(frame, { defs, body, corner }, css = '') {
  // As on the cards of the board game: the symbol upright in the upper corners, turned in the lower.
  const corners =
    corner === undefined
      ? frame.oldCorners
      : [
          [8.4, 8.4, 0],
          [91.6, 8.4, 0],
          [8.4, 141.6, 180],
          [91.6, 141.6, 180],
        ]
          .map(([x, y, turn]) => `<use href="#${corner}" transform="translate(${x} ${y}) rotate(${turn})"/>`)
          .join('');
  const style = css === '' ? '' : `<style>${css}</style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150">${style}${frame.before}<defs>${defs}</defs><g clip-path="url(#${frame.clip})">${body}</g>${frame.after}${corners}</svg>`;
}
