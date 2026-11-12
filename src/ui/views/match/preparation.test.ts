import { aCatanSetup, CATAN_TEST_PERSONS } from '@tests/support/catanGeneration';
import { defined } from '@tests/support/defined';
import { aGroup } from '@tests/support/masterDataFakes';
import { describe, expect, it } from 'vitest';
import type { CatanPreparation } from '@/app/services/sessionService';
import { toGroupId, type PersonId } from '@/core/model';
import { CATAN_DEFAULT_OPTIONS } from '@/games/catan';
import {
  chooseColor,
  enabledDraws,
  isColorChanged,
  isOrderComplete,
  preparationFor,
  startInputOf,
  tapForOrder,
  type MatchPreparation,
} from './preparation';

const person = (index: number): PersonId => defined(CATAN_TEST_PERSONS[index], 'person');
const [ANNA, BEN, CLARA, DAVID] = [person(0), person(1), person(2), person(3)];
const BASE: CatanPreparation = {
  groupId: aGroup().id,
  participants: CATAN_TEST_PERSONS,
  options: CATAN_DEFAULT_OPTIONS,
  colors: aCatanSetup(4).colors,
};

function manual(): MatchPreparation {
  return { ...preparationFor(BASE, null), isOrderDrawn: false, orderAlternative: 'manual' };
}

describe('US-AB-01 prepare a match', () => {
  it('AK-3, AK-4: starts with the options of the table and the order drawn', () => {
    expect(preparationFor(BASE, null)).toEqual({
      base: BASE,
      edition: 'base',
      personDraws: { landscapes: true, harbors: true, numbers: true },
      isOrderDrawn: true,
      orderAlternative: 'manual',
      manualOrder: [],
      hasStartingResources: false,
      resourceCount: 2,
      replacement: 'with',
      colors: BASE.colors,
    });
  });

  it('keeps the options for another table, colours and an order set by hand start again', () => {
    const changed = chooseColor(tapForOrder(manual(), BEN), ANNA, 'orange');
    const other: CatanPreparation = {
      ...BASE,
      groupId: toGroupId('00000000-0000-4000-8000-0000000000c7'),
    };

    const next = preparationFor(other, { ...changed, edition: 'cities-and-knights' });

    expect(next).toMatchObject({
      base: other,
      edition: 'cities-and-knights',
      isOrderDrawn: false,
      manualOrder: [],
      colors: other.colors,
    });
  });
});

describe('FA-LS-07 order set by hand', () => {
  it('AK-3: gives the next place to each person tapped', () => {
    const tapped = tapForOrder(tapForOrder(manual(), CLARA), ANNA);

    expect(tapped.manualOrder).toEqual([CLARA, ANNA]);
    expect(isOrderComplete(tapped)).toBe(false);
  });

  it('AK-3: the last place follows from the others', () => {
    const tapped = tapForOrder(tapForOrder(tapForOrder(manual(), DAVID), CLARA), BEN);

    expect(tapped.manualOrder).toEqual([DAVID, CLARA, BEN, ANNA]);
    expect(isOrderComplete(tapped)).toBe(true);
  });

  it('AK-3: tapping a placed person takes them back with everyone after them', () => {
    const tapped = tapForOrder(tapForOrder(tapForOrder(manual(), DAVID), CLARA), BEN);

    expect(tapForOrder(tapped, CLARA).manualOrder).toEqual([DAVID]);
  });

  it('the options are complete with the order drawn or without placement', () => {
    expect(isOrderComplete(preparationFor(BASE, null))).toBe(true);
    expect(isOrderComplete({ ...manual(), orderAlternative: 'none' })).toBe(true);
  });
});

describe('US-PG-04 colours of the match', () => {
  it('AK-2: a taken colour swaps and both count as changed', () => {
    const changed = chooseColor(preparationFor(BASE, null), ANNA, 'blue');

    expect(changed.colors.map((color) => color.catanColor)).toEqual([
      'blue',
      'red',
      'white',
      'orange',
    ]);
    expect(isColorChanged(changed, ANNA)).toBe(true);
    expect(isColorChanged(changed, BEN)).toBe(true);
    expect(isColorChanged(changed, CLARA)).toBe(false);
  });
});

describe('US-LS-02 draws of a person', () => {
  it('AK-1: lists the draws switched on in the order of the flow', () => {
    const preparation = {
      ...preparationFor(BASE, null),
      personDraws: { landscapes: true, harbors: false, numbers: true },
    };

    expect(enabledDraws(preparation)).toEqual(['landscapes', 'numbers']);
  });
});

describe('Specification 3.5 start the generation', () => {
  it('passes the order drawn and no starting resources', () => {
    expect(startInputOf(preparationFor(BASE, null))).toEqual({
      groupId: BASE.groupId,
      options: CATAN_DEFAULT_OPTIONS,
      colors: BASE.colors,
    });
  });

  it('FA-LS-07: passes an order set by hand or none', () => {
    const tapped = tapForOrder(tapForOrder(tapForOrder(manual(), DAVID), CLARA), BEN);

    expect(startInputOf(tapped).options.order).toEqual({
      mode: 'manual',
      order: [DAVID, CLARA, BEN, ANNA],
    });
    expect(startInputOf({ ...tapped, orderAlternative: 'none' }).options.order).toEqual({
      mode: 'none',
    });
  });

  it('US-AB-01 AK-4: passes the starting resources switched on', () => {
    const preparation = {
      ...preparationFor(BASE, null),
      hasStartingResources: true,
      resourceCount: 3,
      replacement: 'without' as const,
    };

    expect(startInputOf(preparation).options.startingResources).toEqual({
      count: 3,
      replacement: 'without',
    });
  });
});
