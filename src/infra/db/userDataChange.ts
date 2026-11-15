import type { IsoTimestamp } from '@/core/model';
import type { BoardBrainDb } from './database';

/**
 * Records a change of user data in `meta.state` (Architecture 7.4). Called by every
 * repository write inside the same transaction, so no change can be forgotten. It returns
 * Dexie's own promise, not a native one: only then can the caller go on in the same transaction
 * after awaiting it.
 */
export function recordUserDataChange(db: BoardBrainDb, at: IsoTimestamp): Promise<void> {
  return db.meta.get('state').then(async (entry) => {
    const state = entry?.key === 'state' ? entry.value : {};
    await db.meta.put({
      key: 'state',
      value: { ...state, lastUserDataChangeAt: at, firstDataAt: state.firstDataAt ?? at },
    });
  });
}
