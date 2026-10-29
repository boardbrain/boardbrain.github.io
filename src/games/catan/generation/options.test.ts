import { describe, expect, it } from 'vitest';
import {
  areCatanOptionsValid,
  CATAN_DEFAULT_OPTIONS,
  CATAN_DEFAULT_STARTING_RESOURCES,
  enabledPersonDraws,
} from './options';

describe('US-SP-04 and US-AB-01 Options of a Catan match', () => {
  it('US-SP-04 AK-1, AK-2: base game and mode "Standard" are preselected', () => {
    expect(CATAN_DEFAULT_OPTIONS).toMatchObject({ edition: 'base', mode: 'standard' });
  });

  it('US-AB-01 AK-3: LS-01, LS-03 and LS-04 are on by default and can be switched off', () => {
    expect(enabledPersonDraws(CATAN_DEFAULT_OPTIONS)).toEqual(['landscapes', 'harbors', 'numbers']);
    expect(
      enabledPersonDraws({
        ...CATAN_DEFAULT_OPTIONS,
        personDraws: { landscapes: false, harbors: true, numbers: false },
      }),
    ).toEqual(['harbors']);
  });

  it('US-AB-01 AK-4: no starting resources by default; once on, 2 with replacement', () => {
    expect(CATAN_DEFAULT_OPTIONS.startingResources).toBeNull();
    expect(CATAN_DEFAULT_STARTING_RESOURCES).toEqual({ count: 2, replacement: 'with' });
  });

  it('accepts complete options in range', () => {
    expect(areCatanOptionsValid(CATAN_DEFAULT_OPTIONS)).toBe(true);
    expect(
      areCatanOptionsValid({
        ...CATAN_DEFAULT_OPTIONS,
        edition: 'cities-and-knights',
        startingResources: { count: 5, replacement: 'without' },
      }),
    ).toBe(true);
  });

  it('rejects starting resources outside 1 to 5', () => {
    for (const count of [0, 6, 1.5]) {
      expect(
        areCatanOptionsValid({
          ...CATAN_DEFAULT_OPTIONS,
          startingResources: { count, replacement: 'with' },
        }),
      ).toBe(false);
    }
  });
});
