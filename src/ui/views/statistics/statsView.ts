import {
  parseGameId,
  parseLocalDate,
  type CustomGame,
  type GameId,
  type LocalDate,
  type PersonId,
} from '@/core/model';
import {
  ALL_TIME,
  criterionValue,
  type GroupStatistics,
  type MatchRun,
  type PersonStatistics,
  type RankingCriterion,
  type StatsGame,
  type StatsPeriod,
  type StatsRequest,
} from '@/core/stats';
import { CATAN_GAME_ID } from '@/games/catan';
import { gameCapabilities } from '@/games/registry';
import { t } from '@/i18n/t';
import { shortDate } from '@/ui/views/games/dates';

/**
 * What the statistics need to know of every game (Architecture 5.1): its scoring, whether it has
 * a duration and whether its best score is a record (custom games with points, FA-ST-08).
 */
export function statsGameOf(customGames: readonly CustomGame[]): (gameId: GameId) => StatsGame {
  return (gameId) => {
    const custom = customGames.find((game) => game.id === gameId);
    const capabilities = gameCapabilities(gameId, custom);
    return {
      scoring: capabilities.scoring,
      tracksDuration: capabilities.tracksDuration,
      recordsBestScore: !capabilities.isSupported && capabilities.scoring !== null,
    };
  };
}

/**
 * The filter and the criterion of the statistics as they stand in the address (design I3-D), so
 * the back key from a record returns to the same view: `spiel`, `version`, `zeitraum`, `nach`.
 */
export type StatsParams = {
  readonly request: StatsRequest;
  readonly criterion: RankingCriterion;
};

const CRITERIA: readonly (readonly [RankingCriterion, string])[] = [
  ['wins', 'siege'],
  ['average-place', 'platz'],
  ['average-score', 'punkte'],
  ['longest-streak', 'serie'],
];

const RANGE = /^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/u;

function periodOf(value: string | null): StatsPeriod {
  if (value === '3m') {
    return { kind: 'last-months', months: 3 };
  }
  if (value === '12m') {
    return { kind: 'last-months', months: 12 };
  }
  if (value !== null && /^\d{4}$/u.test(value)) {
    return { kind: 'year', year: Number(value) };
  }
  const range = value === null ? null : RANGE.exec(value);
  const from = parseLocalDate(range?.[1] ?? '');
  const to = parseLocalDate(range?.[2] ?? '');
  return from.ok && to.ok ? { kind: 'range', from: from.value, to: to.value } : ALL_TIME;
}

/**
 * The period as it stands in the address: absent for all matches.
 */
export function periodParam(period: StatsPeriod): string | null {
  switch (period.kind) {
    case 'all':
      return null;
    case 'year':
      return String(period.year);
    case 'last-months':
      return `${String(period.months)}m`;
    case 'range':
      return `${period.from}_${period.to}`;
  }
}

/**
 * Reads the filter from the address; anything unknown means "all" or wins (US-ST-02 AK-1).
 */
export function readStatsParams(params: URLSearchParams): StatsParams {
  const game = parseGameId(params.get('spiel') ?? '');
  const criterion = CRITERIA.find(([, key]) => key === params.get('nach'))?.[0] ?? 'wins';
  return {
    request: {
      gameId: game.ok ? game.value : null,
      edition: params.get('version'),
      period: periodOf(params.get('zeitraum')),
    },
    criterion,
  };
}

/**
 * The address parameters for a changed filter; everything else in the address stays.
 */
export function writeStatsParams(
  current: URLSearchParams,
  change: Partial<{
    gameId: GameId | null;
    edition: string | null;
    period: StatsPeriod;
    criterion: RankingCriterion;
  }>,
): URLSearchParams {
  const next = new URLSearchParams(current);
  const set = (key: string, value: string | null): void => {
    if (value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  };
  if (change.gameId !== undefined) {
    set('spiel', change.gameId);
    // Another game starts with all of its editions.
    next.delete('version');
  }
  if (change.edition !== undefined) {
    set('version', change.edition);
  }
  if (change.period !== undefined) {
    set('zeitraum', periodParam(change.period));
  }
  if (change.criterion !== undefined) {
    set(
      'nach',
      change.criterion === 'wins'
        ? null
        : (CRITERIA.find(([c]) => c === change.criterion)?.[1] ?? null),
    );
  }
  return next;
}

/**
 * The name of the period, e.g. "Gesamt", "2026", "Letzte 3 Monate" or "01.03. – 31.03.2026".
 */
export function periodLabel(period: StatsPeriod): string {
  switch (period.kind) {
    case 'all':
      return t('statistik.gesamt');
    case 'year':
      return String(period.year);
    case 'last-months':
      return period.months === 3 ? t('statistik.letzte3') : t('statistik.letzte12');
    case 'range':
      return spanText(period.from, period.to);
  }
}

/**
 * Two days as a span, the year once if both lie in the same one; one day alone.
 */
export function spanText(from: LocalDate, to: LocalDate): string {
  if (from === to) {
    return fullDate(from);
  }
  const isSameYear = from.slice(0, 4) === to.slice(0, 4);
  return t('statistik.spanne', {
    von: isSameYear ? shortDate(from, from) : fullDate(from),
    bis: fullDate(to),
  });
}

/**
 * A day as "17.11.2026".
 */
export function fullDate(date: LocalDate): string {
  const [year, month, day] = date.split('-');
  return `${String(day)}.${String(month)}.${String(year)}`;
}

/**
 * The span of a run (Specification 3.8): "seit …" while it still runs, else first to last day.
 */
export function runText(run: MatchRun): string {
  return run.isOngoing
    ? t('statistik.seitDatum', { datum: fullDate(run.firstDate) })
    : spanText(run.firstDate, run.lastDate);
}

const DECIMAL = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * An average with one decimal, e.g. "2,0" or "8,4"; "–" without a value (US-ST-01 AK-3).
 */
export function averageText(value: number | null): string {
  return value === null ? t('statistik.keinWert') : DECIMAL.format(value);
}

/**
 * A rate from 0 to 1 as whole percent, e.g. "32 %".
 */
export function percentText(rate: number): string {
  return t('statistik.prozent', { wert: Math.round(rate * 100) });
}

/**
 * "1 Partie" or "12 Partien".
 */
export function matchCountText(count: number): string {
  return count === 1 ? t('statistik.partie') : t('statistik.partien', { anzahl: count });
}

/**
 * "1 Sieg" or "19 Siege".
 */
export function winsText(count: number): string {
  return count === 1 ? t('statistik.siegAnzahl') : t('statistik.siegeAnzahl', { anzahl: count });
}

/**
 * The name of an edition of Catan.
 */
export function editionText(edition: string): string {
  return edition === 'base' ? t('partie.basisspiel') : t('partie.staedteUndRitter');
}

/**
 * The name of a criterion; average points of Catan are victory points.
 */
export function criterionText(criterion: RankingCriterion, gameId: GameId | null): string {
  switch (criterion) {
    case 'wins':
      return t('statistik.kriterien.siege');
    case 'average-place':
      return t('statistik.kriterien.platz');
    case 'average-score':
      return gameId === CATAN_GAME_ID
        ? t('statistik.kriterien.siegpunkte')
        : t('statistik.kriterien.punkte');
    case 'longest-streak':
      return t('statistik.kriterien.laengsteSerie');
  }
}

/**
 * The value of a person in the criterion as text with its unit below (design I3-D).
 */
export type Metric = {
  readonly value: number | null;
  readonly text: string;
  readonly unit: string;
  readonly isDecimal: boolean;
};

/**
 * The unit under a streak (E-57): nothing for 0, "Sieg" for 1, "Siege in Folge" from 2.
 */
export function runUnit(length: number): string {
  if (length === 0) {
    return '';
  }
  return length === 1 ? t('statistik.einheit.sieg') : t('statistik.einheit.inFolge');
}

/**
 * The value of a person in a criterion with its unit (design I3-D).
 */
export function metricOf(
  person: PersonStatistics,
  criterion: RankingCriterion,
  gameId: GameId | null,
): Metric {
  const value = criterionValue(person, criterion);
  switch (criterion) {
    case 'wins':
      return {
        value,
        text: String(person.wins),
        unit: person.wins === 1 ? t('statistik.einheit.sieg') : t('statistik.einheit.siege'),
        isDecimal: false,
      };
    case 'longest-streak': {
      const length = person.longestStreak?.length ?? 0;
      return { value, text: String(length), unit: runUnit(length), isDecimal: false };
    }
    case 'average-place':
    case 'average-score':
      return {
        value,
        text: averageText(value),
        unit: criterionText(criterion, gameId),
        isDecimal: true,
      };
  }
}

/**
 * The share of a person's value of the best value, from 0 to 1, for the bars of the ranking:
 * places and "fewest points win" count the other way round (design I3-D).
 */
export function shareOf(
  stats: GroupStatistics,
  person: PersonStatistics,
  criterion: RankingCriterion,
): number {
  const value = criterionValue(person, criterion);
  if (value === null) {
    return 0;
  }
  const size = stats.persons.length;
  if (criterion === 'average-place') {
    return size > 1 ? (size - value) / (size - 1) : 1;
  }
  const values = stats.persons.flatMap((other) => {
    const v = criterionValue(other, criterion);
    return v === null ? [] : [v];
  });
  const high = Math.max(...values);
  const low = Math.min(...values);
  if (criterion === 'average-score') {
    if (high === low) {
      return 1;
    }
    const position = (value - low) / (high - low);
    // A visible bar also for the weakest value.
    return 0.15 + 0.85 * (stats.scoring === 'lowest-wins' ? 1 - position : position);
  }
  return high > 0 ? value / high : 0;
}

/**
 * The first letter of a name for a coin.
 */
export function initialOf(name: string): string {
  return name.charAt(0);
}

/**
 * A lookup of names by person.
 */
export function namesOf(
  persons: readonly { readonly id: PersonId; readonly name: string }[],
): (personId: PersonId) => string {
  return (personId) => persons.find((person) => person.id === personId)?.name ?? '';
}
