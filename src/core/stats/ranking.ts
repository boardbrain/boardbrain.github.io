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
 * win. A complete tie shares the rank (1, 1, 3); among each other the seat order stays.
 */
export function rankPersons(stats: GroupStatistics, criterion: RankingCriterion): RankedPerson[] {
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
  const keys = [criterion, ...followers.filter((name) => name !== criterion)].map(keyOf);
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
 * The persons on rank 1 by wins over the given statistics, e.g. the leaders of a table on its
 * card (US-ST-01 AK-7); empty without matches.
 */
export function leadersOf(stats: GroupStatistics): PersonId[] {
  if (stats.matchCount === 0) {
    return [];
  }
  return rankPersons(stats, 'wins')
    .filter((entry) => entry.rank === 1)
    .map((entry) => entry.person.personId);
}
