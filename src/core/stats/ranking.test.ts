import { describe, expect, it } from 'vitest';
import {
  ANNA,
  BEN,
  CATAN,
  CLARA,
  DAVID,
  SKYJO,
  TABLE,
  UNO,
  gameOf,
  series,
} from '@tests/support/statsFakes';
import {
  criterionValue,
  leadersOf,
  podiumOf,
  rankingCriteria,
  rankPersons,
  winsPodiumOf,
  type PodiumStep,
} from './ranking';
import { computeStatistics } from './statistics';

function order(ranked: ReturnType<typeof rankPersons>): [string, number][] {
  return ranked.map((entry) => [entry.person.personId, entry.rank]);
}

describe('US-ST-02 ranking', () => {
  it('AK-1: is sorted by wins by default', () => {
    const stats = computeStatistics(
      series([{ winners: [CLARA] }, { winners: [CLARA] }, { winners: [BEN] }]),
      TABLE,
      null,
      gameOf,
    );

    expect(
      rankPersons(stats, 'wins')
        .map((entry) => entry.person.personId)
        .slice(0, 2),
    ).toEqual([CLARA, BEN]);
  });

  it('AK-2: offers average place only with places, average points only for one game with points, never the current series (E-57)', () => {
    const uno = computeStatistics(series([{ winners: [ANNA] }]), TABLE, UNO, gameOf);
    const skyjo = computeStatistics(
      series([{ game: SKYJO, winners: [ANNA], scores: [5, 9, 12, 20] }]),
      TABLE,
      SKYJO,
      gameOf,
    );
    const mixed = computeStatistics(
      series([{ game: SKYJO, winners: [ANNA], scores: [5, 9, 12, 20] }, { winners: [BEN] }]),
      TABLE,
      null,
      gameOf,
    );

    expect(rankingCriteria(uno)).toEqual(['wins', 'longest-streak']);
    expect(rankingCriteria(skyjo)).toEqual([
      'wins',
      'average-place',
      'average-score',
      'longest-streak',
    ]);
    expect(rankingCriteria(mixed)).toEqual(['wins', 'average-place', 'longest-streak']);
  });

  it('AK-3: decides ties by wins, draws, average place and points; complete ties share a rank', () => {
    const stats = computeStatistics(
      series([
        { winners: [ANNA], places: [1, 2, 3, 4] },
        { winners: [BEN], places: [3, 1, 2, 4] },
        { winners: [CLARA, DAVID] },
      ]),
      TABLE,
      null,
      gameOf,
    );

    // Anna and Ben: 1 win each, no draw; Ø place Anna 2, Ben 1.5 → Ben first.
    // Clara and David: 0 wins, 1 draw each; Ø place Clara 2.5, David 4.
    expect(order(rankPersons(stats, 'wins'))).toEqual([
      [BEN, 1],
      [ANNA, 2],
      [CLARA, 3],
      [DAVID, 4],
    ]);
    const plain = computeStatistics(
      series([{ winners: [ANNA] }, { winners: [BEN] }]),
      TABLE,
      UNO,
      gameOf,
    );
    expect(order(rankPersons(plain, 'wins'))).toEqual([
      [ANNA, 1],
      [BEN, 1],
      [CLARA, 3],
      [DAVID, 3],
    ]);
  });

  it('AK-3: a smaller average place is better, fewer points if the fewest win; no value stands last', () => {
    const skyjo = computeStatistics(
      series([
        { game: SKYJO, winners: [DAVID], scores: [30, 20, 25, 5] },
        { game: SKYJO, winners: [BEN] },
      ]),
      TABLE,
      SKYJO,
      gameOf,
    );

    expect(rankPersons(skyjo, 'average-score')[0]?.person.personId).toBe(DAVID);
    expect(rankPersons(skyjo, 'average-place')[0]?.person.personId).toBe(DAVID);
    const catan = computeStatistics(
      series([
        { game: CATAN, winners: [ANNA], scores: [10, 7, 8, 9] },
        { game: CATAN, winners: [BEN] },
      ]),
      TABLE,
      CATAN,
      gameOf,
    );
    expect(rankPersons(catan, 'average-score').map((entry) => entry.person.personId)).toEqual([
      ANNA,
      DAVID,
      CLARA,
      BEN,
    ]);
  });

  it('sorts by the longest winning streak', () => {
    const stats = computeStatistics(
      series([{ winners: [CLARA] }, { winners: [CLARA] }, { winners: [ANNA] }]),
      TABLE,
      null,
      gameOf,
    );
    const ranked = rankPersons(stats, 'longest-streak');
    const first = ranked[0];

    expect(first?.person.personId).toBe(CLARA);
    expect(first === undefined ? null : criterionValue(first.person, 'longest-streak')).toBe(2);
  });

  it('US-ST-01 AK-7: the leaders of a table stand on step 1 of the page, none without a win', () => {
    const tie = computeStatistics(
      series([{ winners: [ANNA] }, { winners: [BEN] }]),
      TABLE,
      null,
      gameOf,
    );

    expect(leadersOf(tie)).toEqual([ANNA, BEN]);
    expect(leadersOf(computeStatistics([], TABLE, null, gameOf))).toEqual([]);
    // Equal wins: the draw puts Ben ahead, on the card as on the page (PO 27.11.2026).
    const draws = computeStatistics(
      series([{ winners: [ANNA] }, { winners: [BEN] }, { winners: [BEN, CLARA] }]),
      TABLE,
      null,
      gameOf,
    );
    expect(leadersOf(draws)).toEqual([BEN]);
    const none = computeStatistics(series([{ winners: [ANNA, BEN] }]), TABLE, null, gameOf);
    expect(leadersOf(none)).toEqual([]);
  });

  it('PO 27.11.2026: the podium by wins of a card is the podium of the page', () => {
    // Ben and Clara have five wins each, Ben also a draw: page and card show 1, 2, 3.
    const stats = computeStatistics(
      series([
        ...Array.from({ length: 6 }, () => ({ winners: [ANNA] })),
        ...Array.from({ length: 5 }, () => ({ winners: [BEN] })),
        ...Array.from({ length: 5 }, () => ({ winners: [CLARA] })),
        { winners: [BEN, DAVID] },
      ]),
      TABLE,
      null,
      gameOf,
    );
    const ranks = (steps: readonly PodiumStep[]): [number, string[]][] =>
      steps.map((step) => [step.rank, step.persons.map((person) => person.personId)]);

    expect(ranks(winsPodiumOf(stats))).toEqual(ranks(podiumOf(rankPersons(stats, 'wins'), 'wins')));
    expect(ranks(winsPodiumOf(stats))).toEqual([
      [1, [ANNA]],
      [2, [BEN]],
      [3, [CLARA]],
    ]);
  });

  it('PO 26.11.2026: the podium puts equal ranks on one step and nobody with 0 on it', () => {
    const stats = computeStatistics(
      series([{ winners: [ANNA] }, { winners: [ANNA] }, { winners: [BEN] }, { winners: [CLARA] }]),
      TABLE,
      null,
      gameOf,
    );
    const steps = (criterion: Parameters<typeof podiumOf>[1]): [number, string[]][] =>
      podiumOf(rankPersons(stats, criterion), criterion).map((step) => [
        step.rank,
        step.persons.map((person) => person.personId),
      ]);

    // Ben and Clara tie in everything; David has no win and stays off.
    expect(steps('wins')).toEqual([
      [1, [ANNA]],
      [2, [BEN, CLARA]],
    ]);
    expect(steps('longest-streak')).toEqual([
      [1, [ANNA]],
      [2, [BEN, CLARA]],
    ]);
    const draws = computeStatistics(series([{ winners: [ANNA, BEN] }]), TABLE, null, gameOf);
    expect(podiumOf(rankPersons(draws, 'wins'), 'wins')).toEqual([]);
  });
});
