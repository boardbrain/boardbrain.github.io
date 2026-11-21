import { describe, expect, it } from 'vitest';
import { parseLocalDate, toGameId, type LocalDate } from '@/core/model';
import { playedGames } from './played';

const SKYJO = toGameId('00000000-0000-4000-8000-0000000000b1');
const UNO = toGameId('00000000-0000-4000-8000-0000000000b2');

function day(value: string): LocalDate {
  const parsed = parseLocalDate(value);
  if (!parsed.ok) throw new Error(value);
  return parsed.value;
}

describe('US-SP-01 played games for the game list (design I3-B)', () => {
  it('counts the matches and keeps the latest day of each game', () => {
    const played = playedGames([
      { gameId: SKYJO, date: day('2026-11-01') },
      { gameId: UNO, date: day('2026-10-20') },
      { gameId: SKYJO, date: day('2026-11-17') },
      { gameId: SKYJO, date: day('2026-09-30') },
    ]);

    expect(played.get(SKYJO)).toEqual({ matches: 3, lastDate: '2026-11-17' });
    expect(played.get(UNO)).toEqual({ matches: 1, lastDate: '2026-10-20' });
  });

  it('leaves out games without matches', () => {
    expect(playedGames([]).size).toBe(0);
  });
});
