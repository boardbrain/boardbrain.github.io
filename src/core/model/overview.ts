import type { Person } from './entities';
import type { Group, GroupMember } from './group';
import type { PersonId } from './ids';
import { cleanName } from './names';

/**
 * A table of a person together with the person's seat (colours) at that table.
 */
export type PersonTable = {
  readonly group: Group;
  readonly member: GroupMember;
};

/**
 * The tables a person sits at, in the order of `groups` (US-VW-05 AK-1, AK-2, FA-VW-06).
 * Empty if the person is in no group.
 */
export function tablesOfPerson(groups: readonly Group[], personId: PersonId): PersonTable[] {
  return groups.flatMap((group) => {
    const member = group.members.find((candidate) => candidate.personId === personId);
    return member === undefined ? [] : [{ group, member }];
  });
}

/**
 * Number of different persons who share at least one table with the person (US-VW-05 AK-2,
 * personal page): someone at two common tables counts once.
 */
export function countFellowPlayers(groups: readonly Group[], personId: PersonId): number {
  const fellows = new Set<PersonId>();
  for (const { group } of tablesOfPerson(groups, personId)) {
    for (const member of group.members) {
      if (member.personId !== personId) {
        fellows.add(member.personId);
      }
    }
  }
  return fellows.size;
}

/**
 * Filters persons by a search text: a person matches if the name contains the text, ignoring
 * case and surrounding spaces. Without a text, all persons match; the order is kept.
 */
export function findPersons(persons: readonly Person[], query: string): Person[] {
  const needle = cleanName(query).toLocaleLowerCase('de-DE');
  if (needle === '') {
    return [...persons];
  }
  return persons.filter((person) =>
    cleanName(person.name).toLocaleLowerCase('de-DE').includes(needle),
  );
}
