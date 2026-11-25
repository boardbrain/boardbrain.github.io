import { AnimatePresence, m, useIsPresent, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { cx } from './classNames';
import styles from './Unfold.module.css';

// Clipped only while moving, so a focus ring or a golden nudge inside is not cut off once open.
// `transitionEnd` did not take the clipping back reliably (PO 25.11.2026: the nudge of "Neue
// Person" was cut off); the panel lifts it itself when it has opened.
const VARIANTS = {
  closed: { height: 0, opacity: 0, overflow: 'hidden' },
  open: { height: 'auto', opacity: 1 },
};
const TRANSITION = { duration: 0.2, ease: 'easeOut' } as const;
const QUICK = { duration: 0.15, ease: 'easeOut' } as const;

type UnfoldProps = {
  readonly isOpen: boolean;
  /** Rows inside are divided like the rows of a group (the options of a match). */
  readonly isDivided?: boolean;
  /** For a short message: a little quicker. */
  readonly isQuick?: boolean;
  readonly className?: string | undefined;
  readonly children: ReactNode;
};

/**
 * Content that a control reveals, such as settings, a form, a search or a message (design I2-C
 * page 3, feedback of the product owner): it opens smoothly instead of pushing the page down at
 * once, and the page then scrolls just far enough to show it whole, above the card hand. On the
 * first render it is shown without opening.
 */
export function Unfold({
  isOpen,
  isDivided = false,
  isQuick = false,
  className,
  children,
}: UnfoldProps): React.JSX.Element {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <Panel
          key="unfold"
          className={cx(styles.unfold, isDivided && styles.divided, className)}
          isQuick={isQuick}
        >
          {children}
        </Panel>
      )}
    </AnimatePresence>
  );
}

function Panel({
  className,
  isQuick,
  children,
}: {
  readonly className: string;
  readonly isQuick: boolean;
  readonly children: ReactNode;
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion() === true;
  // While closing it is gone for screen readers, taps and tests.
  const isPresent = useIsPresent();
  return (
    <m.div
      ref={ref}
      className={className}
      variants={VARIANTS}
      initial="closed"
      animate="open"
      exit="closed"
      transition={isQuick ? QUICK : TRANSITION}
      aria-hidden={isPresent ? undefined : true}
      inert={!isPresent}
      onAnimationStart={(definition) => {
        if (definition === 'closed' && ref.current !== null) {
          ref.current.style.overflow = 'hidden';
        }
      }}
      onAnimationComplete={(definition) => {
        if (definition === 'open' && ref.current !== null) {
          ref.current.style.overflow = 'visible';
          ref.current.scrollIntoView({
            block: 'nearest',
            behavior: isReduced ? 'auto' : 'smooth',
          });
        }
      }}
    >
      {children}
    </m.div>
  );
}
