import { animate, type AnimationPlaybackControls } from 'motion/react';

const GLIDE = { duration: 0.35, ease: 'easeOut' } as const;

/**
 * Moves a scroll area to a position: gliding with Motion, at once with reduced motion. Returns the
 * running glide, so a newer one can stop it.
 */
export function glideScroll(
  scroller: HTMLElement,
  to: { readonly left: number; readonly top: number },
  isReduced: boolean,
): AnimationPlaybackControls | null {
  if (isReduced) {
    scroller.scrollTo(to.left, to.top);
    return null;
  }
  const fromLeft = scroller.scrollLeft;
  const fromTop = scroller.scrollTop;
  return animate(0, 1, {
    ...GLIDE,
    onUpdate: (share) => {
      scroller.scrollTo(
        fromLeft + (to.left - fromLeft) * share,
        fromTop + (to.top - fromTop) * share,
      );
    },
  });
}
