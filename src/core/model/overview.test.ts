import { describe, expect, it } from 'vitest';
import type { Person } from './entities';
import type { Group } from './group';
import { toGroupId, toPersonId } from './ids';
import { countFellowPlayers, findPersons, tablesOfPerson } from './overview';

const NOW = '2026-10-07T18:30:00.000Z';

function aPerson(index: number, name: string): Person {
  return {
    id: toPersonId(`00000000-0000-4000-8000-0000000004${String(index).padStart(2, '0')}`),
    name,
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function aGroup(index: number, name: string, members: readonly Person[]): Group {
  const colors = ['red', 'blue', 'yellow'] as const;
  return {
    id: toGroupId(`00000000-0000-4000-8000-0000000005${String(index).padStart(2, '0')}`),
    name,
    archived: false,
    binding: { kind: 'global' },
    members: members.map((person, position) => ({
      personId: person.id,
      groupColor: colors[position] ?? 'gray',
    })),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

const anna = aPerson(1, 'Anna');
const ben = aPerson(2, 'Ben');
const clara = aPerson(3, 'Clara');
const zoe = aPerson(4, 'Zoe');
const friday = aGroup(1, 'Freitagsrunde', [anna, ben]);
const family = aGroup(2, 'Familie', [clara, ben, anna]);
const kids = aGroup(3, 'Kinder', [clara, ben]);
const groups = [friday, family, kids];

describe('US-VW-05 tables of a person', () => {
  it('AK-1: returns the tables of the person in the given order with the seat colours', () => {
    expect(tablesOfPerson(groups, anna.id)).toEqual([
      { group: friday, member: { personId: anna.id, groupColor: 'red' } },
      { group: family, member: { personId: anna.id, groupColor: 'yellow' } },
    ]);
  });

  it('AK-1: returns no tables for a person who sits at none', () => {
    expect(tablesOfPerson(groups, zoe.id)).toEqual([]);
  });
});

describe('US-VW-05 fellow players of a person', () => {
  it('AK-2: counts every fellow player once, even at several common tables', () => {
    // Ben sits with Anna (Freitagsrunde, Familie) and Clara (Familie, Kinder).
    expect(countFellowPlayers(groups, ben.id)).toBe(2);
  });

  it('AK-2: counts no fellow players for a person without a table', () => {
    expect(countFellowPlayers(groups, zoe.id)).toBe(0);
  });
});

describe('US-VW-05 search for persons', () => {
  const persons = [anna, ben, clara];

  it('returns all persons in the same order without a query', () => {
    expect(findPersons(persons, '   ')).toEqual(persons);
  });

  it('finds persons by part of the name, ignoring case and surrounding spaces', () => {
    expect(findPersons(persons, ' AN ')).toEqual([anna]);
    expect(findPersons(persons, 'a')).toEqual([anna, clara]);
  });

  it('returns nothing when no name matches', () => {
    expect(findPersons(persons, 'Xaver')).toEqual([]);
  });
});
