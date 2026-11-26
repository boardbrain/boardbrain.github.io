import { describe, expect, it } from 'vitest';
import { ANNA, BEN, CATAN, SKYJO, UNO, day, match } from '@tests/support/statsFakes';
import { ALL_TIME } from './period';
import { selectMatches, type StatsRequest } from './selection';

const TODAY = day('2026-11-17');
const MATCHES = [
  match({ game: CATAN, date: '2025-06-01', winners: [ANNA], edition: 'base' }),
  match({ game: UNO, date: '2026-03-02', winners: [BEN] }),
  match({ game: CATAN, date: '2026-04-01', winners: [BEN], edition: 'cities-and-knights' }),
  match({ game: UNO, date: '2026-01-05', winners: [ANNA] }),
  match({ game: CATAN, date: '2026-11-10', winners: [ANNA], edition: 'base' }),
];

describe('US-ST-03 filter the statistics', () => {
  it('PO 26.11.2026: knows whether the filter reaches the latest match of its game', () => {
    const request = { gameId: null, edition: null } as const;
    const year = (y: number): StatsRequest => ({ ...request, period: { kind: 'year', year: y } });

    expect(selectMatches(MATCHES, { ...request, period: ALL_TIME }, TODAY).isCurrent).toBe(true);
    expect(selectMatches(MATCHES, year(2025), TODAY).isCurrent).toBe(false);
    expect(selectMatches(MATCHES, year(2026), TODAY).isCurrent).toBe(true);
    // Uno's latest match lies in March: up to then Uno is current.
    const uno = {
      gameId: UNO,
      edition: null,
      period: { kind: 'range', from: day('2026-01-01'), to: day('2026-03-31') },
    } as const;
    expect(selectMatches(MATCHES, uno, TODAY).isCurrent).toBe(true);
  });

  it('AK-1: a group with several played games chooses between all games and one game', () => {
    const all = selectMatches(MATCHES, { gameId: null, edition: null, period: ALL_TIME }, TODAY);

    expect(all.canChooseGame).toBe(true);
    expect(all.games).toEqual([
      { gameId: CATAN, matchCount: 3 },
      { gameId: UNO, matchCount: 2 },
    ]);
    expect(all.gameId).toBeNull();
    expect(all.matches.map((m) => m.date)).toEqual([
      '2025-06-01',
      '2026-01-05',
      '2026-03-02',
      '2026-04-01',
      '2026-11-10',
    ]);
    const uno = selectMatches(MATCHES, { gameId: UNO, edition: null, period: ALL_TIME }, TODAY);
    expect(uno.gameId).toBe(UNO);
    expect(uno.matches).toHaveLength(2);
  });

  it('AK-1: a single played game is fixed, an unknown request falls back to all', () => {
    const catanOnly = MATCHES.filter((m) => m.gameId === CATAN);
    const fixed = selectMatches(
      catanOnly,
      { gameId: null, edition: null, period: ALL_TIME },
      TODAY,
    );

    expect(fixed.canChooseGame).toBe(false);
    expect(fixed.gameId).toBe(CATAN);
    expect(
      selectMatches(MATCHES, { gameId: SKYJO, edition: null, period: ALL_TIME }, TODAY).gameId,
    ).toBeNull();
  });

  it('AK-2: offers the editions of Catan only if both were played', () => {
    const catan = selectMatches(
      MATCHES,
      { gameId: CATAN, edition: 'base', period: ALL_TIME },
      TODAY,
    );

    expect(catan.editions).toEqual(['base', 'cities-and-knights']);
    expect(catan.edition).toBe('base');
    expect(catan.matches).toHaveLength(2);
    const in2025 = selectMatches(
      MATCHES,
      { gameId: CATAN, edition: 'base', period: { kind: 'year', year: 2025 } },
      TODAY,
    );
    expect(in2025.editions).toEqual([]);
    expect(in2025.edition).toBeNull();
    expect(
      selectMatches(MATCHES, { gameId: null, edition: 'base', period: ALL_TIME }, TODAY).edition,
    ).toBeNull();
  });

  it('AK-5: the quick choice offers the years with matches of this year and the two before', () => {
    const old = [
      match({ game: UNO, date: '2021-05-01', winners: [ANNA] }),
      match({ game: UNO, date: '2023-12-31', winners: [ANNA] }),
      match({ game: UNO, date: '2024-01-01', winners: [BEN] }),
      ...MATCHES,
    ];

    const selection = selectMatches(old, { gameId: null, edition: null, period: ALL_TIME }, TODAY);
    expect(selection.years).toEqual([2026, 2025, 2024]);
    // Older years stay reachable through the period itself.
    const year2021 = selectMatches(
      old,
      { gameId: null, edition: null, period: { kind: 'year', year: 2021 } },
      TODAY,
    );
    expect(year2021.matches.map((m) => m.date)).toEqual(['2021-05-01']);
  });

  it('AK-5: the period applies before the game; years with matches newest first', () => {
    const lastThree = selectMatches(
      MATCHES,
      { gameId: UNO, edition: null, period: { kind: 'last-months', months: 3 } },
      TODAY,
    );

    expect(lastThree.years).toEqual([2026, 2025]);
    expect(lastThree.games).toEqual([{ gameId: CATAN, matchCount: 1 }]);
    expect(lastThree.gameId).toBe(CATAN);
    expect(lastThree.matches.map((m) => m.date)).toEqual(['2026-11-10']);
    const empty = selectMatches(
      MATCHES,
      {
        gameId: null,
        edition: null,
        period: { kind: 'range', from: day('2020-01-01'), to: day('2020-12-31') },
      },
      TODAY,
    );
    expect(empty.matches).toEqual([]);
    expect(empty.games).toEqual([]);
    expect(empty.gameId).toBeNull();
  });
});
