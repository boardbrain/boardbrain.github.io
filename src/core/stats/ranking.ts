import type { PersonId } from '@/core/model';
import type { GroupStatistics, PersonStatistics } from './statistics';

/**
 * A criterion of the ranking (US-ST-02, Specification 3.8). The current winning streak is none
 * (E-57).
 */
export type RankingCriterion = 'wins' | 'average-place' | 'average-score' | 'longest-streak';

/**
 * A person in the ranking with its rank; persons in a complete tie share a rank (US-ST-02 AK-3).
 */
export type RankedPerson = {
  readonly person: PersonStatistics;
  readonly rank: number;
};

/**
 * The criteria that make sense in the filter (US-ST-02 AK-2, Specification 3.8): wins, the
 * average place with matches with places, the average points only for a single game with
 * points, and the longest winning streak.
 */
export function rankingCriteria(stats: GroupStatistics): RankingCriterion[] {
  const hasScores = stats.persons.some((person) => person.averageScore !== null);
  return [
    'wins',
    ...(stats.placedMatchCount > 0 ? ['average-place' as const] : []),
    ...(hasScores ? ['average-score' as const] : []),
    'longest-streak',
  ];
}

/**
 * The value of a person in a criterion; `null` without data ("–").
 */
export function criterionValue(
  person: PersonStatistics,
  criterion: RankingCriterion,
): number | null {
  switch (criterion) {
    case 'wins':
      return person.wins;
    case 'average-place':
      return person.averagePlace;
    case 'average-score':
      return person.averageScore;
    case 'longest-streak':
      return person.longestStreak?.length ?? 0;
  }
}

type Key = { value: (person: PersonStatistics) => number | null; isLowBetter: boolean };

// Persons without a value ("–") stand behind those with one (Specification 3.8).
function compareBy(key: Key, a: PersonStatistics, b: PersonStatistics): number {
  const valueA = key.value(a);
  const valueB = key.value(b);
  if (valueA === valueB) {
    return 0;
  }
  if (valueA === null) {
    return 1;
  }
  if (valueB === null) {
    return -1;
  }
  return key.isLowBetter ? valueA - valueB : valueB - valueA;
}

/**
 * The ranking by a criterion (US-ST-02, Specification 3.8). On a tie the following criteria
 * decide in turn: wins, draws, average place and average points, as far as they occur in the
 * filter. A smaller average place is better, as are fewer average points if the fewest points
 * win. A complete tie shares the rank (1, 1, 3); among each other the seat order stays. With
 * `isCriterionOnly` nothing else decides, e.g. for the leaders by wins on a table card.
 */
export function rankPersons(
  stats: GroupStatistics,
  criterion: RankingCriterion,
  isCriterionOnly = false,
): RankedPerson[] {
  const isLowScoreBetter = stats.scoring === 'lowest-wins';
  const keyOf = (name: RankingCriterion | 'draws'): Key =>
    name === 'draws'
      ? { value: (person) => person.draws, isLowBetter: false }
      : {
          value: (person) => criterionValue(person, name),
          isLowBetter: name === 'average-place' || (name === 'average-score' && isLowScoreBetter),
        };
  const available = rankingCriteria(stats);
  const followers: (RankingCriterion | 'draws')[] = [
    'wins',
    ...(stats.hasDraws ? ['draws' as const] : []),
    ...(available.includes('average-place') ? ['average-place' as const] : []),
    ...(available.includes('average-score') ? ['average-score' as const] : []),
  ];
  const keys = (
    isCriterionOnly ? [criterion] : [criterion, ...followers.filter((name) => name !== criterion)]
  ).map(keyOf);
  const compare = (a: PersonStatistics, b: PersonStatistics): number => {
    for (const key of keys) {
      const result = compareBy(key, a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
  // `toSorted` is stable, so persons in a complete tie keep the seat order.
  const sorted = stats.persons.toSorted(compare);
  return sorted.map((person, index) => {
    const first = sorted.findIndex((other) => compare(other, person) === 0);
    return { person, rank: (first === -1 ? index : first) + 1 };
  });
}

/**
 * A step of the podium: a rank from 1 to 3 and everybody on it (design I3-D RA).
 */
export type PodiumStep = {
  readonly rank: number;
  readonly persons: readonly PersonStatistics[];
};

const PODIUM_RANKS = 3;

// Only who has something in the criterion stands on the podium: no "0 Siege" (PO 26.11.2026).
function isOnPodium(person: PersonStatistics, criterion: RankingCriterion): boolean {
  const value = criterionValue(person, criterion);
  return criterion === 'wins' || criterion === 'longest-streak'
    ? value !== null && value > 0
    : value !== null;
}

/**
 * The podium of a ranking (US-ST-02, design I3-D RA, PO 26.11.2026): ranks 1 to 3, everybody who
 * shares a rank stands on its step together, and nobody with 0 or no value stands on it. Steps
 * without anybody are left out, so ranks 1, 1, 3 give two steps.
 */
export function podiumOf(
  ranking: readonly RankedPerson[],
  criterion: RankingCriterion,
): PodiumStep[] {
  const steps: { rank: number; persons: PersonStatistics[] }[] = [];
  for (const { person, rank } of ranking) {
    if (rank > PODIUM_RANKS || !isOnPodium(person, criterion)) {
      continue;
    }
    const step = steps.find((candidate) => candidate.rank === rank);
    if (step === undefined) {
      steps.push({ rank, persons: [person] });
    } else {
      step.persons.push(person);
    }
  }
  return steps;
}

/**
 * The persons with the most wins, e.g. the leaders of a table on its card (US-ST-01 AK-7):
 * everybody with as many wins as the best counts, nothing else decides (PO 26.11.2026); empty
 * without a win.
 */
export function leadersOf(stats: GroupStatistics): PersonId[] {
  const [first] = podiumOf(rankPersons(stats, 'wins', true), 'wins');
  return first?.rank === 1 ? first.persons.map((person) => person.personId) : [];
}
