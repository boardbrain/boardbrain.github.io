import type {
  GameId,
  GroupId,
  IsoTimestamp,
  PersonId,
  ScoreTarget,
  ScoringDirection,
} from '@/core/model';
import { bestScorers, MAX_SCORE, placesOf } from '@/core/results';
import { assert, err, ok, type Result } from '@/core/shared';

/**
 * Id of the single stored score pad; there is at most one running match (FA-AB-07, E-51).
 */
export const SCORE_PAD_ID = 'current';

/**
 * Version of the stored form of a score pad. A score pad of another version leads to a message
 * instead of a crash (Architecture 10.5).
 */
export const SCORE_PAD_SCHEMA_VERSION = 1;

/**
 * How the numbers are typed (FA-NB-05): the points of the round, the app adds them up, or the new
 * standing, the app stores the difference as the points of the round.
 */
export type ScorePadCalculation = 'app' | 'self';

/**
 * What holds for one score pad only (FA-NB-05, FA-NB-06, E-52).
 */
export type ScorePadSettings = {
  /** `null`: no target, the persons end on their own. */
  readonly target: ScoreTarget | null;
  readonly calculation: ScorePadCalculation;
};

/**
 * Settings of a new score pad (US-NB-03 AK-1): no target, the app adds up.
 */
export const DEFAULT_SCORE_PAD_SETTINGS: ScorePadSettings = { target: null, calculation: 'app' };

/**
 * Points of every participant in one round, or the standings after it.
 */
export type ScoreRound = Readonly<Record<PersonId, number>>;

/**
 * A running score pad (FA-NB-02, Architecture 10.5). Only complete rounds are stored, always as
 * the points of the round (FA-NB-05).
 */
export type ScorePad = {
  readonly id: typeof SCORE_PAD_ID;
  readonly schemaVersion: number;
  readonly gameId: GameId;
  readonly groupId: GroupId;
  /** The members of the table when it started, in its order (E-41). */
  readonly participants: readonly PersonId[];
  /** Date and time of the result (FA-NB-07). */
  readonly startedAt: IsoTimestamp;
  readonly settings: ScorePadSettings;
  readonly rounds: readonly ScoreRound[];
  /** "Ziel erreicht" was shown for the current target (US-NB-03 AK-4). */
  readonly isTargetNoticed: boolean;
};

/**
 * Error code for a number that is no whole number or lies beyond 99 999 either way, as points of
 * a round or as a standing (US-NB-02 AK-5).
 */
export type EntryInvalidError = 'entry-invalid';

/**
 * Whether a number may stand in a score pad (US-NB-02 AK-5, Specification 3.6): a whole number up
 * to 99 999 either way.
 */
export function isScorePadNumber(value: number): boolean {
  return Number.isInteger(value) && Math.abs(value) <= MAX_SCORE;
}

/**
 * Whether a target is valid (US-NB-03 AK-2): a whole number from 1 to 99 999.
 */
export function isValidTarget(target: ScoreTarget): boolean {
  return Number.isInteger(target.value) && target.value >= 1 && target.value <= MAX_SCORE;
}

/**
 * Starts a score pad with these settings and no round (US-NB-01 AK-3).
 */
export function createScorePad(fields: {
  readonly gameId: GameId;
  readonly groupId: GroupId;
  readonly participants: readonly PersonId[];
  readonly startedAt: IsoTimestamp;
  readonly settings: ScorePadSettings;
}): ScorePad {
  assert(fields.participants.length > 0, 'a score pad has participants');
  assert(
    fields.settings.target === null || isValidTarget(fields.settings.target),
    'the target is valid',
  );
  return {
    id: SCORE_PAD_ID,
    schemaVersion: SCORE_PAD_SCHEMA_VERSION,
    gameId: fields.gameId,
    groupId: fields.groupId,
    participants: [...fields.participants],
    startedAt: fields.startedAt,
    settings: fields.settings,
    rounds: [],
    isTargetNoticed: false,
  };
}

function zeros(participants: readonly PersonId[]): Record<PersonId, number> {
  const round: Record<PersonId, number> = {};
  for (const personId of participants) {
    round[personId] = 0;
  }
  return round;
}

/**
 * The standing of every participant after each round (FA-NB-03): the sums of the rounds so far.
 */
export function standingsOf(
  rounds: readonly ScoreRound[],
  participants: readonly PersonId[],
): ScoreRound[] {
  const standings: ScoreRound[] = [];
  let total = zeros(participants);
  for (const round of rounds) {
    const next = zeros(participants);
    for (const personId of participants) {
      next[personId] = (total[personId] ?? 0) + (round[personId] ?? 0);
    }
    standings.push(next);
    total = next;
  }
  return standings;
}

/**
 * The current standing of every participant: the sums of all rounds, 0 before the first.
 */
export function totalsOf(
  rounds: readonly ScoreRound[],
  participants: readonly PersonId[],
): ScoreRound {
  return standingsOf(rounds, participants).at(-1) ?? zeros(participants);
}

/**
 * The places after the current standing as for a result with points (FA-NB-03, FA-ER-11): the
 * best first, the same standing shares a place and the following place is skipped (1, 2, 2, 4).
 */
export function placesOfStanding(
  totals: ScoreRound,
  participants: readonly PersonId[],
  scoring: ScoringDirection,
): ReadonlyMap<PersonId, number> {
  const places = placesOf(
    { winnerIds: bestScorers(totals, participants, scoring), scores: totals },
    participants,
    scoring,
  );
  assert(places !== null, 'points give places');
  return places;
}

/**
 * The persons whose standing reaches a target in points (FA-NB-06): at or above it, whichever
 * score wins. Empty without such a target.
 */
export function personsAtTarget(
  target: ScoreTarget | null,
  rounds: readonly ScoreRound[],
  participants: readonly PersonId[],
): PersonId[] {
  if (target?.kind !== 'points') {
    return [];
  }
  const totals = totalsOf(rounds, participants);
  return participants.filter((personId) => (totals[personId] ?? 0) >= target.value);
}

/**
 * Whether the target is reached (FA-NB-06): a standing at or above the points, or as many rounds
 * as the target says. Without a target never.
 */
export function isTargetReached(
  target: ScoreTarget | null,
  rounds: readonly ScoreRound[],
  participants: readonly PersonId[],
): boolean {
  if (target === null) {
    return false;
  }
  return target.kind === 'rounds'
    ? rounds.length >= target.value
    : personsAtTarget(target, rounds, participants).length > 0;
}

// Every number of the rounds and every standing may stand in a score pad (US-NB-02 AK-5).
function checkRounds(
  rounds: readonly ScoreRound[],
  participants: readonly PersonId[],
): Result<ScoreRound[], EntryInvalidError> {
  const fits = (round: ScoreRound): boolean =>
    participants.every((personId) => isScorePadNumber(round[personId] ?? 0));
  if (!rounds.every(fits) || !standingsOf(rounds, participants).every(fits)) {
    return err('entry-invalid');
  }
  return ok([...rounds]);
}

/**
 * The round that typed numbers make (FA-NB-05): with "App rechnet" the points of the round, with
 * "Selbst rechnen" the new standings, from which the difference to the current standing is
 * taken. Every participant needs a number.
 */
export function roundOfEntries(
  entries: ScoreRound,
  rounds: readonly ScoreRound[],
  participants: readonly PersonId[],
  calculation: ScorePadCalculation,
): ScoreRound {
  const totals = totalsOf(rounds, participants);
  const round: Record<PersonId, number> = {};
  for (const personId of participants) {
    const entry = entries[personId];
    assert(entry !== undefined, `a number for ${personId}`);
    round[personId] = calculation === 'self' ? entry - (totals[personId] ?? 0) : entry;
  }
  return round;
}

/**
 * Adds a round from typed numbers (US-NB-02 AK-3, FA-NB-05), or `entry-invalid` if a number or a
 * standing leaves the range (AK-5).
 */
export function addRound(
  rounds: readonly ScoreRound[],
  entries: ScoreRound,
  participants: readonly PersonId[],
  calculation: ScorePadCalculation,
): Result<ScoreRound[], EntryInvalidError> {
  const round = roundOfEntries(entries, rounds, participants, calculation);
  return checkRounds([...rounds, round], participants);
}

/**
 * Changes one number of a stored round (US-NB-02 AK-4). With "App rechnet" it is the points of the
 * round. With "Selbst rechnen" it is the standing after the round; the following round balances
 * the difference, so the later standings stay (FA-NB-05). A round or person that does not exist
 * throws.
 */
export function changeEntry(
  rounds: readonly ScoreRound[],
  index: number,
  personId: PersonId,
  value: number,
  participants: readonly PersonId[],
  calculation: ScorePadCalculation,
): Result<ScoreRound[], EntryInvalidError> {
  const round = rounds[index];
  assert(round !== undefined, `round ${String(index)} exists`);
  const current = round[personId];
  assert(current !== undefined, `${personId} takes part`);
  const standing = standingsOf(rounds, participants)[index]?.[personId] ?? 0;
  const delta = calculation === 'self' ? value - standing : value - current;
  const changed = rounds.map((other, at) => {
    if (at === index) {
      return { ...other, [personId]: current + delta };
    }
    if (calculation === 'self' && at === index + 1) {
      return { ...other, [personId]: (other[personId] ?? 0) - delta };
    }
    return other;
  });
  return checkRounds(changed, participants);
}

/**
 * Deletes a round (US-NB-02 AK-4); the later rounds keep their points. A round that does not exist
 * throws.
 */
export function deleteRound(rounds: readonly ScoreRound[], index: number): ScoreRound[] {
  assert(index >= 0 && index < rounds.length, `round ${String(index)} exists`);
  return rounds.filter((_, at) => at !== index);
}

/**
 * Stores what changed in a score pad and notes whether the target is reached for the first time
 * (US-NB-03 AK-4): then "Ziel erreicht" is shown once. A changed target is noticed anew.
 */
export function withChanges(
  pad: ScorePad,
  changes: { readonly rounds?: readonly ScoreRound[]; readonly settings?: ScorePadSettings },
): { readonly pad: ScorePad; readonly isTargetReachedNow: boolean } {
  const settings = changes.settings ?? pad.settings;
  assert(settings.target === null || isValidTarget(settings.target), 'the target is valid');
  const rounds = changes.rounds ?? pad.rounds;
  const isSameTarget =
    settings.target?.kind === pad.settings.target?.kind &&
    settings.target?.value === pad.settings.target?.value;
  const wasNoticed = isSameTarget && pad.isTargetNoticed;
  const isTargetReachedNow =
    !wasNoticed && isTargetReached(settings.target, rounds, pad.participants);
  return {
    pad: { ...pad, settings, rounds, isTargetNoticed: wasNoticed || isTargetReachedNow },
    isTargetReachedNow,
  };
}
