import { describe, expect, it } from 'vitest';
import { cleanName, containsName, isBlankName, isSameName, sortByName } from './names';

describe('Specification 3.4 names', () => {
  it('removes spaces at the start and end for the stored form', () => {
    expect(cleanName('  Anna Maria \t')).toBe('Anna Maria');
  });

  it('normalises composed and decomposed umlauts to the same stored form', () => {
    expect(cleanName('Jörg')).toBe('Jörg');
  });

  it.each(['', '   ', '\t\n'])('US-PG-01 AK-2: treats %j as blank', (name) => {
    expect(isBlankName(name)).toBe(true);
  });

  it('does not treat a name with letters as blank', () => {
    expect(isBlankName(' A ')).toBe(false);
  });

  it('US-PG-01 AK-3: compares names ignoring case and outer spaces', () => {
    expect(isSameName('Anna', '  aNNa ')).toBe(true);
    expect(isSameName('Jörg', 'JÖRG')).toBe(true);
    expect(isSameName('Jörg', 'Jörg')).toBe(true);
  });

  it('distinguishes names that differ in their letters or inner spaces', () => {
    expect(isSameName('Anna', 'Anne')).toBe(false);
    expect(isSameName('Anna Maria', 'AnnaMaria')).toBe(false);
  });

  it('US-SP-02 AK-2: finds a name in a list in the same way', () => {
    expect(containsName(['Uno', 'Catan'], 'catan')).toBe(true);
    expect(containsName(['Uno', 'Catan'], 'Skat')).toBe(false);
    expect(containsName([], 'Uno')).toBe(false);
  });

  it('sorts alphabetically in German order, ignoring case, with numbers by value', () => {
    const items = ['zoe', 'Ärger', 'anna', 'Spiel 10', 'Spiel 2', 'Bernd'].map((name) => ({
      name,
    }));

    expect(sortByName(items).map((item) => item.name)).toEqual([
      'anna',
      'Ärger',
      'Bernd',
      'Spiel 2',
      'Spiel 10',
      'zoe',
    ]);
  });

  it('does not change the given list when sorting', () => {
    const items = [{ name: 'b' }, { name: 'a' }];

    sortByName(items);

    expect(items).toEqual([{ name: 'b' }, { name: 'a' }]);
  });
});
