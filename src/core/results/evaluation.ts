import type { Match, PersonId } from '@/core/model';

/**
 * What the evaluation of a result looks at: winners and victory points.
 */
export type ResultOutcome = Pick<Match, 'winnerIds' | 'victoryPoints'>;

/**
 * A plausibility warning before storing (FA-ER-06, US-ER-02 AK-4): a winner does not have the
 * highest score, or winners of a draw have different scores. Storing stays possible after
 * confirming.
 */
export type PlausibilityWarning = 'winner-not-highest' | 'winners-differ';

function pointsOf(outcome: ResultOutcome, personId: PersonId): number | undefined {
  return outcome.victoryPoints?.[personId];
}

/**
 * The plausibility warnings of a result (FA-ER-06, US-ER-02 AK-4); empty without victory
 * points. The participants are those with victory points.
 */
export function plausibilityWarnings(
  outcome: ResultOutcome,
  participants: readonly PersonId[],
): PlausibilityWarning[] {
  const scores = participants.flatMap((personId) => {
    const points = pointsOf(outcome, personId);
    return points === undefined ? [] : [points];
  });
  if (scores.length === 0) {
    return [];
  }
  const highest = Math.max(...scores);
  const winnerScores = outcome.winnerIds.map((personId) => pointsOf(outcome, personId));
  const warnings: PlausibilityWarning[] = [];
  if (winnerScores.some((points) => points !== undefined && points < highest)) {
    warnings.push('winner-not-highest');
  }
  if (new Set(winnerScores).size > 1) {
    warnings.push('winners-differ');
  }
  return warnings;
}

/**
 * The places from the victory points (FA-ER-11, Specification 3.6): the winners have place 1,
 * the other participants follow by victory points in descending order; the same score gives the
 * same place and the following place is skipped (10, 8, 8, 6 points give 1, 2, 2, 4). This holds
 * also if a winner with fewer points was stored after the warning. Without victory points there
 * are no places: `null`.
 */
export function placesOf(
  outcome: ResultOutcome,
  participants: readonly PersonId[],
): ReadonlyMap<PersonId, number> | null {
  if (outcome.victoryPoints === undefined) {
    return null;
  }
  const isWinner = (personId: PersonId): boolean => outcome.winnerIds.includes(personId);
  const others = participants.filter((personId) => !isWinner(personId));
  const points = (personId: PersonId): number => pointsOf(outcome, personId) ?? 0;
  const places = new Map<PersonId, number>();
  for (const personId of participants) {
    places.set(
      personId,
      isWinner(personId)
        ? 1
        : 1 +
            outcome.winnerIds.length +
            others.filter((other) => points(other) > points(personId)).length,
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
