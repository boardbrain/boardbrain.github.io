import { AnimatePresence, m, type TransformProperties } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { matchPath, NavLink, useLocation } from 'react-router';
import { t, type TextKey } from '@/i18n/t';
import {
  CARD_PIVOT,
  cardPose,
  foldedIconTop,
  handState,
  isCompactHand,
  LONG_PRESS_MS,
} from './cardHand';
import styles from './HandNavigation.module.css';

const ICON_SIZE = 22;
const FOLDED_ICON_SIZE = 16;
// A pressed card of the folded hand rises a little (NFA-GB-04).
const PRESS_LIFT = 8;
const CARD_SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const;
const FADE = { duration: 0.2 } as const;

/** An area of the app in the main navigation. */
export type HandArea = {
  readonly to: string;
  readonly label: TextKey;
  readonly icon: (props: { readonly size?: number | undefined }) => React.JSX.Element;
  /** Active only on exactly this address (the start view). */
  readonly isEnd?: boolean;
};

function cardClass({ isActive }: { readonly isActive: boolean }): string | undefined {
  return isActive ? styles.activeCard : styles.card;
}

function withUnit(value: string | number | undefined, unit: string): string {
  return typeof value === 'number' ? `${String(value)}${unit}` : (value ?? `0${unit}`);
}

// Like design D-3 in CSS: the card sinks along its own axis and then turns around the point
// below the hand. Motion's own order would shift it straight down.
function cardTransform({ rotate, y }: TransformProperties): string {
  return `rotate(${withUnit(rotate, 'deg')}) translateY(${withUnit(y, 'px')})`;
}

/**
 * Main navigation as a hand of cards (designs D-3 and K-3). On the start view the cards are
 * fanned out with their names; on every other page the hand folds into a flat arc that shows
 * only the symbols. A tap on a folded card leads straight to its area; a long press fans out the
 * whole hand with names over the dimmed view until a card or the backdrop is tapped.
 */
export function HandNavigation({
  areas,
}: {
  readonly areas: readonly HandArea[];
}): React.JSX.Element {
  const { pathname } = useLocation();
  // The hand is open only on the page where it was opened, so a page change folds it again.
  const [openAt, setOpenAt] = useState<string | undefined>(undefined);
  const pressTimer = useRef<number | undefined>(undefined);
  const wasLongPress = useRef(false);
  const state = handState(pathname, openAt === pathname);
  const isFolded = state === 'folded';
  const count = areas.length;

  // External system: Escape on the whole document closes the opened hand.
  useEffect(() => {
    if (state !== 'open') return undefined;
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpenAt(undefined);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [state]);

  function startPress(): void {
    wasLongPress.current = false;
    if (!isFolded) return;
    window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => {
      wasLongPress.current = true;
      setOpenAt(pathname);
    }, LONG_PRESS_MS);
  }

  function cancelPress(): void {
    window.clearTimeout(pressTimer.current);
  }

  function handleClick(event: React.MouseEvent): void {
    // The click after a long press only lifts the finger; it must not leave the page.
    if (wasLongPress.current) {
      wasLongPress.current = false;
      event.preventDefault();
      return;
    }
    setOpenAt(undefined);
  }

  function preventMenu(event: React.MouseEvent): void {
    // A long press on a link would open the browser menu "open in new tab".
    if (state !== 'fanned') event.preventDefault();
  }

  return (
    <>
      <AnimatePresence>
        {state === 'open' && (
          <m.button
            key="backdrop"
            type="button"
            className={styles.backdrop}
            aria-label={t('navigation.schliessen')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            onClick={() => {
              setOpenAt(undefined);
            }}
          />
        )}
      </AnimatePresence>
      <nav
        className={isFolded ? styles.foldedHand : styles.hand}
        aria-label={t('navigation.titel')}
        data-state={state}
      >
        <ul className={isCompactHand(count) ? styles.compactList : styles.list}>
          {areas.map((area, index) => {
            const isActive =
              matchPath({ path: area.to, end: area.isEnd === true }, pathname) !== null;
            const pose = cardPose(index, count, isActive, state);
            return (
              <m.li
                key={area.to}
                className={isActive ? styles.activeItem : styles.item}
                style={{ transformOrigin: `50% ${String(CARD_PIVOT)}px` }}
                initial={false}
                animate={pose}
                whileTap={{ y: isFolded ? pose.y - PRESS_LIFT : pose.y }}
                transition={CARD_SPRING}
                transformTemplate={cardTransform}
              >
                <NavLink
                  to={area.to}
                  end={area.isEnd === true}
                  className={cardClass}
                  draggable={false}
                  onPointerDown={startPress}
                  onPointerUp={cancelPress}
                  onPointerLeave={cancelPress}
                  onPointerCancel={cancelPress}
                  onClick={handleClick}
                  onContextMenu={preventMenu}
                >
                  <m.span
                    className={styles.face}
                    initial={false}
                    animate={{ opacity: isFolded ? 0 : 1 }}
                    transition={FADE}
                  >
                    {area.icon({ size: ICON_SIZE })}
                    {t(area.label)}
                  </m.span>
                  <m.span
                    className={styles.foldedIcon}
                    style={{ top: foldedIconTop(index, count, isActive, FOLDED_ICON_SIZE) }}
                    initial={false}
                    animate={{ opacity: isFolded ? 1 : 0 }}
                    transition={FADE}
                    aria-hidden="true"
                  >
                    {area.icon({ size: FOLDED_ICON_SIZE })}
                  </m.span>
                </NavLink>
              </m.li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
