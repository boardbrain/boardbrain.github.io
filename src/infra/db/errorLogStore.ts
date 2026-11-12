import type { ErrorLogEntry, ErrorLogStore } from '@/app/ports';
import type { BoardBrainDb } from './database';

/**
 * Reads the stored errors inside or outside a transaction; none if nothing was recorded yet.
 */
export async function readErrorLog(db: BoardBrainDb): Promise<readonly ErrorLogEntry[]> {
  const entry = await db.meta.get('errors');
  return entry?.key === 'errors' ? entry.value : [];
}

/**
 * Storage of the recent unexpected errors in `meta` under the key `errors` (K-9). It records no
 * change of user data (Architecture 7.4).
 */
export function createDexieErrorLogStore(db: BoardBrainDb): ErrorLogStore {
  return {
    update: (change) =>
      db.transaction('rw', db.meta, async () => {
        const entries = change(await readErrorLog(db));
        await db.meta.put({ key: 'errors', value: entries });
      }),
  };
}
