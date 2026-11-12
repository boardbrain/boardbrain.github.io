import { describe, expect, it } from 'vitest';
import { placementSchedule } from './schedule';

describe('US-PL-02 Placement schedule', () => {
  it('AK-1: places in the order P1 … Pn, Pn … P1', () => {
    const schedule = placementSchedule(['P1', 'P2', 'P3', 'P4'], ['settlement', 'settlement']);

    expect(schedule.map((turn) => turn.person)).toEqual([
      'P1',
      'P2',
      'P3',
      'P4',
      'P4',
      'P3',
      'P2',
      'P1',
    ]);
  });

  it('AK-1: works for 2 and 3 persons', () => {
    expect(
      placementSchedule(['A', 'B'], ['settlement', 'settlement']).map((turn) => turn.person),
    ).toEqual(['A', 'B', 'B', 'A']);
    expect(
      placementSchedule(['A', 'B', 'C'], ['settlement', 'settlement']).map((turn) => turn.person),
    ).toEqual(['A', 'B', 'C', 'C', 'B', 'A']);
  });

  it('AK-2: gives every turn the building type of its round', () => {
    const schedule = placementSchedule(['A', 'B'], ['settlement', 'city']);

    expect(schedule).toEqual([
      { person: 'A', type: 'settlement' },
      { person: 'B', type: 'settlement' },
      { person: 'B', type: 'city' },
      { person: 'A', type: 'city' },
    ]);
  });

  it('alternates the direction for further rounds and leaves the order unchanged', () => {
    const order = Object.freeze(['A', 'B']);

    const schedule = placementSchedule(order, ['settlement', 'settlement', 'city']);

    expect(schedule.map((turn) => turn.person)).toEqual(['A', 'B', 'B', 'A', 'A', 'B']);
    expect(order).toEqual(['A', 'B']);
  });
});
