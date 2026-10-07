import { InvariantError } from '@/core/shared';

declare const idBrand: unique symbol;

/**
 * Identifier that the compiler distinguishes by its brand, so a game id can never be passed
 * where a person id is expected (Architecture 7.1). At runtime it is a plain string.
 */
type BrandedId<B extends string> = string & { readonly [idBrand]: B };

/**
 * Identifier of a person: UUID version 4 (NFA-DH-05, ADR-011).
 */
export type PersonId = BrandedId<'PersonId'>;

/**
 * Identifier of a game, supported or custom: UUID version 4 (NFA-DH-05, ADR-011).
 */
export type GameId = BrandedId<'GameId'>;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Checks whether the value is a UUID version 4 in the lowercase form of `crypto.randomUUID()`.
 */
export function isUuidV4(value: string): boolean {
  return UUID_V4.test(value);
}

function isPersonId(value: string): value is PersonId {
  return isUuidV4(value);
}

function isGameId(value: string): value is GameId {
  return isUuidV4(value);
}

/**
 * Identifier of a group: UUID version 4 (NFA-DH-05, ADR-011).
 */
export type GroupId = BrandedId<'GroupId'>;

/**
 * Turns a freshly generated UUID into a person id.
 * @throws {InvariantError} if the value is not a UUID version 4.
 */
export function toPersonId(value: string): PersonId {
  if (!isPersonId(value)) {
    throw new InvariantError(`Not a UUID v4 person id: ${value}`);
  }
  return value;
}

/**
 * Turns a freshly generated UUID or the built-in id of a supported game into a game id.
 * @throws {InvariantError} if the value is not a UUID version 4.
 */
export function toGameId(value: string): GameId {
  if (!isGameId(value)) {
    throw new InvariantError(`Not a UUID v4 game id: ${value}`);
  }
  return value;
}

function isGroupId(value: string): value is GroupId {
  return isUuidV4(value);
}

/**
 * Turns a freshly generated UUID into a group id.
 * @throws {InvariantError} if the value is not a UUID version 4.
 */
export function toGroupId(value: string): GroupId {
  if (!isGroupId(value)) {
    throw new InvariantError(`Not a UUID v4 group id: ${value}`);
  }
  return value;
}
