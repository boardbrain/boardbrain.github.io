/**
 * Public interface of the module `core/model`: entities, identifier types and invariants (FA-PG-*, FA-VW-*).
 *
 * Other modules import only through this file (Architecture 4.3).
 */
export {
  CATAN_COLOR_KEYS,
  GROUP_COLOR_KEYS,
  type CatanColorKey,
  type GroupColorKey,
} from './colors';
export {
  changeCustomGameScoring,
  createCustomGame,
  createPerson,
  type CustomGame,
  type IsoTimestamp,
  type NameEmptyError,
  type NewCustomGameFields,
  type NewRecordFields,
  type Person,
  type ScoringDirection,
  renameCustomGame,
  renamePerson,
} from './entities';
export {
  createGroup,
  editGroup,
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
  parseLocalDate,
  parseLocalTime,
  type DateInvalidError,
  type LocalDate,
  type LocalDateTime,
  type LocalTime,
  type TimeInvalidError,
} from './localDateTime';
export type { Match } from './match';
export {
  areMatchColorsValid,
  matchColorsOf,
  setMatchColor,
  type MatchColor,
  type MatchColors,
} from './matchColors';
export {
  isUuidV4,
  parseGameId,
  parseGroupId,
  parseMatchId,
  parsePersonId,
  toGameId,
  toGroupId,
  toMatchId,
  toPersonId,
  type GameId,
  type GroupId,
  type IdInvalidError,
  type MatchId,
  type PersonId,
} from './ids';
export {
  countFellowPlayers,
  findByName,
  findPersons,
  tablesOfPerson,
  type PersonTable,
} from './overview';
export { cleanName, containsName, isBlankName, isSameName, sortByName } from './names';
