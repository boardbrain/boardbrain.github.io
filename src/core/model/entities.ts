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
