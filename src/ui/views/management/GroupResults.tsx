import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useEffectEvent, useRef } from 'react';
import type { CustomGame, GameId, Group, Match, MatchId, Person } from '@/core/model';
import { CATAN_GAME_ID } from '@/games/catan';
import { t } from '@/i18n/t';
import { useMatchesOfGroup } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { ChevronIcon, TrophyIcon } from '@/ui/components/Icons';
import { PressableLink } from '@/ui/components/Pressable';
import { GameSymbol } from '@/ui/views/games/GameSymbol';
import { localToday } from '@/ui/views/games/dates';
import { dayHeading, daysNewestFirst, winnerText } from './resultList';
import overview from './Overview.module.css';
import styles from './GroupResults.module.css';

const CHEVRON_SIZE = 18;
const BADGE_SIZE = 12;
const MAX_COINS = 3;
// HL1: the new entry lights up golden once and fades (design I3-C, Product Owner 23.11.2026).
const LIGHT_UP = { duration: 2.2, times: [0, 0.2, 1], ease: 'easeOut' as const };

/**
 * Address of a result of a table.
 */
export function resultHref(groupId: string, matchId: string): string {
  return `/verwaltung/gruppen/${groupId}/ergebnisse/${matchId}`;
}

/**
 * The name of a game of a result: Catan or a custom game, also an archived one.
 */
export function gameNameOf(gameId: GameId, customGames: readonly CustomGame[]): string {
  if (gameId === CATAN_GAME_ID) {
    return t('spiele.namen.catan');
  }
  return customGames.find((game) => game.id === gameId)?.name ?? '';
}

type GroupResultsProps = {
  readonly group: Group;
  readonly persons: readonly Person[];
  readonly customGames: readonly CustomGame[];
  /** The result just stored, lit up once (design I3-C HL1). */
  readonly highlight: MatchId | null;
  /** Called once the highlight has been shown, so it does not show again. */
  readonly onHighlighted: () => void;
};

/**
 * The results of a table (US-ER-04 AK-1, design I3-C EM3): newest first, a heading per day, each
 * result as a row with the symbol of the game, its name and time and the coins of the winners;
 * a row opens the result (AK-2). The list updates itself on every change (US-ER-05 AK-3).
 */
export function GroupResults({
  group,
  persons,
  customGames,
  highlight,
  onHighlighted,
}: GroupResultsProps): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const matches = useMatchesOfGroup(db, group.id);
  const listRef = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion() === true;
  const isLoaded = matches !== undefined;
  const markShown = useEffectEvent(onHighlighted);

  // Motion and scrolling (external systems): the new entry comes into view and lights up once.
  useEffect(() => {
    const list = listRef.current;
    if (highlight === null || !isLoaded || list === null) {
      return;
    }
    const row = list.querySelector<HTMLElement>(`[data-match="${highlight}"]`);
    if (row === null) {
      return;
    }
    row.scrollIntoView({ block: 'center', behavior: isReduced ? 'auto' : 'smooth' });
    const gold = getComputedStyle(row).getPropertyValue('--color-accent-text').trim();
    if (!isReduced && gold !== '') {
      void animate(row, { backgroundColor: [`${gold}00`, `${gold}33`, `${gold}00`] }, LIGHT_UP);
    }
    markShown();
  }, [highlight, isLoaded, isReduced]);

  if (matches === undefined) {
    return null;
  }
  if (matches.length === 0) {
    return (
      <div className={styles.empty}>
        <strong>{t('ergebnisse.leer')}</strong>
      </div>
    );
  }
  const today = localToday();
  const nameOf = (id: string): string => persons.find((person) => person.id === id)?.name ?? '';
  return (
    <div ref={listRef} className={styles.days}>
      {daysNewestFirst(matches).map((day) => {
        const heading = dayHeading(day.date, today);
        return (
          <section key={day.date} className={styles.day}>
            <h3 className={styles.dayHead}>{heading}</h3>
            <ul className={overview.rows} aria-label={t('ergebnisse.liste', { datum: heading })}>
              {day.matches.map((match) => (
                <li key={match.id}>
                  <ResultRow
                    match={match}
                    group={group}
                    gameName={gameNameOf(match.gameId, customGames)}
                    nameOf={nameOf}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ResultRow({
  match,
  group,
  gameName,
  nameOf,
}: {
  readonly match: Match;
  readonly group: Group;
  readonly gameName: string;
  readonly nameOf: (id: string) => string;
}): React.JSX.Element {
  const winners = match.winnerIds;
  const sieger = winnerText(winners.map(nameOf));
  const label =
    match.time === undefined
      ? t('ergebnisse.zeileOhneZeit', { spiel: gameName, sieger })
      : t('ergebnisse.zeile', { spiel: gameName, zeit: match.time, sieger });
  return (
    <PressableLink
      to={resultHref(group.id, match.id)}
      className={overview.row}
      aria-label={label}
      data-match={match.id}
    >
      <GameSymbol gameId={match.gameId} name={gameName} size={40} />
      <span className={overview.rowText}>
        <strong className={overview.rowTitle}>{gameName}</strong>
        {match.time !== undefined && <span className={overview.rowNote}>{match.time}</span>}
      </span>
      {/* EM3: the coins of the winners in their table colour, a trophy at the last. */}
      <span className={styles.winners} aria-hidden="true">
        {winners.slice(0, MAX_COINS).map((personId) => {
          const color = group.members.find((member) => member.personId === personId)?.groupColor;
          return (
            <span
              key={personId}
              className={styles.coin}
              style={
                color === undefined ? undefined : { background: `var(--color-group-${color})` }
              }
            >
              {nameOf(personId).charAt(0)}
            </span>
          );
        })}
        {winners.length > MAX_COINS && (
          <span className={styles.more}>
            {t('ergebnisse.mehr', { anzahl: winners.length - MAX_COINS })}
          </span>
        )}
        <span className={styles.badge}>
          <TrophyIcon size={BADGE_SIZE} />
        </span>
      </span>
      <span className={overview.chevron}>
        <ChevronIcon size={CHEVRON_SIZE} />
      </span>
    </PressableLink>
  );
}
