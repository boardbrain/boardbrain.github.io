import {
  parseLocalDate,
  parseLocalTime,
  type CatanColorKey,
  type LocalTime,
  type Match,
  type PersonId,
} from '@/core/model';
import { assert, err, ok, type Result } from '@/core/shared';

/**
 * What a game allows in a result (FA-SP-05, FA-ER-03, FA-ER-07, FA-ER-10). The game module
 * provides it, so the rules know no game (ADR-028); in version 1 everything is allowed only for
 * Catan.
 */
export type ResultRules = {
  /** Keys of the editions; one is required if there are any (FA-ER-03). */
  readonly editions: readonly string[];
  /** Keys of the modes, the first is the default; optional (FA-ER-03, US-ER-01 AK-6). */
  readonly modes: readonly string[];
  /** Exactly one winner, no draw (FA-ER-07, E-42). */
  readonly hasSingleWinner: boolean;
  /** Victory points can be recorded (FA-ER-06). */
  readonly supportsVictoryPoints: boolean;
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
  readonly winnerIds: readonly PersonId[];
  /** Entered victory points; persons without an entry are missing. */
  readonly victoryPoints?: Readonly<Record<PersonId, number>>;
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
 * more than one winner where only one is allowed (AK-4), victory points for only some
 * participants (US-ER-02 AK-2) or not whole numbers from 0 (AK-3), a duration that is not whole
 * minutes from 1 (US-ER-01 AK-7).
 */
export type ResultError =
  | 'date-invalid'
  | 'time-invalid'
  | 'edition-missing'
  | 'winner-missing'
  | 'winner-not-single'
  | 'victory-points-incomplete'
  | 'victory-points-invalid'
  | 'duration-invalid';

function enteredPoints(input: ResultInput, participants: readonly PersonId[]): readonly number[] {
  const points = input.victoryPoints;
  if (points === undefined) {
    return [];
  }
  return participants.flatMap((personId) => {
    const value = points[personId];
    return value === undefined ? [] : [value];
  });
}

// Inputs the form cannot produce are programming errors (ADR-025): a field the game does not
// have, a winner who did not take part, an unknown edition, mode or colour.
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
  if (input.victoryPoints !== undefined) {
    assert(rules.supportsVictoryPoints, 'the game has victory points');
    assert(Object.keys(input.victoryPoints).every(takesPart), 'points only for participants');
  }
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
}

/**
 * All expected errors of a result, in the order of the form, so the form can show them while
 * typing (Specification 3.6). Empty if the result can be stored; plausibility warnings are
 * separate (`plausibilityWarnings`).
 * @throws {InvariantError} for an input the form cannot produce, e.g. a winner who did not take
 * part or victory points for a game without them.
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
  // FA-ER-06: victory points for all participants or for none, whole numbers from 0.
  const points = enteredPoints(input, participants);
  if (points.length > 0 && points.length < participants.length) {
    errors.push('victory-points-incomplete');
  }
  if (points.some((value) => !Number.isInteger(value) || value < 0)) {
    errors.push('victory-points-invalid');
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
  const hasPoints = enteredPoints(input, participants).length > 0;
  return ok({
    date: date.value,
    ...(time === undefined ? {} : { time }),
    ...(input.edition === undefined ? {} : { edition: input.edition }),
    ...(mode === undefined ? {} : { mode }),
    winnerIds: [...input.winnerIds],
    ...(hasPoints && input.victoryPoints !== undefined
      ? { victoryPoints: { ...input.victoryPoints } }
      : {}),
    ...(input.catanColors === undefined ? {} : { catanColors: { ...input.catanColors } }),
    ...(input.durationMinutes === undefined ? {} : { durationMinutes: input.durationMinutes }),
    ...(notes === '' ? {} : { notes }),
  });
}
