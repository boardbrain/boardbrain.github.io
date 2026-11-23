import { animate, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  findByName,
  parseGroupId,
  sortByName,
  type CustomGame,
  type GameId,
  type Group,
} from '@/core/model';
import type { PlayedGame } from '@/core/results';
import { CATAN_GAME_ID } from '@/games/catan';
import { canGroupPlay } from '@/games/registry';
import { useCustomGames, useGroup, usePlayedGames } from '@/infra/db/readHooks';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { LandscapePicture } from '@/ui/art/Pictures';
import { BackButton } from '@/ui/components/BackButton';
import { cx } from '@/ui/components/classNames';
import { SearchButton, SearchRow } from '@/ui/components/SearchControls';
import { PlusIcon, SortAzIcon, SortRecentIcon, TrophyIcon } from '@/ui/components/Icons';
import { PressableButton, PressableLink } from '@/ui/components/Pressable';
import { Swap } from '@/ui/components/Swap';
import { CatanGameCard, CustomGameCard, GameGrid } from '@/ui/views/games/GameCards';
import { localToday } from '@/ui/views/games/dates';
import gameStyles from '@/ui/views/games/GameCards.module.css';
import { DevCard } from './DevCard';
import shared from './Match.module.css';
import styles from './GameChoiceView.module.css';

const SORT_ICON_SIZE = 22;
const ICON_FROM = { opacity: 0, scale: 0.6 };
// Sorted anew, every card glides from its old place to the new one (PO 21.11.: no blinking).
const GLIDE = { duration: 0.35, ease: 'easeInOut' } as const;
const SEARCH_LABELS = {
  open: t('spiele.suchen'),
  field: t('spiele.suchfeld'),
  close: t('spiele.suchfeldSchliessen'),
};
const PLUS_SIZE = 14;
const TROPHY_SIZE = 40;

type Order = 'recent' | 'name';

// The order chosen last comes back (Product Owner 20.11.2026). A choice of this view on this
// device, not data: it lives in the browser's storage, not in the database or a backup
// (Architecture 13.2).
const ORDER_KEY = 'boardbrain.gameListOrder';

function readOrder(): Order {
  try {
    return localStorage.getItem(ORDER_KEY) === 'name' ? 'name' : 'recent';
  } catch {
    // Storage blocked, e.g. in a private window: the list starts with the last played.
    return 'recent';
  }
}

// `false` when the storage is blocked: the order then holds until the page is left.
function storeOrder(order: Order): boolean {
  try {
    localStorage.setItem(ORDER_KEY, order);
    return true;
  } catch {
    return false;
  }
}

type ListedGame =
  | { readonly kind: 'catan'; readonly id: GameId; readonly name: string }
  | {
      readonly kind: 'custom';
      readonly id: GameId;
      readonly name: string;
      readonly game: CustomGame;
    };

// SO3: the last played first, never played games after them; the same day and never played
// games by name. "A–Z" by name only.
function sortGames(
  games: readonly ListedGame[],
  played: ReadonlyMap<GameId, PlayedGame>,
  order: Order,
): ListedGame[] {
  const byName = sortByName(games);
  if (order === 'name') {
    return byName;
  }
  const last = (game: ListedGame): string => played.get(game.id)?.lastDate ?? '';
  return byName.toSorted((a, b) => (last(a) === last(b) ? 0 : last(a) < last(b) ? 1 : -1));
}

// Entered from a table (design I3-C SW4): the form returns to the table afterwards.
function formHref(gameId: GameId, group: Group): string {
  return `/ergebnis/neu/${gameId}/${group.id}?von=tisch`;
}

/**
 * The game list `#/partie/neu` (US-SP-01, US-SP-03, design I3-B): every active game as a card in
 * one grid, sorted by the last match or A–Z. A custom game opens the result (AK-2); Catan asks
 * "Neue Partie" or "Ergebnis eintragen" with two fanned cards over the dimmed list (Q5).
 *
 * From a table `#/verwaltung/gruppen/‹tisch›/ergebnis` (US-ER-01 AK-1, AK-5, design I3-C): the
 * table is fixed, the list shows only the games it can play and every card opens the result,
 * Catan too, without the question; with only one such game the form opens at once.
 */
export function GameChoiceView(): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const { groupId } = useParams();
  const parsedGroup = groupId === undefined ? null : parseGroupId(groupId);
  const table = useGroup(db, parsedGroup?.ok === true ? parsedGroup.value : null);
  const customGames = useCustomGames(db);
  const played = usePlayedGames(db);
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order>(readOrder);
  const [isAsking, setIsAsking] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const today = localToday();
  const active = (customGames ?? []).filter((game) => !game.archived);
  const fixed = table ?? null;
  const all: ListedGame[] = [
    { kind: 'catan', id: CATAN_GAME_ID, name: t('spiele.namen.catan') },
    ...active.map((game) => ({ kind: 'custom' as const, id: game.id, name: game.name, game })),
  ];
  const sorted = sortGames(
    fixed === null ? all : all.filter((listed) => canGroupPlay(fixed, listed.id)),
    played ?? new Map(),
    order,
  );
  const games = findByName(sorted, query);
  const listRef = useRef<HTMLUListElement>(null);
  const isReduced = useReducedMotion() === true;
  const shownIds = games.map((listed) => listed.id).join(' ');
  const shown = useRef({ order, ids: shownIds });

  // Motion (external system): when the order changes, each card glides from the place it had;
  // that place is where the card at its old position stands now. Searching moves nothing.
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
  }, [order, shownIds, isReduced]);
  const trimmedQuery = query.trim();
  const toggleSearch = (): void => {
    setIsSearchOpen(!isSearchOpen);
    setQuery('');
  };
  const orderWord =
    order === 'recent' ? t('spielliste.zuletztGespielt') : t('spielliste.alphabetisch');
  const otherWord =
    order === 'recent' ? t('spielliste.alphabetisch') : t('spielliste.zuletztGespielt');
  if (groupId !== undefined) {
    if (parsedGroup?.ok !== true || table === null || table?.archived === true) {
      return <Navigate to="/verwaltung/gruppen" replace />;
    }
    if (table === undefined || customGames === undefined) {
      return null;
    }
    const [only] = sorted;
    if (sorted.length === 1 && only !== undefined) {
      return <Navigate to={formHref(only.id, table)} replace />;
    }
  }
  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton
          fallback={fixed === null ? '/' : `/verwaltung/gruppen/${fixed.id}?reiter=ergebnisse`}
        />
        <div className={shared.titles}>
          <h1 className={shared.title}>
            {fixed === null ? t('spielliste.titel') : t('ergebnisse.eintragen')}
          </h1>
          <div className={shared.sub}>
            {fixed === null
              ? orderWord
              : t('ergebnisse.spielwahl', { tisch: fixed.name, sortierung: orderWord })}
          </div>
        </div>
        <span className={gameStyles.headActions}>
          {/* A table plays few games: no search there, so the title keeps one line (I3-C). */}
          {fixed === null && (
            <SearchButton
              labels={SEARCH_LABELS}
              isOpen={isSearchOpen}
              className={shared.iconBtn}
              onToggle={toggleSearch}
            />
          )}
          <PressableButton
            type="button"
            className={shared.iconBtn}
            aria-label={t('spielliste.sortieren', { jetzt: orderWord, dann: otherWord })}
            onClick={() => {
              const next = order === 'recent' ? 'name' : 'recent';
              setOrder(next);
              storeOrder(next);
            }}
          >
            <Swap swapKey={order} from={ICON_FROM} className={styles.sortIcon}>
              {order === 'recent' ? (
                <SortRecentIcon size={SORT_ICON_SIZE} />
              ) : (
                <SortAzIcon size={SORT_ICON_SIZE} />
              )}
            </Swap>
          </PressableButton>
        </span>
      </div>
      <SearchRow
        isOpen={isSearchOpen}
        labels={SEARCH_LABELS}
        query={query}
        closeClassName={shared.iconBtn}
        onQuery={setQuery}
        onClose={toggleSearch}
      />
      {trimmedQuery !== '' && games.length === 0 && (
        <p className={cx(shared.muted, shared.small)}>
          {t('spiele.keinTreffer', { suche: trimmedQuery })}
        </p>
      )}
      {customGames !== undefined && played !== undefined && (
        <>
          <GameGrid
            listRef={listRef}
            label={t('spiele.karten')}
            hint={active.length === 0 ? undefined : t('spielliste.hinweis')}
          >
            {games.map((listed) =>
              listed.kind === 'catan' ? (
                <CatanGameCard
                  key={listed.id}
                  played={played.get(listed.id)}
                  today={today}
                  target={
                    fixed === null
                      ? {
                          onPress: () => {
                            setIsAsking(true);
                          },
                        }
                      : { to: formHref(listed.id, fixed) }
                  }
                />
              ) : (
                <CustomGameCard
                  key={listed.id}
                  game={listed.game}
                  played={played.get(listed.id)}
                  today={today}
                  target={{
                    to: fixed === null ? `/ergebnis/neu/${listed.id}` : formHref(listed.id, fixed),
                  }}
                />
              ),
            )}
          </GameGrid>
          {active.length === 0 && (
            // LZ2: what is missing and the way to it.
            <div className={styles.empty}>
              <p className={cx(shared.muted, shared.small)}>{t('spielliste.leer')}</p>
              <PressableLink to="/verwaltung/spiele/neu" className={shared.pill}>
                <PlusIcon size={PLUS_SIZE} />
                {t('spiele.neuesSpiel')}
              </PressableLink>
            </div>
          )}
        </>
      )}
      {isAsking && (
        <CatanQuestion
          onNewMatch={() => {
            void navigate('/partie/neu/tisch');
          }}
          onResult={() => {
            void navigate(`/ergebnis/neu/${CATAN_GAME_ID}`);
          }}
          onClose={() => {
            setIsAsking(false);
          }}
        />
      )}
    </main>
  );
}

/**
 * Q5: two fanned cards over the dimmed list, "Neue Partie" in front as the main way (US-SP-01
 * AK-2); a tap beside them or Escape closes.
 */
function CatanQuestion({
  onNewMatch,
  onResult,
  onClose,
}: {
  readonly onNewMatch: () => void;
  readonly onResult: () => void;
  readonly onClose: () => void;
}): React.JSX.Element {
  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={t('spielliste.catanFrage')}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <div className={styles.fan}>
        <PressableButton
          type="button"
          look="card"
          className={styles.left}
          aria-label={t('spielliste.neuePartie')}
          autoFocus
          onClick={onNewMatch}
        >
          <DevCard title={t('spielliste.neuePartie')} art={<LandscapePicture />} isScaled>
            <strong>{t('spielliste.catanNeuText')}</strong>
            <span>{t('spielliste.catanNeuDetails')}</span>
          </DevCard>
        </PressableButton>
        <PressableButton type="button" look="card" className={styles.right} onClick={onResult}>
          <span className={styles.askIcon}>
            <TrophyIcon size={TROPHY_SIZE} />
          </span>
          <strong className={styles.askLabel}>{t('spielliste.ergebnisEintragen')}</strong>
        </PressableButton>
      </div>
    </div>
  );
}
