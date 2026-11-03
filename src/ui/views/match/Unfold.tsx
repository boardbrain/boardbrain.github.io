import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import styles from './Unfold.module.css';

const VARIANTS = {
  closed: { height: 0, opacity: 0 },
  open: { height: 'auto', opacity: 1 },
};
const TRANSITION = { duration: 0.2, ease: 'easeOut' } as const;

type UnfoldProps = {
  readonly isOpen: boolean;
  readonly children: ReactNode;
};

/**
 * Settings that a switch reveals (design I2-C page 3, feedback of the product owner): they open
 * smoothly instead of pushing the page down at once, and the page then scrolls just far enough
 * to show them whole, above the card hand. Rows inside are divided like the rows of a group. On
 * the first render they are shown without opening.
 */
export function Unfold({ isOpen, children }: UnfoldProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion() === true;
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <m.div
          ref={ref}
          className={styles.unfold}
          variants={VARIANTS}
          initial="closed"
          animate="open"
          exit="closed"
          transition={TRANSITION}
          onAnimationComplete={(definition) => {
            if (definition === 'open') {
              ref.current?.scrollIntoView({
                block: 'nearest',
                behavior: isReduced ? 'auto' : 'smooth',
              });
            }
          }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
