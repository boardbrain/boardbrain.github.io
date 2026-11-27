// Test helpers for the statistics (core/stats, I3-D).
import {
  parseLocalDate,
  parseLocalTime,
  toGameId,
  toGroupId,
  toMatchId,
  toPersonId,
  type GameId,
  type LocalDate,
  type Match,
  type PersonId,
} from '@/core/model';
import type { StatsGame } from '@/core/stats';

export const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
export const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
export const CLARA = toPersonId('00000000-0000-4000-8000-0000000000a3');
export const DAVID = toPersonId('00000000-0000-4000-8000-0000000000a4');
export const TABLE: readonly PersonId[] = [ANNA, BEN, CLARA, DAVID];

/** Catan-like: highest points win, matches have a duration, no best-score record. */
export const CATAN = toGameId('00000000-0000-4000-8000-00000000c001');
/** Skyjo-like: the fewest points win. */
export const SKYJO = toGameId('00000000-0000-4000-8000-00000000c002');
/** Uno-like: no points. */
export const UNO = toGameId('00000000-0000-4000-8000-00000000c003');
/** Carcassonne-like: the most points win. */
export const CARCASSONNE = toGameId('00000000-0000-4000-8000-00000000c004');

const GAMES: ReadonlyMap<GameId, StatsGame> = new Map([
  [CATAN, { scoring: 'highest-wins', tracksDuration: true, recordsBestScore: false }],
  [SKYJO, { scoring: 'lowest-wins', tracksDuration: false, recordsBestScore: true }],
  [UNO, { scoring: null, tracksDuration: false, recordsBestScore: false }],
  [CARCASSONNE, { scoring: 'highest-wins', tracksDuration: false, recordsBestScore: true }],
]);

export function gameOf(gameId: GameId): StatsGame {
  return GAMES.get(gameId) ?? { scoring: null, tracksDuration: false, recordsBestScore: false };
}

export function day(value: string): LocalDate {
  const parsed = parseLocalDate(value);
  if (!parsed.ok) {
    throw new Error(value);
  }
  return parsed.value;
}

let counter = 0;

type MatchFields = {
  readonly game?: GameId;
  readonly date?: string;
  readonly time?: string;
  readonly winners: readonly PersonId[];
  readonly scores?: readonly number[];
  readonly places?: readonly number[];
  readonly edition?: string;
  readonly duration?: number;
};

/**
 * A match of the four persons of `TABLE`; scores and places in seat order.
 */
export function match(fields: MatchFields): Match {
  counter++;
  const number = String(counter).padStart(12, '0');
  const time = fields.time === undefined ? undefined : parseLocalTime(fields.time);
  const perSeat = (values: readonly number[]): Record<PersonId, number> =>
    Object.fromEntries(TABLE.map((personId, seat) => [personId, values[seat] ?? 0]));
  return {
    id: toMatchId(`00000000-0000-4000-8000-${number}`),
    groupId: toGroupId('00000000-0000-4000-8000-0000000000b1'),
    gameId: fields.game ?? UNO,
    date: day(fields.date ?? '2026-01-01'),
    ...(time?.ok === true ? { time: time.value } : {}),
    recordedAt: `2026-01-01T00:00:00.${String(counter % 1000).padStart(3, '0')}Z`,
    ...(fields.edition === undefined ? {} : { edition: fields.edition }),
    winnerIds: fields.winners,
    ...(fields.scores === undefined ? {} : { scores: perSeat(fields.scores) }),
    ...(fields.places === undefined ? {} : { places: perSeat(fields.places) }),
    ...(fields.duration === undefined ? {} : { durationMinutes: fields.duration }),
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/**
 * Matches one day apart from 2026-01-01, in this order.
 */
export function series(list: readonly Omit<MatchFields, 'date'>[]): Match[] {
  return list.map((fields, index) =>
    match({ ...fields, date: new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10) }),
  );
}
