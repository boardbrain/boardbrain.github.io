import type { StoredSession } from '@/app/ports';
import type { CatanColorKey, PersonId } from '@/core/model';
import { assert } from '@/core/shared';

/**
 * Catan colour of a person in this match (US-PG-04, US-PL-04 AK-1).
 * @throws {InvariantError} if the person does not take part.
 */
export function colorOf(session: StoredSession, personId: PersonId): CatanColorKey {
  const color = session.setup.colors.find((candidate) => candidate.personId === personId);
  assert(color !== undefined, `person ${personId} has a colour in this match`);
  return color.catanColor;
}

/**
 * Text colour on a Catan colour: dark on white, white otherwise (design I2-C).
 */
export function inkOn(color: CatanColorKey): string {
  return color === 'white' ? 'var(--color-on-catan)' : 'var(--color-on-catan-strong)';
}
