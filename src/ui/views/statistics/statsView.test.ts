import { describe, expect, it } from 'vitest';
import { parseLocalDate, type LocalDate } from '@/core/model';
import { assert } from '@/core/shared';
import type { StatsPeriod } from '@/core/stats';
import { CATAN_GAME_ID } from '@/games/catan';
import {
  averageText,
  criterionText,
  matchCountText,
  percentText,
  periodLabel,
  periodParam,
  readStatsParams,
  runText,
  runUnit,
  spanText,
  winsText,
  writeStatsParams,
} from './statsView';

function day(text: string): LocalDate {
  const parsed = parseLocalDate(text);
  assert(parsed.ok, 'a calendar day');
  return parsed.value;
}

describe('Design I3-D the filter in the address', () => {
  const periods: readonly StatsPeriod[] = [
    { kind: 'all' },
    { kind: 'year', year: 2025 },
    { kind: 'last-months', months: 3 },
    { kind: 'last-months', months: 12 },
    { kind: 'range', from: day('2026-03-01'), to: day('2026-03-31') },
  ];

  it.each(periods)('a period survives the way through the address: %o', (period) => {
    const params = writeStatsParams(new URLSearchParams(), { period });
    expect(readStatsParams(params).request.period).toEqual(period);
  });

  it('a period in the address is short and absent for all matches', () => {
    expect(periods.map(periodParam)).toEqual([null, '2025', '3m', '12m', '2026-03-01_2026-03-31']);
  });

  it('anything unknown in the address means all matches and wins', () => {
    const { request, criterion } = readStatsParams(
      new URLSearchParams('spiel=x&zeitraum=2026-02-30_2026-03-01&nach=gestern'),
    );
    expect(request).toEqual({ gameId: null, edition: null, period: { kind: 'all' } });
    expect(criterion).toBe('wins');
  });

  it('another game starts with all its editions and keeps the other parameters', () => {
    const params = writeStatsParams(
      new URLSearchParams('reiter=statistik&version=base&nach=platz'),
      {
        gameId: CATAN_GAME_ID,
      },
    );
    expect(params.toString()).toBe(`reiter=statistik&nach=platz&spiel=${CATAN_GAME_ID}`);
  });

  it('wins as criterion and all matches leave the address clean', () => {
    const params = writeStatsParams(new URLSearchParams('nach=serie&zeitraum=2025'), {
      criterion: 'wins',
      period: { kind: 'all' },
    });
    expect(params.toString()).toBe('');
  });
});

describe('Design I3-D texts of the statistics', () => {
  it('names the period', () => {
    expect(periodLabel({ kind: 'all' })).toBe('Gesamt');
    expect(periodLabel({ kind: 'last-months', months: 3 })).toBe('Letzte 3 Monate');
    expect(periodLabel({ kind: 'last-months', months: 12 })).toBe('Letzte 12 Monate');
    expect(periodLabel({ kind: 'year', year: 2026 })).toBe('2026');
  });

  it('writes a span with the year once, across years twice and one day alone', () => {
    expect(spanText(day('2026-03-01'), day('2026-03-31'))).toBe('01.03. – 31.03.2026');
    expect(spanText(day('2025-12-20'), day('2026-01-06'))).toBe('20.12.2025 – 06.01.2026');
    expect(spanText(day('2026-03-01'), day('2026-03-01'))).toBe('01.03.2026');
  });

  it('a running series counts "since" its first match', () => {
    const run = { length: 3, firstDate: day('2026-03-01'), lastDate: day('2026-04-01') };
    expect(runText({ ...run, isOngoing: true })).toBe('seit 01.03.2026');
    expect(runText({ ...run, isOngoing: false })).toBe('01.03. – 01.04.2026');
  });

  it('E-57: a series shows no unit for 0, "Sieg" for 1 and "Siege in Folge" from 2', () => {
    expect([0, 1, 2, 7].map(runUnit)).toEqual(['', 'Sieg', 'Siege in Folge', 'Siege in Folge']);
  });

  it('counts in singular and plural, averages with one decimal and rates in whole percent', () => {
    expect([matchCountText(1), matchCountText(12)]).toEqual(['1 Partie', '12 Partien']);
    expect([winsText(1), winsText(0), winsText(19)]).toEqual(['1 Sieg', '0 Siege', '19 Siege']);
    expect([averageText(2), averageText(8.44), averageText(null)]).toEqual(['2,0', '8,4', '–']);
    expect(percentText(2 / 3)).toBe('67 %');
  });

  it('average points of Catan are victory points', () => {
    expect(criterionText('average-score', CATAN_GAME_ID)).toBe('Ø Siegpunkte');
    expect(criterionText('average-score', null)).toBe('Ø Punkte');
  });
});
