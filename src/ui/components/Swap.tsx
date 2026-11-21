import { m } from 'motion/react';
import { useState, type ReactNode } from 'react';

/** Where new content starts from: faded, shifted or smaller. */
export type SwapFrom = {
  readonly opacity?: number;
  readonly x?: number;
  readonly scale?: number;
};

const SETTLED = { opacity: 1, x: 0, scale: 1 };
const SWAP = { duration: 0.15, ease: 'easeOut' } as const;

/**
 * Content that changes in place, such as a symbol, a day or a sorted list: the new content
 * fades in briefly instead of replacing the old at once. Nothing moves on the first render.
 */
export function Swap({
  swapKey,
  from,
  className,
  children,
}: {
  /** A new key means new content. */
  readonly swapKey: string;
  readonly from: SwapFrom;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}): React.JSX.Element {
  const [shown, setShown] = useState(swapKey);
  const [hasSwapped, setHasSwapped] = useState(false);
  if (shown !== swapKey) {
    setShown(swapKey);
    setHasSwapped(true);
  }
  return (
    <m.span
      key={swapKey}
      className={className}
      initial={hasSwapped ? from : false}
      animate={SETTLED}
      transition={SWAP}
    >
      {children}
    </m.span>
  );
}
