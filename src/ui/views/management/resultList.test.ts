import { aMatch } from '@tests/support/resultFakes';
import { describe, expect, it } from 'vitest';
import {
  parseLocalDate,
  parseLocalTime,
  toMatchId,
  toPersonId,
  type LocalDate,
  type LocalTime,
  type Match,
} from '@/core/model';
import {
  dayHeading,
  daysNewestFirst,
  detailRows,
  durationText,
  namesText,
  scoreNote,
  winnerText,
} from './resultList';

function clock(text: string): LocalTime {
  const parsed = parseLocalTime(text);
  if (!parsed.ok) throw new Error(text);
  return parsed.value;
}

function day(text: string): LocalDate {
  const parsed = parseLocalDate(text);
  if (!parsed.ok) throw new Error(text);
  return parsed.value;
}

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const CLARA = toPersonId('00000000-0000-4000-8000-0000000000a3');
const DAVID = toPersonId('00000000-0000-4000-8000-0000000000a4');
const SEATS = [ANNA, BEN, CLARA, DAVID];

function match(id: number, date: string, fields: Partial<Match> = {}): Match {
  return aMatch({
    id: toMatchId(`00000000-0000-4000-8000-${String(id).padStart(12, '0')}`),
    date: day(date),
    ...fields,
  });
}

describe('US-ER-04 Results of a table (list)', () => {
  it('AK-1: newest first by day, the order of a day backwards (Specification 3.7)', () => {
    const oldestFirst = [
      match(1, '2026-11-14', { time: clock('18:30') }),
      match(2, '2026-11-14', { time: clock('20:10') }),
      match(3, '2026-11-14'),
      match(4, '2026-11-17', { time: clock('19:00') }),
    ];

    const days = daysNewestFirst(oldestFirst);

    expect(days.map((entry) => [entry.date, entry.matches.map((m) => m.id.slice(-1))])).toEqual([
      ['2026-11-17', ['4']],
      ['2026-11-14', ['3', '2', '1']],
    ]);
  });

  it('AK-1: no days without results', () => {
    expect(daysNewestFirst([])).toEqual([]);
  });

  it('AK-1: the heading of a day starts with a capital letter, as in the form', () => {
    const today = day('2026-11-17');

    expect(dayHeading(day('2026-11-17'), today)).toBe('Heute, 17.11.');
    expect(dayHeading(day('2026-11-16'), today)).toBe('Gestern, 16.11.');
    expect(dayHeading(day('2026-11-14'), today)).toBe('Sa, 14.11.');
    expect(dayHeading(day('2025-12-31'), today)).toBe('Mi, 31.12.2025');
  });

  it('AK-1: the winner or a draw', () => {
    expect(winnerText(['Clara'])).toBe('Clara gewinnt');
    expect(winnerText(['Ben', 'David'])).toBe('Unentschieden: Ben und David');
    expect(namesText(['Anna', 'Ben', 'David'])).toBe('Anna, Ben und David');
  });
});

describe('US-ER-04 AK-2 Details of a result', () => {
  it('US-ER-02 AK-5: places from points, the lowest first when the lowest wins', () => {
    const rows = detailRows(
      { winnerIds: [CLARA], scores: { [ANNA]: 34, [BEN]: 51, [CLARA]: 12, [DAVID]: 40 } },
      SEATS,
      'lowest-wins',
    );

    expect(rows).toEqual([
      { personId: CLARA, place: 1, isWinner: true },
      { personId: ANNA, place: 2, isWinner: false },
      { personId: DAVID, place: 3, isWinner: false },
      { personId: BEN, place: 4, isWinner: false },
    ]);
  });

  it('US-ER-06 AK-5: a ranking by hand, equal places in seat order (1, 2, 2, 4)', () => {
    const rows = detailRows(
      { winnerIds: [CLARA], places: { [ANNA]: 2, [BEN]: 2, [CLARA]: 1, [DAVID]: 4 } },
      SEATS,
      'highest-wins',
    );

    expect(rows.map((row) => [row.personId, row.place])).toEqual([
      [CLARA, 1],
      [ANNA, 2],
      [BEN, 2],
      [DAVID, 4],
    ]);
  });

  it('without places the winners first, the others in seat order without a place', () => {
    const rows = detailRows({ winnerIds: [BEN, DAVID] }, SEATS, null);

    expect(rows).toEqual([
      { personId: BEN, place: null, isWinner: true },
      { personId: DAVID, place: null, isWinner: true },
      { personId: ANNA, place: null, isWinner: false },
      { personId: CLARA, place: null, isWinner: false },
    ]);
  });

  it('says what the places come from', () => {
    expect(scoreNote({ scores: {} }, true, 'highest-wins')).toBe('Siegpunkte');
    expect(scoreNote({ scores: {} }, false, 'highest-wins')).toBe('Punkte');
    expect(scoreNote({ scores: {} }, false, 'lowest-wins')).toBe('Punkte · wenigste gewinnen');
    expect(scoreNote({ places: {} }, false, null)).toBe('Rangfolge');
    expect(scoreNote({}, false, null)).toBeNull();
  });

  it('shows a duration in hours and minutes', () => {
    expect(durationText(83)).toBe('1 h 23 min');
    expect(durationText(45)).toBe('45 min');
    expect(durationText(120)).toBe('2 h 0 min');
  });
});
