import { animate } from 'motion/react';

const NUDGE_SECONDS = 0.9;

/**
 * Lights up once in gold what is still missing for a greyed-out button (design I3-B E6): every
 * element marked `data-need` inside `root`; no red, no text. The button only looks disabled, so
 * a tap shows the way instead of doing nothing. The first missing element comes into view first,
 * gliding unless the device asks for reduced motion (PO 25.11.2026).
 */
export function nudgeMissing(root: HTMLElement | null, isReduced = false): void {
  if (root === null) {
    return;
  }
  const missing = [...root.querySelectorAll('[data-need]')];
  missing[0]?.scrollIntoView({ block: 'center', behavior: isReduced ? 'auto' : 'smooth' });
  const gold = getComputedStyle(root).getPropertyValue('--color-accent-text').trim();
  for (const element of missing) {
    void animate(
      element,
      { boxShadow: [`0 0 0 0px ${gold}00`, `0 0 0 3px ${gold}cc`, `0 0 0 0px ${gold}00`] },
      { duration: NUDGE_SECONDS, ease: 'easeInOut' },
    );
  }
}
