import { animate } from 'motion/react';

// Design I2-E: after "Wiederholen" in the flow, also on a look back, cards and places glide from
// where they lay to their place on the page before drawing (FLIP: first, last, invert, play), and
// a place set free fades in. Elements carry their identity across pages in `data-flip`.

/** Where the elements with `data-flip` lay before a change of the page. */
export type GlideSnapshot = ReadonlyMap<
  string,
  { readonly rect: DOMRect; readonly isFilled: boolean }
>;

const GLIDE = { duration: 0.3, ease: [0.3, 0.7, 0.2, 1] } as const;
const APPEAR = { duration: 0.2, ease: 'easeOut' } as const;
const PLACE_OPACITY = 0.55;

function flipElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[data-flip]')];
}

/** Notes where every element with `data-flip` lies now. */
export function snapshotGlide(root: HTMLElement): GlideSnapshot {
  return new Map(
    flipElements(root).map((element) => [
      element.dataset.flip ?? '',
      { rect: element.getBoundingClientRect(), isFilled: element.dataset.filled !== undefined },
    ]),
  );
}

/**
 * Lets every element with `data-flip` glide from where it lay in `before` to where it lies now;
 * new cards fade in, and a place no longer covered by a card shows its dashed line again.
 */
export function playGlide(root: HTMLElement, before: GlideSnapshot): void {
  for (const element of flipElements(root)) {
    const key = element.dataset.flip ?? '';
    const was = before.get(key);
    const isPlace = key.startsWith('place:');
    if (was === undefined) {
      animate(element, { opacity: [0, isPlace ? PLACE_OPACITY : 1] }, APPEAR);
      continue;
    }
    if (isPlace) {
      if (was.isFilled && element.dataset.filled === undefined) {
        animate(element, { opacity: [0, PLACE_OPACITY] }, APPEAR);
      }
      continue;
    }
    const now = element.getBoundingClientRect();
    if (now.width === 0) {
      continue;
    }
    const scale = was.rect.width / now.width;
    const x = was.rect.left + was.rect.width / 2 - (now.left + now.width / 2);
    const y = was.rect.top + was.rect.height / 2 - (now.top + now.height / 2);
    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5 && Math.abs(scale - 1) < 0.005) {
      continue;
    }
    animate(element, { x: [x, 0], y: [y, 0], scale: [scale, 1] }, GLIDE);
  }
}
