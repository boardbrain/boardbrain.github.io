import type { Person } from './entities';
import type { Group } from './group';
import { cleanName } from './names';

/**
 * A group that matches a search, with the members whose names matched when the group name did
 * not (US-VW-05, Architecture 13.1).
 */
export type GroupMatch = {
  readonly group: Group;
  /** Names of the matching members; empty if the group name matched or there was no query. */
  readonly memberNames: readonly string[];
};

function normalized(text: string): string {
  return cleanName(text).toLocaleLowerCase('de-DE');
}

/**
 * Filters groups by a search text: a group matches if its name or the name of one of its
 * members contains the text, ignoring case and surrounding spaces. Without a text, all groups
 * match. The order of the groups is kept.
 */
export function findGroups(
  groups: readonly Group[],
  persons: readonly Person[],
  query: string,
): GroupMatch[] {
  const needle = normalized(query);
  if (needle === '') {
    return groups.map((group) => ({ group, memberNames: [] }));
  }
  const matches: GroupMatch[] = [];
  for (const group of groups) {
    if (normalized(group.name).includes(needle)) {
      matches.push({ group, memberNames: [] });
      continue;
    }
    const memberNames = group.members.flatMap((member) => {
      const person = persons.find((candidate) => candidate.id === member.personId);
      return person !== undefined && normalized(person.name).includes(needle) ? [person.name] : [];
    });
    if (memberNames.length > 0) {
      matches.push({ group, memberNames });
    }
  }
  return matches;
}
