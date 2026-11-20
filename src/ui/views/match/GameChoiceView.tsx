import { useState } from 'react';
import { useNavigate } from 'react-router';
import { sortByName, type CustomGame, type GameId } from '@/core/model';
import type { PlayedGame } from '@/core/results';
import { CATAN_GAME_ID } from '@/games/catan';
import { useCustomGames, usePlayedGames } from '@/infra/db/readHooks';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { LandscapePicture } from '@/ui/art/Pictures';
import { BackButton } from '@/ui/components/BackButton';
import { PlusIcon, SortAzIcon, SortRecentIcon, TrophyIcon } from '@/ui/components/Icons';
import { PressableButton, PressableLink } from '@/ui/components/Pressable';
import { CatanGameCard, CustomGameCard, GameGrid } from '@/ui/views/games/GameCards';
import { localToday } from '@/ui/views/games/dates';
import { DevCard } from './DevCard';
import shared from './Match.module.css';
import styles from './GameChoiceView.module.css';

const SORT_ICON_SIZE = 22;
const PLUS_SIZE = 14;
const TROPHY_SIZE = 40;

type Order = 'recent' | 'name';

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

/**
 * The game list `#/partie/neu` (US-SP-01, US-SP-03, design I3-B): every active game as a card in
 * one grid, sorted by the last match or A–Z. A custom game opens the result (AK-2); Catan asks
 * "Neue Partie" or "Ergebnis eintragen" with two fanned cards over the dimmed list (Q5).
 */
export function GameChoiceView(): React.JSX.Element {
  const { db } = useAppDependencies();
  const customGames = useCustomGames(db);
  const played = usePlayedGames(db);
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order>('recent');
  const [isAsking, setIsAsking] = useState(false);
  const today = localToday();
  const active = (customGames ?? []).filter((game) => !game.archived);
  const games = sortGames(
    [
      { kind: 'catan', id: CATAN_GAME_ID, name: t('spiele.namen.catan') },
      ...active.map((game) => ({ kind: 'custom' as const, id: game.id, name: game.name, game })),
    ],
    played ?? new Map(),
    order,
  );
  const orderWord =
    order === 'recent' ? t('spielliste.zuletztGespielt') : t('spielliste.alphabetisch');
  const otherWord =
    order === 'recent' ? t('spielliste.alphabetisch') : t('spielliste.zuletztGespielt');
  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton fallback="/" />
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('spielliste.titel')}</h1>
          <div className={shared.sub}>{t('spielliste.unterzeile', { sortierung: orderWord })}</div>
        </div>
        <PressableButton
          type="button"
          className={shared.iconBtn}
          aria-label={t('spielliste.sortieren', { jetzt: orderWord, dann: otherWord })}
          onClick={() => {
            setOrder(order === 'recent' ? 'name' : 'recent');
          }}
        >
          {order === 'recent' ? (
            <SortRecentIcon size={SORT_ICON_SIZE} />
          ) : (
            <SortAzIcon size={SORT_ICON_SIZE} />
          )}
        </PressableButton>
      </div>
      {customGames !== undefined && played !== undefined && (
        <>
          <GameGrid label={t('spiele.karten')}>
            {games.map((listed) =>
              listed.kind === 'catan' ? (
                <CatanGameCard
                  key={listed.id}
                  played={played.get(listed.id)}
                  today={today}
                  target={{
                    onPress: () => {
                      setIsAsking(true);
                    },
                  }}
                />
              ) : (
                <CustomGameCard
                  key={listed.id}
                  game={listed.game}
                  played={played.get(listed.id)}
                  today={today}
                  target={{ to: `/ergebnis/neu/${listed.id}` }}
                />
              ),
            )}
          </GameGrid>
          {active.length === 0 ? (
            // LZ2: what is missing and the way to it.
            <div className={styles.empty}>
              <p className={shared.muted}>{t('spielliste.leer')}</p>
              <PressableLink to="/verwaltung/spiele/neu" className={shared.pill}>
                <PlusIcon size={PLUS_SIZE} />
                {t('spiele.neuesSpiel')}
              </PressableLink>
            </div>
          ) : (
            <p className={styles.hint}>{t('spielliste.hinweis')}</p>
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
