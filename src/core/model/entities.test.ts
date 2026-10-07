import { describe, expect, it } from 'vitest';
import { createCustomGame, createPerson } from './entities';
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
