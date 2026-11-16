import type { Match, PersonId, ScoringDirection } from '@/core/model';

/**
 * What the evaluation of a result looks at: winners, points and a ranking entered by hand.
 */
export type ResultOutcome = Pick<Match, 'winnerIds' | 'scores' | 'places'>;

/**
 * A plausibility warning before storing (FA-ER-06, US-ER-02 AK-4): a winner does not have the
 * best score, or winners of a draw have different scores. Storing stays possible after
 * confirming.
 */
export type PlausibilityWarning = 'winner-not-best' | 'winners-differ';

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
 * The plausibility warnings of a result (FA-ER-06, US-ER-02 AK-4); empty without points or for
 * a game without points (`scoring` is `null`). The participants are those with points.
 */
export function plausibilityWarnings(
  outcome: ResultOutcome,
  participants: readonly PersonId[],
  scoring: ScoringDirection | null,
): PlausibilityWarning[] {
  const scores = participants.flatMap((personId) => {
    const score = scoreOf(outcome, personId);
    return score === undefined ? [] : [score];
  });
  if (scoring === null || scores.length === 0) {
    return [];
  }
  const best = bestOf(scores, scoring);
  const winnerScores = outcome.winnerIds.map((personId) => scoreOf(outcome, personId));
  const warnings: PlausibilityWarning[] = [];
  if (winnerScores.some((score) => score !== undefined && score !== best)) {
    warnings.push('winner-not-best');
  }
  if (new Set(winnerScores).size > 1) {
    warnings.push('winners-differ');
  }
  return warnings;
}

/**
 * The winners the form suggests once every participant has points (FA-ER-06, US-ER-02 AK-6): the
 * persons with the best score, several for a draw. For a game with exactly one winner a tie at
 * the top suggests nobody. Empty while points are missing.
 */
export function suggestedWinners(
  scores: Readonly<Record<PersonId, number>>,
  participants: readonly PersonId[],
  scoring: ScoringDirection,
  hasSingleWinner: boolean,
): PersonId[] {
  const entered = participants.flatMap((personId) => {
    const score = scores[personId];
    return score === undefined ? [] : [score];
  });
  if (entered.length < participants.length) {
    return [];
  }
  const best = bestOf(entered, scoring);
  const winners = participants.filter((personId) => scores[personId] === best);
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
 * 1, 2, 2, 4). This holds also if a winner without the best score was stored after the warning.
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
