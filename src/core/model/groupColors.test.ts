import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CATAN_COLOR_KEYS, GROUP_COLOR_KEYS } from './colors';
import {
  colorSchemeOf,
  type ColorScheme,
  defaultColors,
  normalizeColors,
  setMemberColor,
  type MemberColors,
} from './groupColors';

const FC_SEED = 20261007;

describe('Specification 3.3 colour scheme', () => {
  it.each([
    ['global group with 2 members', 2, null, 'both'],
    ['global group with 4 members', 4, null, 'both'],
    ['global group with 5 members', 5, null, 'group-only'],
    ['group bound to Catan', 3, { hasPlayerColors: true }, 'catan-only'],
    ['group bound to a custom game', 3, { hasPlayerColors: false }, 'group-only'],
    ['group of 12 bound to a custom game', 12, { hasPlayerColors: false }, 'group-only'],
  ] as const)('%s', (_case, memberCount, boundGame, expected) => {
    expect(colorSchemeOf({ memberCount, boundGame, maxPlayersWithColors: 4 })).toBe(expected);
  });
});

describe('E-27 global group that excludes Catan', () => {
  it.each([2, 3, 4])('US-PG-03 AK-4: has only group colours with %i members', (memberCount) => {
    expect(
      colorSchemeOf({ memberCount, boundGame: null, maxPlayersWithColors: 4, excludesCatan: true }),
    ).toBe('group-only');
  });

  it('keeps the Catan colours of a global group that does not exclude Catan', () => {
    expect(
      colorSchemeOf({
        memberCount: 3,
        boundGame: null,
        maxPlayersWithColors: 4,
        excludesCatan: false,
      }),
    ).toBe('both');
  });

  it('drops the Catan colours when Catan is excluded and brings them back (US-VW-02 AK-6)', () => {
    const both = defaultColors(3, 'both');

    const excluded = normalizeColors(both, 'group-only');
    expect(excluded.every((member) => member.catanColor === undefined)).toBe(true);
    expect(excluded.map((member) => member.groupColor)).toEqual(
      both.map((member) => member.groupColor),
    );

    expect(normalizeColors(excluded, 'both').map((member) => member.catanColor)).toEqual([
      'red',
      'blue',
      'white',
    ]);
  });
});

describe('E-28 palette', () => {
  it('has 12 different group colours and starts with four colour families', () => {
    expect(new Set(GROUP_COLOR_KEYS).size).toBe(12);
    expect(GROUP_COLOR_KEYS.slice(0, 4)).toEqual(['red', 'blue', 'yellow', 'green']);
  });

  it('contains the four Catan colours', () => {
    for (const key of CATAN_COLOR_KEYS) {
      expect(GROUP_COLOR_KEYS).toContain(key);
    }
  });
});

describe('US-PG-03 automatic colours', () => {
  it('AK-1: assigns the colours of a new group in the order of the palette', () => {
    expect(defaultColors(3, 'group-only')).toEqual([
      { groupColor: 'red' },
      { groupColor: 'blue' },
      { groupColor: 'yellow' },
    ]);
  });

  it('AK-1: the first four group colours come from four different colour families', () => {
    expect(GROUP_COLOR_KEYS.slice(0, 4)).toEqual(['red', 'blue', 'yellow', 'green']);
  });

  it('AK-1: similar colours are at least three places apart in the order', () => {
    const distance = (a: string, b: string): number =>
      Math.abs(
        GROUP_COLOR_KEYS.findIndex((key) => key === a) -
          GROUP_COLOR_KEYS.findIndex((key) => key === b),
      );

    expect(distance('blue', 'indigo')).toBeGreaterThanOrEqual(3);
    expect(distance('green', 'teal')).toBeGreaterThanOrEqual(3);
    expect(distance('red', 'orange')).toBeGreaterThanOrEqual(3);
    expect(distance('yellow', 'orange')).toBeGreaterThanOrEqual(3);
    expect(distance('magenta', 'pink')).toBeGreaterThanOrEqual(2);
  });

  it('AK-2: a global group of 2 to 4 members has a group colour and a Catan colour each', () => {
    expect(defaultColors(2, 'both')).toEqual([
      { groupColor: 'red', catanColor: 'red' },
      { groupColor: 'blue', catanColor: 'blue' },
    ]);
  });

  it('AK-2: group colour and Catan colour may be the same tone', () => {
    const [first] = defaultColors(2, 'both');
    expect(first?.groupColor).toBe(first?.catanColor);
  });

  it('AK-3: in a group bound to Catan the Catan colour is the group colour', () => {
    const colors = defaultColors(4, 'catan-only');

    expect(colors.map((member) => member.catanColor)).toEqual([...CATAN_COLOR_KEYS]);
    expect(colors.every((member) => member.groupColor === member.catanColor)).toBe(true);
  });

  it('AK-4: a group of more than 4 members or bound to an own game has no Catan colour', () => {
    const colors = defaultColors(5, 'group-only');

    expect(colors).toHaveLength(5);
    expect(colors.every((member) => member.catanColor === undefined)).toBe(true);
  });

  it('supplies all 12 colours uniquely to a group of 12', () => {
    const colors = defaultColors(12, 'group-only');

    expect(new Set(colors.map((member) => member.groupColor)).size).toBe(12);
  });

  it('keeps the colours that are already assigned when a member is added', () => {
    const before: MemberColors[] = [
      { groupColor: 'green', catanColor: 'white' },
      { groupColor: 'red', catanColor: 'red' },
    ];

    const after = normalizeColors([...before, {}], 'both');

    expect(after.slice(0, 2)).toEqual(before);
    expect(after[2]).toEqual({ groupColor: 'blue', catanColor: 'blue' });
  });

  it('drops the Catan colours when the group grows beyond 4 and brings them back', () => {
    const four = defaultColors(4, 'both');

    const five = normalizeColors([...four, {}], 'group-only');
    expect(five.every((member) => member.catanColor === undefined)).toBe(true);
    expect(five.slice(0, 4).map((member) => member.groupColor)).toEqual(
      four.map((member) => member.groupColor),
    );

    const backToFour = normalizeColors(five.slice(0, 4), 'both');
    expect(new Set(backToFour.map((member) => member.catanColor)).size).toBe(4);
  });

  it('replaces a colour that occurs twice at the second member', () => {
    const result = normalizeColors([{ groupColor: 'red' }, { groupColor: 'red' }], 'group-only');

    expect(result.map((member) => member.groupColor)).toEqual(['red', 'blue']);
  });

  it('is always unique and complete (property)', () => {
    const scheme = fc.constantFrom<ColorScheme>('both', 'catan-only', 'group-only');
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4 }), scheme, (count, chosen) => {
        const colors = defaultColors(count, chosen);
        expect(new Set(colors.map((member) => member.groupColor)).size).toBe(count);
        const catanColors = colors.flatMap((member) =>
          member.catanColor ? [member.catanColor] : [],
        );
        expect(new Set(catanColors).size).toBe(chosen === 'group-only' ? 0 : count);
      }),
      { seed: FC_SEED },
    );
  });
});

describe('US-PG-03 AK-5: swap on conflict', () => {
  it('gives person B red and A the previous colour of B', () => {
    const colors = defaultColors(3, 'group-only'); // red, blue, yellow

    const result = setMemberColor(colors, 1, 'group', 'red', 'group-only');

    expect(result.map((member) => member.groupColor)).toEqual(['blue', 'red', 'yellow']);
  });

  it('assigns a free colour without changing anybody else', () => {
    const colors = defaultColors(2, 'group-only');

    const result = setMemberColor(colors, 0, 'group', 'pink', 'group-only');

    expect(result.map((member) => member.groupColor)).toEqual(['pink', 'blue']);
  });

  it('swaps Catan colours independently of the group colours', () => {
    const colors = defaultColors(3, 'both'); // Catan: red, blue, white

    const result = setMemberColor(colors, 0, 'catan', 'blue', 'both');

    expect(result.map((member) => member.catanColor)).toEqual(['blue', 'red', 'white']);
    expect(result.map((member) => member.groupColor)).toEqual(['red', 'blue', 'yellow']);
  });

  it('moves the group colour with the Catan colour in a group bound to Catan', () => {
    const colors = defaultColors(2, 'catan-only');

    const result = setMemberColor(colors, 0, 'catan', 'blue', 'catan-only');

    expect(result).toEqual([
      { groupColor: 'blue', catanColor: 'blue' },
      { groupColor: 'red', catanColor: 'red' },
    ]);
  });

  it('treats a group colour request as a Catan colour request in a group bound to Catan', () => {
    const colors = defaultColors(2, 'catan-only');

    const result = setMemberColor(colors, 1, 'group', 'orange', 'catan-only');

    expect(result[1]).toEqual({ groupColor: 'orange', catanColor: 'orange' });
  });

  it('ignores a Catan colour request in a scheme without Catan colours', () => {
    const colors = defaultColors(2, 'group-only');

    expect(setMemberColor(colors, 0, 'catan', 'blue', 'group-only')).toEqual(colors);
  });

  it('ignores a colour that is no Catan colour for the Catan palette', () => {
    const colors = defaultColors(2, 'both');

    expect(setMemberColor(colors, 0, 'catan', 'pink', 'both')).toEqual(colors);
  });

  it('ignores an unknown member', () => {
    const colors = defaultColors(2, 'group-only');

    expect(setMemberColor(colors, 5, 'group', 'pink', 'group-only')).toEqual(colors);
  });

  it('keeps all colours unique after any sequence of changes (property)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            index: fc.integer({ min: 0, max: 5 }),
            color: fc.constantFrom(...GROUP_COLOR_KEYS),
          }),
          { maxLength: 20 },
        ),
        (changes) => {
          let colors = defaultColors(6, 'group-only');
          for (const change of changes) {
            colors = setMemberColor(colors, change.index, 'group', change.color, 'group-only');
          }
          expect(new Set(colors.map((member) => member.groupColor)).size).toBe(6);
        },
      ),
      { seed: FC_SEED },
    );
  });
});
