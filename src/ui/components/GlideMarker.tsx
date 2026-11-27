import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useEffectEvent, useLayoutEffect, useRef } from 'react';
import { cx } from './classNames';
import styles from './GlideMarker.module.css';

// Design I3-D: the marker of a choice glides like the segments of the statistics.
const GLIDE = { type: 'spring', stiffness: 380, damping: 32 } as const;
const CHOSEN =
  ':scope > [aria-pressed="true"], :scope > [aria-checked="true"], :scope > [aria-selected="true"]';

/**
 * The marker of a choice that glides to the chosen option (design I3-D, for every choice of the
 * app since the PO 27.11.2026): the gold behind the chosen segment or the bar below the chosen tab.
 * It stands first in the choice, which must be positioned, behind its options; the options are
 * its siblings and the chosen one is marked by `aria-pressed`, `aria-checked` or `aria-selected`.
 * `at` is the chosen key; the look (top, height, colour) comes from `className`. Without a chosen
 * option it is hidden.
 */
export function GlideMarker({
  at,
  className,
}: {
  readonly at: string | null;
  readonly className?: string | undefined;
}): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef<{ x: number; width: number } | null>(null);
  const isReduced = useReducedMotion() === true;
  const place = useEffectEvent((isGliding: boolean): void => {
    const marker = ref.current;
    if (marker === null) {
      return;
    }
    const chosen = marker.parentElement?.querySelector<HTMLElement>(CHOSEN) ?? null;
    if (chosen === null) {
      last.current = null;
      marker.style.visibility = 'hidden';
      return;
    }
    const now = { x: chosen.offsetLeft, width: chosen.offsetWidth };
    const before = last.current;
    last.current = now;
    marker.style.visibility = '';
    marker.style.left = `${String(now.x)}px`;
    marker.style.width = `${String(now.width)}px`;
    if (
      isGliding &&
      !isReduced &&
      before !== null &&
      (before.x !== now.x || before.width !== now.width)
    ) {
      void animate(marker, { left: [before.x, now.x], width: [before.width, now.width] }, GLIDE);
    }
  });
  // Measuring the chosen option and moving the marker (external system: the DOM and Motion).
  useLayoutEffect(() => {
    place(true);
  }, [at]);
  // A choice or option that changes its width, e.g. on turning the tablet or with a new count,
  // takes the marker along.
  useEffect(() => {
    const marker = ref.current;
    const choice = marker?.parentElement;
    if (choice === null || choice === undefined) {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      place(false);
    });
    observer.observe(choice);
    // Not the marker itself: its own new width would start the observer again.
    for (const option of choice.children) {
      if (option !== marker) {
        observer.observe(option);
      }
    }
    return () => {
      observer.disconnect();
    };
  }, []);
  return <span ref={ref} className={cx(styles.marker, className)} aria-hidden="true" />;
}
