import { aGroup } from '@tests/support/masterDataFakes';
import { describe, expect, it } from 'vitest';
import { InvariantError } from '@/core/shared';
import { toPersonId } from './ids';
import { areMatchColorsValid, matchColorsOf, setMatchColor, type MatchColor } from './matchColors';

const anna = toPersonId('00000000-0000-4000-8000-0000000000a1');
const ben = toPersonId('00000000-0000-4000-8000-0000000000a2');
const clara = toPersonId('00000000-0000-4000-8000-0000000000a3');

const colors: MatchColor[] = [
  { personId: anna, catanColor: 'red' },
  { personId: ben, catanColor: 'blue' },
  { personId: clara, catanColor: 'white' },
];

describe('US-PG-04 Choose a different Catan colour for a match', () => {
  it('starts with the Catan colours of the group', () => {
    expect(matchColorsOf(aGroup())).toEqual([
      { personId: anna, catanColor: 'red' },
      { personId: ben, catanColor: 'blue' },
    ]);
  });

  it('throws for a group without Catan colours', () => {
    const group = aGroup({
      binding: { kind: 'global', excludesCatan: true },
      members: [
        { personId: anna, groupColor: 'red' },
        { personId: ben, groupColor: 'blue' },
      ],
    });

    expect(() => matchColorsOf(group)).toThrow(InvariantError);
  });

  it('AK-1: changes the colour of one person and leaves the group unchanged', () => {
    const group = aGroup();
    const changed = setMatchColor(matchColorsOf(group), anna, 'orange');

    expect(changed).toEqual([
      { personId: anna, catanColor: 'orange' },
      { personId: ben, catanColor: 'blue' },
    ]);
    expect(group).toEqual(aGroup());
  });

  it('AK-2: swaps with the person who already has the colour in this match', () => {
    expect(setMatchColor(colors, clara, 'red')).toEqual([
      { personId: anna, catanColor: 'white' },
      { personId: ben, catanColor: 'blue' },
      { personId: clara, catanColor: 'red' },
    ]);
  });

  it('keeps everything when the person chooses her own colour', () => {
    expect(setMatchColor(colors, ben, 'blue')).toEqual(colors);
  });

  it('throws for a person who does not take part', () => {
    expect(() =>
      setMatchColor(colors, toPersonId('00000000-0000-4000-8000-0000000000a9'), 'red'),
    ).toThrow(InvariantError);
  });

  it('accepts only distinct colours of exactly the participants in their order', () => {
    expect(areMatchColorsValid(colors, [anna, ben, clara])).toBe(true);
    expect(areMatchColorsValid(colors, [ben, anna, clara])).toBe(false);
    expect(areMatchColorsValid(colors, [anna, ben])).toBe(false);
    expect(
      areMatchColorsValid(
        [
          { personId: anna, catanColor: 'red' },
          { personId: ben, catanColor: 'red' },
        ],
        [anna, ben],
      ),
    ).toBe(false);
  });
});
