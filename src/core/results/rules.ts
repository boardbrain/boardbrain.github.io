import {
  parseLocalDate,
  parseLocalTime,
  type CatanColorKey,
  type LocalTime,
  type Match,
  type PersonId,
  type ScoringDirection,
} from '@/core/model';
import { assert, err, ok, type Result } from '@/core/shared';

/**
 * What a game allows in a result (FA-SP-05, FA-SP-07, FA-ER-03, FA-ER-07, FA-ER-10, FA-ER-12).
 * The game module or the custom game provides it, so the rules know no game (ADR-028).
 */
export type ResultRules = {
  /** Keys of the editions; one is required if there are any (FA-ER-03). */
  readonly editions: readonly string[];
  /** Keys of the modes, the first is the default; optional (FA-ER-03, US-ER-01 AK-6). */
  readonly modes: readonly string[];
  /** Exactly one winner, no draw (FA-ER-07, E-42). */
  readonly hasSingleWinner: boolean;
  /** Whether points can be recorded and which score wins, or `null` (FA-SP-05, FA-SP-07). */
  readonly scoring: ScoringDirection | null;
  /** Points may be below 0: in custom games, not in Catan (FA-ER-06). */
  readonly allowsNegativeScores: boolean;
  /** A ranking can be entered by hand when no points are recorded (FA-ER-12). */
  readonly supportsRanking: boolean;
  /** Player colours of the game, or `null` (FA-ER-09). */
  readonly playerColors: readonly CatanColorKey[] | null;
  /** The duration can be recorded (FA-ER-10). */
  readonly tracksDuration: boolean;
};

/**
 * A result as entered in the form (Specification 3.6). Group and game are not part of it: they
 * are chosen before and determine the participants and the rules.
 */
export type ResultInput = {
  /** `YYYY-MM-DD` */
  readonly date: string;
  /** `HH:mm`; missing if no time was entered. */
  readonly time?: string;
  readonly edition?: string;
  /** Missing means the default mode of the game (US-ER-01 AK-6). */
  readonly mode?: string;
  /** With a ranking by hand the persons on place 1 (FA-ER-12, US-ER-06 AK-3). */
  readonly winnerIds: readonly PersonId[];
  /** Entered points; persons without an entry are missing (FA-ER-06). */
  readonly scores?: Readonly<Record<PersonId, number>>;
  /** Places entered by hand; persons without an entry are missing (FA-ER-12). */
  readonly places?: Readonly<Record<PersonId, number>>;
  readonly catanColors?: Readonly<Record<PersonId, CatanColorKey>>;
  readonly durationMinutes?: number;
  readonly notes?: string;
};

/**
 * What a result stores besides its id, group, game and timestamps.
 */
export type ResultContent = Omit<Match, 'id' | 'groupId' | 'gameId' | 'recordedAt' | 'updatedAt'>;

/**
 * Expected errors of a result, in the order of the form (Specification 3.6): a date that is no
 * calendar day, a time that is no time of day, a missing edition (US-ER-01 AK-2), no winner,
 * more than one winner where only one is allowed (AK-4), points for only some participants
 * (US-ER-02 AK-2) or not whole numbers in the allowed range (AK-3), places for only some
 * participants or places that form no ranking (US-ER-06 AK-2), a duration that is not whole
 * minutes from 1 (US-ER-01 AK-7).
 */
export type ResultError =
  | 'date-invalid'
  | 'time-invalid'
  | 'edition-missing'
  | 'winner-missing'
  | 'winner-not-single'
  | 'scores-incomplete'
  | 'scores-invalid'
  | 'places-incomplete'
  | 'places-invalid'
  | 'duration-invalid';

function entered(
  values: Readonly<Record<PersonId, number>> | undefined,
  participants: readonly PersonId[],
): readonly number[] {
  if (values === undefined) {
    return [];
  }
  return participants.flatMap((personId) => {
    const value = values[personId];
    return value === undefined ? [] : [value];
  });
}

// FA-ER-12: places form a ranking in which the same place is shared and the following places are
// skipped (1, 2, 2, 4): the place of each person is one more than the number of persons ahead.
function isRanking(places: readonly number[]): boolean {
  return places.every((place) => place === 1 + places.filter((other) => other < place).length);
}

// Inputs the form cannot produce are programming errors (ADR-025): a field the game does not
// have, a winner who did not take part, an unknown edition, mode or colour, points and places
// together, winners other than the persons on place 1.
function assertFitsGame(
  input: ResultInput,
  participants: readonly PersonId[],
  rules: ResultRules,
): void {
  const takesPart = (key: string): boolean => participants.some((personId) => personId === key);
  assert(input.winnerIds.every(takesPart), 'every winner takes part');
  assert(new Set(input.winnerIds).size === input.winnerIds.length, 'no winner twice');
  assert(
    input.edition === undefined || rules.editions.includes(input.edition),
    `the game has the edition ${String(input.edition)}`,
  );
  assert(
    input.mode === undefined || rules.modes.includes(input.mode),
    `the game has the mode ${String(input.mode)}`,
  );
  if (input.scores !== undefined) {
    assert(rules.scoring !== null, 'the game counts points');
    assert(Object.keys(input.scores).every(takesPart), 'points only for participants');
  }
  if (input.places !== undefined) {
    assert(rules.supportsRanking, 'the game has a ranking by hand');
    assert(Object.keys(input.places).every(takesPart), 'places only for participants');
  }
  // US-ER-06 AK-4: with points the places follow from them; a ranking by hand is only without.
  assert(
    entered(input.scores, participants).length === 0 ||
      entered(input.places, participants).length === 0,
    'points and a ranking by hand are not entered together',
  );
  assert(input.durationMinutes === undefined || rules.tracksDuration, 'the game has a duration');
  const colors = input.catanColors;
  if (colors !== undefined) {
    const palette = rules.playerColors;
    assert(palette !== null, 'the game has player colours');
    const keys = participants.map((personId) => colors[personId]);
    assert(
      Object.keys(colors).length === participants.length &&
        keys.every((key) => key !== undefined && palette.includes(key)) &&
        new Set(keys).size === keys.length,
      'one distinct colour of the game per participant (Specification 3.3)',
    );
  }
  // US-ER-06 AK-3: with a complete ranking the winners are exactly the persons on place 1.
  const places = input.places;
  if (places !== undefined && entered(places, participants).length === participants.length) {
    const first = participants.filter((personId) => places[personId] === 1);
    assert(
      first.length === input.winnerIds.length &&
        first.every((personId) => input.winnerIds.includes(personId)),
      'the winners are the persons on place 1',
    );
  }
}

/**
 * All expected errors of a result, in the order of the form, so the form can show them while
 * typing (Specification 3.6). Empty if the result can be stored; plausibility warnings are
 * separate (`plausibilityWarnings`).
 * @throws {InvariantError} for an input the form cannot produce, e.g. a winner who did not take
 * part or points for a game without them.
 */
export function resultErrors(
  input: ResultInput,
  participants: readonly PersonId[],
  rules: ResultRules,
): ResultError[] {
  assertFitsGame(input, participants, rules);
  const errors: ResultError[] = [];
  if (!parseLocalDate(input.date).ok) {
    errors.push('date-invalid');
  }
  if (input.time !== undefined && !parseLocalTime(input.time).ok) {
    errors.push('time-invalid');
  }
  // US-ER-01 AK-2: the edition is required where the game has editions.
  if (rules.editions.length > 0 && input.edition === undefined) {
    errors.push('edition-missing');
  }
  // FA-ER-07: at least one winner; with Catan exactly one.
  if (input.winnerIds.length === 0) {
    errors.push('winner-missing');
  } else if (rules.hasSingleWinner && input.winnerIds.length > 1) {
    errors.push('winner-not-single');
  }
  // FA-ER-06: points for all participants or for none, whole numbers; from 0 unless the game
  // allows negative points (custom games, US-ER-02 AK-3).
  const scores = entered(input.scores, participants);
  if (scores.length > 0 && scores.length < participants.length) {
    errors.push('scores-incomplete');
  }
  const lowest = rules.allowsNegativeScores ? -Infinity : 0;
  if (scores.some((value) => !Number.isInteger(value) || value < lowest)) {
    errors.push('scores-invalid');
  }
  // FA-ER-12: places for all participants or for none, forming a ranking (US-ER-06 AK-2).
  const places = entered(input.places, participants);
  if (places.length > 0 && places.length < participants.length) {
    errors.push('places-incomplete');
  }
  const hasPlaceOutOfRange = places.some(
    (place) => !Number.isInteger(place) || place < 1 || place > participants.length,
  );
  if (hasPlaceOutOfRange || (places.length === participants.length && !isRanking(places))) {
    errors.push('places-invalid');
  }
  // FA-ER-10: whole minutes from 1.
  const duration = input.durationMinutes;
  if (duration !== undefined && (!Number.isInteger(duration) || duration < 1)) {
    errors.push('duration-invalid');
  }
  return errors;
}

/**
 * Checks a result and gives what is stored (Specification 3.6): the first expected error in the
 * order of the form, or the content with the default mode filled in, notes trimmed and empty
 * fields left out.
 * @throws {InvariantError} for an input the form cannot produce, see `resultErrors`.
 */
export function checkResult(
  input: ResultInput,
  participants: readonly PersonId[],
  rules: ResultRules,
): Result<ResultContent, ResultError> {
  const [error] = resultErrors(input, participants, rules);
  if (error !== undefined) {
    return err(error);
  }
  const date = parseLocalDate(input.date);
  assert(date.ok, 'the date was checked');
  let time: LocalTime | undefined;
  if (input.time !== undefined) {
    const parsed = parseLocalTime(input.time);
    assert(parsed.ok, 'the time was checked');
    time = parsed.value;
  }
  const mode = input.mode ?? rules.modes[0];
  const notes = input.notes?.trim() ?? '';
  const hasScores = entered(input.scores, participants).length > 0;
  const hasPlaces = entered(input.places, participants).length > 0;
  return ok({
    date: date.value,
    ...(time === undefined ? {} : { time }),
    ...(input.edition === undefined ? {} : { edition: input.edition }),
    ...(mode === undefined ? {} : { mode }),
    winnerIds: [...input.winnerIds],
    ...(hasScores && input.scores !== undefined ? { scores: { ...input.scores } } : {}),
    ...(hasPlaces && input.places !== undefined ? { places: { ...input.places } } : {}),
    ...(input.catanColors === undefined ? {} : { catanColors: { ...input.catanColors } }),
    ...(input.durationMinutes === undefined ? {} : { durationMinutes: input.durationMinutes }),
    ...(notes === '' ? {} : { notes }),
  });
}
