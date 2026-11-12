import { describe, expect, it } from 'vitest';
import { createCustomGame, createPerson, renameCustomGame, renamePerson } from './entities';
import { toGameId, toPersonId } from './ids';

const ID = 'c47a0000-0000-4000-8000-0000000000aa';
const NOW = '2026-10-07T18:30:00.000Z';

describe('US-PG-01 Create a person', () => {
  it('AK-1: creates an active person with the cleaned name and timestamps', () => {
    const result = createPerson({ id: toPersonId(ID), name: '  Anna ', now: NOW });

    expect(result).toEqual({
      ok: true,
      value: { id: ID, name: 'Anna', archived: false, createdAt: NOW, updatedAt: NOW },
    });
  });

  it.each(['', '   '])('AK-2: rejects the blank name %j', (name) => {
    expect(createPerson({ id: toPersonId(ID), name, now: NOW })).toEqual({
      ok: false,
      error: 'name-empty',
    });
  });
});

describe('US-SP-02 Create a custom game', () => {
  it('AK-1: creates an active custom game with the cleaned name and timestamps', () => {
    const result = createCustomGame({ id: toGameId(ID), name: ' Uno ', now: NOW });

    expect(result).toEqual({
      ok: true,
      value: { id: ID, name: 'Uno', archived: false, createdAt: NOW, updatedAt: NOW },
    });
  });

  it('rejects a blank name', () => {
    expect(createCustomGame({ id: toGameId(ID), name: ' ', now: NOW })).toEqual({
      ok: false,
      error: 'name-empty',
    });
  });
});

const LATER = '2026-10-26T20:00:00.000Z';

describe('US-VW-06 Rename a person', () => {
  const anna = { id: toPersonId(ID), name: 'Ana', archived: false, createdAt: NOW, updatedAt: NOW };

  it('AK-1: keeps id and creation time, cleans the name and moves updatedAt', () => {
    expect(renamePerson(anna, '  Anna ', LATER)).toEqual({
      ok: true,
      value: { ...anna, name: 'Anna', updatedAt: LATER },
    });
  });

  it('rejects a blank name', () => {
    expect(renamePerson(anna, '   ', LATER)).toEqual({ ok: false, error: 'name-empty' });
  });
});

describe('US-VW-07 Rename a custom game', () => {
  const uno = { id: toGameId(ID), name: 'Unno', archived: false, createdAt: NOW, updatedAt: NOW };

  it('AK-1: keeps id and creation time, cleans the name and moves updatedAt', () => {
    expect(renameCustomGame(uno, ' Uno ', LATER)).toEqual({
      ok: true,
      value: { ...uno, name: 'Uno', updatedAt: LATER },
    });
  });

  it('rejects a blank name', () => {
    expect(renameCustomGame(uno, '', LATER)).toEqual({ ok: false, error: 'name-empty' });
  });
});
