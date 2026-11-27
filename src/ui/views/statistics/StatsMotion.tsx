import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useEffectEvent, useLayoutEffect, useRef, type RefObject } from 'react';
import { GlideMarker } from '@/ui/components/GlideMarker';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import styles from './StatsMotion.module.css';

// Design I3-D: numbers count, bars grow, rows glide; soft and without overshoot.
const COUNT = { duration: 0.8, ease: [0.22, 1, 0.36, 1] } as const;
const GROW = { duration: 0.75, ease: [0.22, 1, 0.36, 1] } as const;
const GLIDE = { duration: 0.55, ease: [0.22, 1, 0.36, 1] } as const;

/**
 * A number that counts from its previous value to the new one, from 0 the first time
 * (design I3-D). Motion writes the text directly, React renders only the final value.
 */
export function CountUp({
  value,
  format,
  className,
}: {
  readonly value: number;
  readonly format: (value: number) => string;
  readonly className?: string | undefined;
}): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const isReduced = useReducedMotion() === true;
  const show = useEffectEvent((current: number): string => format(current));
  // Motion (external system) counts in the element.
  useEffect(() => {
    const element = ref.current;
    const from = previous.current;
    previous.current = value;
    if (element === null || isReduced || from === value) {
      return;
    }
    const controls = animate(from, value, {
      ...COUNT,
      onUpdate: (current) => {
        element.textContent = show(current);
      },
    });
    return () => {
      controls.stop();
      element.textContent = show(value);
    };
  }, [value, isReduced]);
  return (
    <span ref={ref} className={cx(styles.number, className)}>
      {format(value)}
    </span>
  );
}

/**
 * The filling of a bar: it grows from its previous length to the new one, from nothing the first
 * time (design I3-D). `share` from 0 to 1.
 */
export function GrowBar({
  share,
  isVertical = false,
  className,
}: {
  readonly share: number;
  readonly isVertical?: boolean;
  readonly className?: string | undefined;
}): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const isReduced = useReducedMotion() === true;
  const scale = Math.max(0, Math.min(1, share));
  const axis = isVertical ? 'scaleY' : 'scaleX';
  // Motion (external system) moves the bar.
  useEffect(() => {
    const element = ref.current;
    const from = previous.current;
    previous.current = scale;
    if (element === null || isReduced || from === scale) {
      return;
    }
    const controls = animate(element, { [axis]: [from, scale] }, GROW);
    return () => {
      controls.stop();
    };
  }, [scale, axis, isReduced]);
  return (
    <span
      ref={ref}
      className={cx(isVertical ? styles.fillVertical : styles.fill, className)}
      style={{ transform: `${axis}(${String(scale)})` }}
    />
  );
}

/**
 * Rows marked with `data-flip` glide from their old to their new place when the order changes,
 * e.g. after another criterion (design I3-D). Positions relative to the container, so scrolling
 * in between does not count as a move.
 */
export function useGlide(container: RefObject<HTMLElement | null>, key: string): void {
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const isReduced = useReducedMotion() === true;
  // Measuring the layout before it is painted (external system: the DOM and Motion).
  useLayoutEffect(() => {
    const root = container.current;
    if (root === null) {
      return;
    }
    const next = new Map<string, { x: number; y: number }>();
    for (const element of root.querySelectorAll<HTMLElement>('[data-flip]')) {
      const id = element.dataset.flip ?? '';
      const box = element.getBoundingClientRect();
      const base = root.getBoundingClientRect();
      const now = { x: box.left - base.left, y: box.top - base.top };
      next.set(id, now);
      const before = positions.current.get(id);
      if (!isReduced && before !== undefined && (before.x !== now.x || before.y !== now.y)) {
        void animate(element, { x: [before.x - now.x, 0], y: [before.y - now.y, 0] }, GLIDE);
      }
    }
    positions.current = next;
  }, [container, key, isReduced]);
}

/**
 * A choice of a few values with a marker that glides to the chosen one (design I3-D, the look of
 * the segments of the app). Too many values scroll sideways; the chosen one comes into view.
 */
export function SlidingSegments<K extends string>({
  label,
  options,
  selected,
  onSelect,
  isSmall = false,
  className,
}: {
  readonly label: string;
  readonly options: readonly { readonly key: K; readonly label: string; readonly note?: string }[];
  readonly selected: K;
  readonly onSelect: (key: K) => void;
  readonly isSmall?: boolean;
  readonly className?: string | undefined;
}): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);
  const isReduced = useReducedMotion() === true;
  // Too many values: the chosen one comes into view (external system: the DOM).
  useLayoutEffect(() => {
    const root = rootRef.current;
    const chosen = root?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (root === null || chosen === null || chosen === undefined) {
      return;
    }
    const isFirst = !hasScrolled.current;
    hasScrolled.current = true;
    if (root.scrollWidth > root.clientWidth) {
      root.scrollTo({
        left: Math.max(0, chosen.offsetLeft - root.clientWidth / 2 + chosen.offsetWidth / 2),
        behavior: isReduced || isFirst ? 'auto' : 'smooth',
      });
    }
  }, [selected, options.length, isReduced]);
  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label={label}
      className={cx(styles.segments, isSmall && styles.small, className)}
    >
      <GlideMarker at={`${selected}:${String(options.length)}`} className={styles.thumb} />
      {options.map((option) => (
        <PressableButton
          key={option.key}
          type="button"
          role="radio"
          aria-checked={option.key === selected}
          className={styles.segment}
          onClick={() => {
            onSelect(option.key);
          }}
        >
          {option.label}
          {option.note !== undefined && <small className={styles.note}>{option.note}</small>}
        </PressableButton>
      ))}
    </div>
  );
}
