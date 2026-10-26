/**
 * Public interface of the module `core/model`: entities, identifier types and invariants (FA-PG-*, FA-VW-*).
 *
 * Other modules import only through this file (Architecture 4.3). Matches follow with their
 * increment.
 */
export {
  CATAN_COLOR_KEYS,
  GROUP_COLOR_KEYS,
  type CatanColorKey,
  type GroupColorKey,
} from './colors';
export {
  createCustomGame,
  createPerson,
  type CustomGame,
  type IsoTimestamp,
  type NameEmptyError,
  type NewRecordFields,
  type Person,
  renameCustomGame,
  renamePerson,
} from './entities';
export {
  createGroup,
  editGroup,
  findNameConflicts,
  findSameNamedPersons,
  GROUP_MAX_PLAYERS_WITH_COLORS,
  GROUP_SIZE,
  suggestGroupName,
  type BoundGame,
  type Group,
  type GroupBinding,
  type GroupChanges,
  type GroupEditError,
  type GroupError,
  type GroupMember,
  type NewGroupFields,
} from './group';
export {
  colorSchemeOf,
  defaultColors,
  normalizeColors,
  setMemberColor,
  type ColorKind,
  type ColorScheme,
  type ColorSchemeInput,
  type MemberColors,
} from './groupColors';
export { findGroups, type GroupMatch } from './groupSearch';
export {
  isUuidV4,
  parseGroupId,
  parsePersonId,
  toGameId,
  toGroupId,
  toPersonId,
  type GameId,
  type GroupId,
  type IdInvalidError,
  type PersonId,
} from './ids';
export { countFellowPlayers, findPersons, tablesOfPerson, type PersonTable } from './overview';
export { cleanName, containsName, isBlankName, isSameName, sortByName } from './names';
