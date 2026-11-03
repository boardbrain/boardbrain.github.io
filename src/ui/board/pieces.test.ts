import { describe, expect, it } from 'vitest';
import { buildingPath, roadLine } from './pieces';

describe('US-PL-04 pieces on the board', () => {
  it('AK-2: a settlement is a house around its vertex', () => {
    expect(buildingPath('settlement', { x: 10, y: 20 })).toBe('M7 22.4V19.55L10 17L13 19.55V22.4Z');
  });

  it('AK-2: a city is a house with a tower, wider than a settlement', () => {
    const city = buildingPath('city', { x: 0, y: 0 });
    const xs = [...city.matchAll(/[MLH](-?[\d.]+)/g)].map((match) => Number(match[1]));

    expect(city).not.toBe(buildingPath('settlement', { x: 0, y: 0 }));
    expect(Math.min(...xs)).toBeLessThan(-3);
    expect(city).toContain('H3.94');
  });

  it('R1: a road covers 34 % to 86 % of its edge, from the building outwards', () => {
    expect(roadLine({ x: 0, y: 0 }, { x: 100, y: -50 })).toEqual({
      start: { x: 34, y: -17 },
      end: { x: 86, y: -43 },
    });
  });
});
