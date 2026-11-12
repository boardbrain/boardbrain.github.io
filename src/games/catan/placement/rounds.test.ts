import { placementSchedule } from './schedule';
import { describe, expect, it } from 'vitest';
import { CATAN_EDITIONS, catanPlacementRounds } from './rounds';

describe('US-PL-02 Buildings per edition of Catan (Requirements 6.4)', () => {
  it('knows the editions base game and Cities & Knights', () => {
    expect(CATAN_EDITIONS).toEqual(['base', 'cities-and-knights']);
  });

  it('AK-2: in the base game every person places two settlements', () => {
    const schedule = placementSchedule(['A', 'B', 'C'], catanPlacementRounds('base'));

    expect(schedule).toHaveLength(6);
    expect(schedule.every((turn) => turn.type === 'settlement')).toBe(true);
    for (const person of ['A', 'B', 'C']) {
      expect(schedule.filter((turn) => turn.person === person)).toHaveLength(2);
    }
  });

  it('AK-2: with Cities & Knights a settlement forward and a city backward', () => {
    const schedule = placementSchedule(['A', 'B'], catanPlacementRounds('cities-and-knights'));

    expect(schedule).toEqual([
      { person: 'A', type: 'settlement' },
      { person: 'B', type: 'settlement' },
      { person: 'B', type: 'city' },
      { person: 'A', type: 'city' },
    ]);
  });
});
