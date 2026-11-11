import { aCatanSetup, CATAN_TEST_PERSONS } from '@tests/support/catanGeneration';
import { aSessionAfter } from '@tests/support/sessionFakes';
import { describe, expect, it } from 'vitest';
import type { PersonId } from '@/core/model';
import { matchBoardPieces, pieceMarking } from './boardPieces';

// Cities & Knights with four persons, complete: 3 draws (0–2), 3 spins (3–5), then building k at
// step 6 + 2k and its road at step 7 + 2k; settlements 0–3, cities 4–7.
const KNIGHTS = aCatanSetup(4, { edition: 'cities-and-knights' });
const COMPLETE = aSessionAfter(KNIGHTS, 22);
const NAMES = new Map(
  CATAN_TEST_PERSONS.map((person, index) => [person, `Person ${String(index)}`]),
);

function nameOf(personId: PersonId): string {
  return NAMES.get(personId) ?? '';
}

describe('US-AB-03 AK-8 pieces of a match on the board (design I2-H)', () => {
  it('names every piece for repeating it and knows its step', () => {
    const pieces = matchBoardPieces(COMPLETE, nameOf);

    expect(pieces.buildings).toHaveLength(8);
    expect(pieces.roads).toHaveLength(8);
    expect(pieces.buildings[0]?.label).toMatch(/^Siedlung von Person \d wiederholen$/);
    expect(pieces.buildings[7]?.label).toMatch(/^Stadt von Person \d wiederholen$/);
    expect(pieces.roads[0]?.label).toMatch(/^Straße von Person \d wiederholen$/);
    expect(pieces.stepOf.get('building-0')).toBe(6);
    expect(pieces.stepOf.get('road-0')).toBe(7);
    expect(pieces.stepOf.get('building-7')).toBe(20);
  });

  it('has no pieces before the placement', () => {
    const pieces = matchBoardPieces(aSessionAfter(KNIGHTS, 6), nameOf);

    expect(pieces.buildings).toEqual([]);
    expect(pieces.roads).toEqual([]);
  });

  it('AK-3: a road is marked alone', () => {
    expect(pieceMarking(COMPLETE, 9)).toEqual({ main: 'road-1', others: [] });
  });

  it('AK-4: a building is marked with its road and all later pieces', () => {
    expect(pieceMarking(COMPLETE, 18)).toEqual({
      main: 'building-6',
      others: ['road-6', 'building-7', 'road-7'],
    });
  });

  it('marks nothing for a step that is no piece', () => {
    expect(pieceMarking(COMPLETE, 3)).toBeNull();
    expect(pieceMarking(COMPLETE, 99)).toBeNull();
  });
});
