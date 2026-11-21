import type { Match, PersonId, ScoringDirection } from '@/core/model';

/**
 * What the evaluation of a result looks at: winners, points and a ranking entered by hand.
 */
export type ResultOutcome = Pick<Match, 'winnerIds' | 'scores' | 'places'>;

/**
 * A plausibility warning before storing (Specification 3.6, US-ER-01 AK-8): the duration is
 * longer than 8 hours, e.g. after a typo like 1200 instead of 120 minutes. Storing stays possible
 * after confirming.
 */
export type PlausibilityWarning = 'duration-long';

function scoreOf(outcome: ResultOutcome, personId: PersonId): number | undefined {
  return outcome.scores?.[personId];
}

// FA-SP-07: the best score is the highest or, if the fewest points win, the lowest.
function bestOf(scores: readonly number[], scoring: ScoringDirection): number {
  return scoring === 'highest-wins' ? Math.max(...scores) : Math.min(...scores);
}

function isBetter(a: number, b: number, scoring: ScoringDirection): boolean {
  return scoring === 'highest-wins' ? a > b : a < b;
}

/**
 * Durations above this many minutes ask before storing (Specification 3.6, US-ER-01 AK-8).
 */
export const LONG_DURATION_MINUTES = 8 * 60;

/**
 * The plausibility warnings of a result (Specification 3.6, US-ER-01 AK-8). A winner without the
 * best score no longer needs a warning: with points the winners follow from them (E-47).
 */
export function plausibilityWarnings(
  input: Readonly<{ durationMinutes?: number }>,
): PlausibilityWarning[] {
  const duration = input.durationMinutes;
  return duration !== undefined && duration > LONG_DURATION_MINUTES ? ['duration-long'] : [];
}

/**
 * The persons with the best score once every participant has points (FA-ER-06, US-ER-02 AK-6);
 * empty while points are missing. Only among them a winner can be chosen (E-47).
 */
export function bestScorers(
  scores: Readonly<Record<PersonId, number>>,
  participants: readonly PersonId[],
  scoring: ScoringDirection,
): PersonId[] {
  const entered = participants.flatMap((personId) => {
    const score = scores[personId];
    return score === undefined ? [] : [score];
  });
  if (entered.length < participants.length) {
    return [];
  }
  const best = bestOf(entered, scoring);
  return participants.filter((personId) => scores[personId] === best);
}

/**
 * The winners once every participant has points (FA-ER-06, US-ER-02 AK-6): the persons with the
 * best score, several for a draw. For a game with exactly one winner a tie at the top gives
 * nobody, the form asks to choose among the best. Empty while points are missing.
 */
export function suggestedWinners(
  scores: Readonly<Record<PersonId, number>>,
  participants: readonly PersonId[],
  scoring: ScoringDirection,
  hasSingleWinner: boolean,
): PersonId[] {
  const winners = bestScorers(scores, participants, scoring);
  return hasSingleWinner && winners.length > 1 ? [] : winners;
}

/**
 * The winners of a ranking entered by hand: the persons on place 1 (FA-ER-12, US-ER-06 AK-3).
 */
export function winnersOfRanking(
  places: Readonly<Record<PersonId, number>>,
  participants: readonly PersonId[],
): PersonId[] {
  return participants.filter((personId) => places[personId] === 1);
}

/**
 * The places of a result (FA-ER-11, FA-ER-12, Specification 3.6). A ranking entered by hand is
 * taken as it is. From points, the winners have place 1 and the other participants follow by
 * their score, the best first (the highest, or the lowest if the fewest points win); the same
 * score gives the same place and the following place is skipped (10, 8, 8, 6 points give
 * 1, 2, 2, 4). A tie at the top resolved by choosing some of the best puts the others behind
 * the winners (E-47).
 * Without points and ranking, or for a game without points, there are no places: `null`.
 */
export function placesOf(
  outcome: ResultOutcome,
  participants: readonly PersonId[],
  scoring: ScoringDirection | null,
): ReadonlyMap<PersonId, number> | null {
  const ranking = outcome.places;
  if (ranking !== undefined) {
    return new Map(participants.map((personId) => [personId, ranking[personId] ?? 0]));
  }
  if (outcome.scores === undefined || scoring === null) {
    return null;
  }
  const isWinner = (personId: PersonId): boolean => outcome.winnerIds.includes(personId);
  const others = participants.filter((personId) => !isWinner(personId));
  const score = (personId: PersonId): number => scoreOf(outcome, personId) ?? 0;
  const places = new Map<PersonId, number>();
  for (const personId of participants) {
    places.set(
      personId,
      isWinner(personId)
        ? 1
        : 1 +
            outcome.winnerIds.length +
            others.filter((other) => isBetter(score(other), score(personId), scoring)).length,
    );
  }
  return places;
}

/**
 * The measured time of a match as stored in the result (US-AB-07 AK-4): rounded to whole
 * minutes, at least 1.
 */
export function durationMinutesOf(milliseconds: number): number {
  return Math.max(1, Math.round(milliseconds / 60_000));
}
