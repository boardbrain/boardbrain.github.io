import type { IdGenerator } from '@/app/ports';

/**
 * The only source of identifiers (NFA-DH-05, ADR-011): UUID version 4 from
 * `crypto.randomUUID()`, which uses the same cryptographic generator as drawing.
 */
export const uuidGenerator: IdGenerator = {
  newId: () => crypto.randomUUID(),
};
