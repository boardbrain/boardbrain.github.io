import { animate, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { sortByName, type GameId } from '@/core/model';
import type { PlayedGame } from '@/core/results';
import { t } from '@/i18n/t';
import { SortAzIcon, SortRecentIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { Swap } from '@/ui/components/Swap';
import styles from './GameCards.module.css';

const SORT_ICON_SIZE = 22;
const ICON_FROM = { opacity: 0, scale: 0.6 };
// Sorted anew, every card glides from its old place to the new one (PO 21.11.: no blinking).
const GLIDE = { duration: 0.35, ease: 'easeInOut' } as const;

/** The labels of the search of a game list (design I3-B). */
export const GAME_SEARCH_LABELS = {
  open: t('spiele.suchen'),
  field: t('spiele.suchfeld'),
  close: t('spiele.suchfeldSchliessen'),
};

/** The order of a game list: the last played first or A–Z (SO3). */
export type GameOrder = 'recent' | 'name';

// The order chosen last comes back (Product Owner 20.11.2026), in every game list: the list of
// all games and the choice of the score pad. A choice of this view on this device, not data: it
// lives in the browser's storage, not in the database or a backup (Architecture 13.2).
const ORDER_KEY = 'boardbrain.gameListOrder';

function readOrder(): GameOrder {
  try {
    return localStorage.getItem(ORDER_KEY) === 'name' ? 'name' : 'recent';
  } catch {
    // Storage blocked, e.g. in a private window: the list starts with the last played.
    return 'recent';
  }
}

// `false` when the storage is blocked: the order then holds until the page is left.
function storeOrder(order: GameOrder): boolean {
  try {
    localStorage.setItem(ORDER_KEY, order);
    return true;
  } catch {
    return false;
  }
}

/**
 * SO3: the last played first, never played games after them; the same day and never played
 * games by name. "A–Z" by name only.
 */
export function sortGames<T extends { readonly id: GameId; readonly name: string }>(
  games: readonly T[],
  played: ReadonlyMap<GameId, PlayedGame>,
  order: GameOrder,
): T[] {
  const byName = sortByName(games);
  if (order === 'name') {
    return byName;
  }
  const last = (game: T): string => played.get(game.id)?.lastDate ?? '';
  return byName.toSorted((a, b) => (last(a) === last(b) ? 0 : last(a) < last(b) ? 1 : -1));
}

/**
 * The order of the game lists, remembered on this device, with the words for the subtitle and
 * the button.
 */
export function useGameOrder(): {
  readonly order: GameOrder;
  readonly orderWord: string;
  readonly otherWord: string;
  readonly toggle: () => void;
} {
  const [order, setOrder] = useState<GameOrder>(readOrder);
  const recent = t('spielliste.zuletztGespielt');
  const byName = t('spielliste.alphabetisch');
  return {
    order,
    orderWord: order === 'recent' ? recent : byName,
    otherWord: order === 'recent' ? byName : recent,
    toggle: () => {
      const next = order === 'recent' ? 'name' : 'recent';
      setOrder(next);
      storeOrder(next);
    },
  };
}

/**
 * Motion (external system): when the order changes, each card of the list glides from the place
 * it had; that place is where the card at its old position stands now. Searching moves nothing.
 */
export function useSortGlide(
  listRef: RefObject<HTMLUListElement | null>,
  order: GameOrder,
  shownIds: string,
): void {
  const isReduced = useReducedMotion() === true;
  const shown = useRef({ order, ids: shownIds });
  useLayoutEffect(() => {
    const before = shown.current;
    shown.current = { order, ids: shownIds };
    const list = listRef.current;
    if (before.order === order || list === null || isReduced) {
      return;
    }
    const was = before.ids.split(' ');
    const cards = [...list.children].filter((card) => card instanceof HTMLElement);
    const ids = shownIds.split(' ');
    cards.forEach((card, index) => {
      const from = cards[was.indexOf(ids[index] ?? '')];
      if (from !== undefined && from !== card) {
        void animate(
          card,
          { x: [from.offsetLeft - card.offsetLeft, 0], y: [from.offsetTop - card.offsetTop, 0] },
          GLIDE,
        );
      }
    });
  }, [listRef, order, shownIds, isReduced]);
}

/** The button that changes the order of a game list; its symbol turns with it. */
export function SortButton({
  order,
  orderWord,
  otherWord,
  className,
  onToggle,
}: {
  readonly order: GameOrder;
  readonly orderWord: string;
  readonly otherWord: string;
  readonly className: string | undefined;
  readonly onToggle: () => void;
}): React.JSX.Element {
  return (
    <PressableButton
      type="button"
      className={className}
      aria-label={t('spielliste.sortieren', { jetzt: orderWord, dann: otherWord })}
      onClick={onToggle}
    >
      <Swap swapKey={order} from={ICON_FROM} className={styles.sortIcon}>
        {order === 'recent' ? (
          <SortRecentIcon size={SORT_ICON_SIZE} />
        ) : (
          <SortAzIcon size={SORT_ICON_SIZE} />
        )}
      </Swap>
    </PressableButton>
  );
}
