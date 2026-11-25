import { aCustomGame, aGroup, TEST_NOW } from '@tests/support/masterDataFakes';
import { aStoredSession } from '@tests/support/sessionFakes';
import { createTestDb, createTestIndexedDb } from '@tests/support/testDatabase';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createScorePad, DEFAULT_SCORE_PAD_SETTINGS } from '@/core/scorepad';
import type { BoardBrainDb } from './database';
import { createDexieResultStore } from './resultStore';
import { createDexieScorePadStore } from './scorePadStore';
import { createDexieSessionStore } from './sessionStore';

let indexedDB: ReturnType<typeof createTestIndexedDb>;
let db: BoardBrainDb;

beforeEach(() => {
  indexedDB = createTestIndexedDb();
  db = createTestDb(indexedDB);
});

afterEach(() => {
  db.close();
});

const PAD = {
  ...createScorePad({
    gameId: aCustomGame().id,
    groupId: aGroup().id,
    participants: aGroup().members.map((member) => member.personId),
    startedAt: TEST_NOW,
    settings: DEFAULT_SCORE_PAD_SETTINGS,
  }),
  rounds: [
    { '00000000-0000-4000-8000-0000000000a1': 3, '00000000-0000-4000-8000-0000000000a2': -2 },
  ],
};

describe('Architecture 10.5 running score pad', () => {
  it('US-NB-01 AK-5: the score pad survives reopening the database', async () => {
    await createDexieScorePadStore(db).transaction(({ scorePad }) => scorePad.put(PAD));
    db.close();

    db = createTestDb(indexedDB);
    expect(
      await createDexieScorePadStore(db).transaction(({ scorePad }) => scorePad.get()),
    ).toEqual(PAD);
  });

  it('E-51: the services see the match and the score pad of each other', async () => {
    const session = aStoredSession();
    await createDexieSessionStore(db).transaction((repositories) =>
      repositories.session.put(session),
    );
    await createDexieScorePadStore(db).transaction(({ scorePad }) => scorePad.put(PAD));

    expect(
      await createDexieScorePadStore(db).transaction((repositories) => repositories.session.get()),
    ).toEqual(session);
    expect(
      await createDexieSessionStore(db).transaction((repositories) => repositories.scorePad.get()),
    ).toEqual(PAD);
  });

  it('US-NB-04 AK-2, AK-3: the result store and "Beenden ohne Ergebnis" remove it', async () => {
    await createDexieScorePadStore(db).transaction(({ scorePad }) => scorePad.put(PAD));
    await createDexieResultStore(db).transaction(({ scorePad }) => scorePad.delete());
    expect(await db.scorePad.count()).toBe(0);

    await createDexieScorePadStore(db).transaction(({ scorePad }) => scorePad.put(PAD));
    await createDexieScorePadStore(db).transaction(({ scorePad }) => scorePad.delete());
    expect(await db.scorePad.count()).toBe(0);
  });
});
