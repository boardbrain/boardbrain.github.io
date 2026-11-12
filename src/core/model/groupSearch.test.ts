import { describe, expect, it } from 'vitest';
import type { Person } from './entities';
import type { Group } from './group';
import { findGroups } from './groupSearch';
import { toGroupId, toPersonId } from './ids';

const NOW = '2026-10-07T18:30:00.000Z';

function aPerson(index: number, name: string): Person {
  return {
    id: toPersonId(`00000000-0000-4000-8000-0000000002${String(index).padStart(2, '0')}`),
    name,
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function aGroup(index: number, name: string, members: readonly Person[]): Group {
  return {
    id: toGroupId(`00000000-0000-4000-8000-0000000003${String(index).padStart(2, '0')}`),
    name,
    archived: false,
    binding: { kind: 'global' },
    members: members.map((person) => ({ personId: person.id, groupColor: 'red' })),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

const anna = aPerson(1, 'Anna');
const ben = aPerson(2, 'Ben');
const clara = aPerson(3, 'Clara');
const persons = [anna, ben, clara];
const friday = aGroup(1, 'Freitagsrunde', [anna, ben]);
const family = aGroup(2, 'Familie', [ben, clara]);
const groups = [friday, family];

describe('US-VW-05 search for groups and persons', () => {
  it('returns all groups without a query, in the same order', () => {
    expect(findGroups(groups, persons, '').map((match) => match.group)).toEqual(groups);
    expect(findGroups(groups, persons, '   ').map((match) => match.group)).toEqual(groups);
  });

  it('finds a group by its name ignoring case', () => {
    expect(findGroups(groups, persons, 'FREI')).toEqual([{ group: friday, memberNames: [] }]);
  });

  it('finds the groups of a person and names the person', () => {
    expect(findGroups(groups, persons, 'anna')).toEqual([{ group: friday, memberNames: ['Anna'] }]);
    expect(findGroups(groups, persons, 'ben').map((match) => match.group)).toEqual(groups);
  });

  it('does not name members if the group name matched', () => {
    const annasGroup = aGroup(3, 'Annas Runde', [anna]);

    expect(findGroups([annasGroup], persons, 'anna')).toEqual([
      { group: annasGroup, memberNames: [] },
    ]);
  });

  it('names every matching member', () => {
    expect(findGroups([aGroup(4, 'Gruppe', [anna, clara])], persons, 'a')[0]?.memberNames).toEqual([
      'Anna',
      'Clara',
    ]);
  });

  it('finds nothing for an unknown text', () => {
    expect(findGroups(groups, persons, 'Zoe')).toEqual([]);
  });

  it('ignores members that are not in the person list', () => {
    expect(findGroups([friday], [ben], 'anna')).toEqual([]);
  });
});
