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
 * Which score wins in a game that counts points (FA-SP-07): the most points, as in Catan, or the
 * fewest, as in Skyjo.
 */
export type ScoringDirection = 'highest-wins' | 'lowest-wins';

/**
 * Game created by the user, only for recording results (FA-SP-02, Architecture 5.1, 7.1).
 */
export type CustomGame = {
  readonly id: GameId;
  readonly name: string;
  readonly archived: boolean;
  /** Whether results can record points and which score wins; missing means no points (FA-SP-07). */
  readonly scoring?: ScoringDirection;
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
 * Fields a new custom game is created from: a name and, if it counts points, the scoring
 * (FA-SP-07).
 */
export type NewCustomGameFields = NewRecordFields<GameId> & {
  readonly scoring?: ScoringDirection;
};

/**
 * Creates a new, active custom game with the cleaned name (US-SP-02 AK-1) and, if given, its
 * scoring (US-SP-02 AK-4, FA-SP-07).
 */
export function createCustomGame(fields: NewCustomGameFields): Result<CustomGame, NameEmptyError> {
  const name = cleanName(fields.name);
  if (name === '') {
    return err('name-empty');
  }
  return ok({
    id: fields.id,
    name,
    archived: false,
    ...(fields.scoring === undefined ? {} : { scoring: fields.scoring }),
    createdAt: fields.now,
    updatedAt: fields.now,
  });
}

/**
 * Sets whether a custom game counts points and which score wins, or `null` for no points
 * (US-VW-07 AK-3, FA-SP-07). Whether points may be switched off is checked by the caller, which
 * knows the results.
 */
export function changeCustomGameScoring(
  game: CustomGame,
  scoring: ScoringDirection | null,
  now: IsoTimestamp,
): CustomGame {
  return {
    id: game.id,
    name: game.name,
    archived: game.archived,
    ...(scoring === null ? {} : { scoring }),
    createdAt: game.createdAt,
    updatedAt: now,
  };
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
 * Gives a person a new, cleaned name (US-VW-06 AK-1, FA-VW-01). Uniqueness among all persons
 * is checked by the caller, which knows the other persons (E-31).
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
