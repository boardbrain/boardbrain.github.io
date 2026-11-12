import { m, type HTMLMotionProps } from 'motion/react';

// I2-C: results appear with a simple fade-in; D-2 designs wheel and highlighting on its own.
const REVEAL = { duration: 0.42, ease: [0.2, 0, 0, 1] } as const;
const RISE_PX = 8;

type RevealProps = Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'transition'> & {
  /** Where the element rests, e.g. a lifted card (−10 px). */
  readonly restY?: number;
};

/**
 * Shows a freshly drawn result with a simple fade-in from slightly below (design I2-C). The
 * result is stored before (ADR-014); a new key starts the fade-in again, also after a restart
 * (US-AB-05 AK-3).
 */
export function Reveal({ restY = 0, ...props }: RevealProps): React.JSX.Element {
  return (
    <m.div
      {...props}
      initial={{ opacity: 0, y: restY + RISE_PX }}
      animate={{ opacity: 1, y: restY }}
      transition={REVEAL}
    />
  );
}
