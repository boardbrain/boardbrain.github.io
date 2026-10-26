import { err, ok, type Result } from '@/core/shared';
import type { GameId, PersonId } from './ids';
import { cleanName } from './names';

/**
 * UTC timestamp in ISO 8601 format, e.g. `2026-10-07T18:30:00.000Z` (Architecture 7.1).
 */
export type IsoTimestamp = string;

/**
 * Person who plays in groups (FA-PG-01, Architecture 7.1).
 */
export type Person = {
  readonly id: PersonId;
  readonly name: string;
  readonly archived: boolean;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
};

/**
 * Game created by the user, only for recording results (FA-SP-02, Architecture 5.1, 7.1).
 */
export type CustomGame = {
  readonly id: GameId;
  readonly name: string;
  readonly archived: boolean;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
};

/**
 * Fields a new record is created from.
 */
export type NewRecordFields<Id> = {
  readonly id: Id;
  readonly name: string;
  readonly now: IsoTimestamp;
};

/**
 * Error code for a name that is empty or consists of spaces only.
 */
export type NameEmptyError = 'name-empty';

/**
 * Creates a new, active person with the cleaned name (US-PG-01 AK-1, AK-2).
 */
export function createPerson(fields: NewRecordFields<PersonId>): Result<Person, NameEmptyError> {
  const name = cleanName(fields.name);
  if (name === '') {
    return err('name-empty');
  }
  return ok({
    id: fields.id,
    name,
    archived: false,
    createdAt: fields.now,
    updatedAt: fields.now,
  });
}

/**
 * Creates a new, active custom game with the cleaned name (US-SP-02 AK-1).
 */
export function createCustomGame(
  fields: NewRecordFields<GameId>,
): Result<CustomGame, NameEmptyError> {
  const name = cleanName(fields.name);
  if (name === '') {
    return err('name-empty');
  }
  return ok({
    id: fields.id,
    name,
    archived: false,
    createdAt: fields.now,
    updatedAt: fields.now,
  });
}

// Renaming keeps everything but the name and moves `updatedAt` forward.
function renamed<T extends Person | CustomGame>(
  record: T,
  name: string,
  now: IsoTimestamp,
): Result<T, NameEmptyError> {
  const cleaned = cleanName(name);
  if (cleaned === '') {
    return err('name-empty');
  }
  return ok({ ...record, name: cleaned, updatedAt: now });
}

/**
 * Gives a person a new, cleaned name (US-VW-06 AK-1, FA-VW-01). Whether the name clashes
 * with a member of one of the person's groups is checked by `findNameConflicts`.
 */
export function renamePerson(
  person: Person,
  name: string,
  now: IsoTimestamp,
): Result<Person, NameEmptyError> {
  return renamed(person, name, now);
}

/**
 * Gives a custom game a new, cleaned name (US-VW-07 AK-1, FA-VW-04). Uniqueness among all
 * games is checked by the caller, which knows the other games.
 */
export function renameCustomGame(
  game: CustomGame,
  name: string,
  now: IsoTimestamp,
): Result<CustomGame, NameEmptyError> {
  return renamed(game, name, now);
}
