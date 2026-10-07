/**
 * Public interface of the module `core/model`: entities, identifier types and invariants (FA-PG-*, FA-VW-*).
 *
 * Other modules import only through this file (Architecture 4.3). Groups, members and matches
 * follow with their increments.
 */
export { CATAN_COLOR_KEYS, type CatanColorKey } from './colors';
export {
  createCustomGame,
  createPerson,
  type CustomGame,
  type IsoTimestamp,
  type NameEmptyError,
  type NewRecordFields,
  type Person,
} from './entities';
export { isUuidV4, toGameId, toPersonId, type GameId, type PersonId } from './ids';
export { cleanName, containsName, isBlankName, isSameName, sortByName } from './names';
