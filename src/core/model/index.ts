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
} from './entities';
export {
  createGroup,
  findSameNamedPersons,
  GROUP_MAX_PLAYERS_WITH_COLORS,
  GROUP_SIZE,
  suggestGroupName,
  type BoundGame,
  type Group,
  type GroupBinding,
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
export {
  isUuidV4,
  toGameId,
  toGroupId,
  toPersonId,
  type GameId,
  type GroupId,
  type PersonId,
} from './ids';
export { cleanName, containsName, isBlankName, isSameName, sortByName } from './names';
