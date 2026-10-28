import { m, type HTMLMotionProps } from 'motion/react';
import { Link } from 'react-router';
import styles from './Pressable.module.css';

/** How a control answers a touch (K-4): cards rise, everything else shimmers. */
export type PressLook = 'card' | 'control';

// K-4: the pressed state replaces the browser's tap highlight (NFA-GB-04, Architecture 13.6).
// Motion animates only the CSS variable --press; the look comes from Pressable.module.css.
// Controls react quickly (variant K), cards rise smoothly (variant K1). The transition inside
// whileTap applies while pressing, the outer one on release.
const PRESS = {
  control: {
    whileTap: { '--press': 1, transition: { duration: 0.09, ease: [0.2, 0, 0, 1] } },
    transition: { duration: 0.22, ease: 'easeOut' },
  },
  card: {
    whileTap: { '--press': 1, transition: { duration: 0.18, ease: 'easeOut' } },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
} as const;

// In an object, because a component in a plain variable would need a capital letter.
const animated = { Link: m.create(Link) };

function pressClass(look: PressLook, className: string | undefined): string {
  return [styles[look], className].filter((name) => typeof name === 'string').join(' ');
}

type PressableButtonProps = Omit<HTMLMotionProps<'button'>, 'whileTap' | 'transition'> & {
  readonly look?: PressLook;
  readonly className?: string | undefined;
};

/**
 * A button with the app's own pressed state instead of the browser's tap highlight (K-4). Every
 * button of the app is one; a disabled button does not react.
 */
export function PressableButton({
  look = 'control',
  className,
  ...props
}: PressableButtonProps): React.JSX.Element {
  return <m.button {...props} {...PRESS[look]} className={pressClass(look, className)} />;
}

type PressableLinkProps = Omit<
  React.ComponentProps<typeof animated.Link>,
  'whileTap' | 'transition' | 'className'
> & {
  readonly look?: PressLook;
  readonly className?: string | undefined;
};

/**
 * A link with the app's own pressed state (K-4); cards such as person cards use `look="card"`.
 * Links cannot be dragged: in Safari, holding and moving a link starts a drag that swallows the
 * release, and the card would stay pressed.
 */
export function PressableLink({
  look = 'control',
  className,
  ...props
}: PressableLinkProps): React.JSX.Element {
  return (
    <animated.Link
      draggable={false}
      {...props}
      {...PRESS[look]}
      className={pressClass(look, className)}
    />
  );
}
