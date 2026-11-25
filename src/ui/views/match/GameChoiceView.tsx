import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { findByName, parseGroupId, type CustomGame, type GameId, type Group } from '@/core/model';
import { CATAN_GAME_ID } from '@/games/catan';
import { canGroupPlay } from '@/games/registry';
import { useCustomGames, useGroup, usePlayedGames } from '@/infra/db/readHooks';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { LandscapePicture } from '@/ui/art/Pictures';
import { BackButton } from '@/ui/components/BackButton';
import { cx } from '@/ui/components/classNames';
import { SearchButton, SearchRow } from '@/ui/components/SearchControls';
import { PlusIcon, TrophyIcon } from '@/ui/components/Icons';
import { PressableButton, PressableLink } from '@/ui/components/Pressable';
import { CatanGameCard, CustomGameCard, GameGrid } from '@/ui/views/games/GameCards';
import {
  GAME_SEARCH_LABELS,
  SortButton,
  sortGames,
  useGameOrder,
  useSortGlide,
} from '@/ui/views/games/GameListTools';
import { localToday } from '@/ui/views/games/dates';
import gameStyles from '@/ui/views/games/GameCards.module.css';
import { DevCard } from './DevCard';
import shared from './Match.module.css';
import styles from './GameChoiceView.module.css';

const PLUS_SIZE = 14;
const TROPHY_SIZE = 40;

type ListedGame =
  | { readonly kind: 'catan'; readonly id: GameId; readonly name: string }
  | {
      readonly kind: 'custom';
      readonly id: GameId;
      readonly name: string;
      readonly game: CustomGame;
    };

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
  const { order, orderWord, otherWord, toggle } = useGameOrder();
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
  const shownIds = games.map((listed) => listed.id).join(' ');
  useSortGlide(listRef, order, shownIds);
  const trimmedQuery = query.trim();
  const toggleSearch = (): void => {
    setIsSearchOpen(!isSearchOpen);
    setQuery('');
  };
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
              labels={GAME_SEARCH_LABELS}
              isOpen={isSearchOpen}
              className={shared.iconBtn}
              onToggle={toggleSearch}
            />
          )}
          <SortButton
            order={order}
            orderWord={orderWord}
            otherWord={otherWord}
            className={shared.iconBtn}
            onToggle={toggle}
          />
        </span>
      </div>
      <SearchRow
        isOpen={isSearchOpen}
        labels={GAME_SEARCH_LABELS}
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
