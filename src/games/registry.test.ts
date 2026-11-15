import { aGroup } from '@tests/support/masterDataFakes';
import { isUuidV4, toGameId, toPersonId } from '@/core/model';
import { CATAN_GAME_ID, CATAN_MODULE } from '@/games/catan';
import { describe, expect, it } from 'vitest';
import { canGroupPlay, findSupportedGame, gameCapabilities, SUPPORTED_GAMES } from './registry';

const CUSTOM_GAME_ID = toGameId('0b7e0000-0000-4000-8000-000000000002');

describe('Architecture 5.1 game registry', () => {
  it('FA-SP-01: offers Catan as the only supported game in version 1', () => {
    expect(SUPPORTED_GAMES).toEqual([CATAN_MODULE]);
  });

  it('NFA-DH-05: Catan has the fixed built-in id', () => {
    expect(CATAN_GAME_ID).toBe('c47a0000-0000-4000-8000-000000000001');
    expect(isUuidV4(CATAN_GAME_ID)).toBe(true);
  });

  it('Catan is played by 2 to 4 persons', () => {
    expect(CATAN_MODULE.playerCount).toEqual({ min: 2, max: 4 });
  });

  it('finds Catan by its id and nothing for a custom game', () => {
    expect(findSupportedGame(CATAN_GAME_ID)).toBe(CATAN_MODULE);
    expect(findSupportedGame(CUSTOM_GAME_ID)).toBeUndefined();
  });

  it('FA-SP-05: Catan supports the colours red, blue, white, orange and victory points', () => {
    expect(gameCapabilities(CATAN_GAME_ID)).toEqual({
      isSupported: true,
      playerColors: ['red', 'blue', 'white', 'orange'],
      supportsVictoryPoints: true,
      editions: ['base', 'cities-and-knights'],
      modes: ['standard'],
      hasSingleWinner: true,
      tracksDuration: true,
    });
  });

  it('FA-SP-05: a custom game has no player colours and no victory points', () => {
    expect(gameCapabilities(CUSTOM_GAME_ID)).toEqual({
      isSupported: false,
      playerColors: null,
      supportsVictoryPoints: false,
      editions: [],
      modes: [],
      hasSingleWinner: false,
      tracksDuration: false,
    });
  });
});

describe('Specification 3.4 compatibility of groups and games', () => {
  const OTHER_GAME_ID = toGameId('0b7e0000-0000-4000-8000-000000000003');
  const five = aGroup({
    members: [1, 2, 3, 4, 5].map((number) => ({
      personId: toPersonId(`00000000-0000-4000-8000-0000000000a${String(number)}`),
      groupColor: 'red',
    })),
  });

  it('US-ER-01 AK-5: a global group plays Catan and every custom game', () => {
    expect(canGroupPlay(aGroup(), CATAN_GAME_ID)).toBe(true);
    expect(canGroupPlay(aGroup(), CUSTOM_GAME_ID)).toBe(true);
  });

  it('US-ER-01 AK-5: Catan needs 2 to 4 members and is excluded by "Ich hasse Catan!"', () => {
    expect(canGroupPlay(five, CATAN_GAME_ID)).toBe(false);
    expect(canGroupPlay(five, CUSTOM_GAME_ID)).toBe(true);
    const withoutCatan = aGroup({ binding: { kind: 'global', excludesCatan: true } });
    expect(canGroupPlay(withoutCatan, CATAN_GAME_ID)).toBe(false);
    expect(canGroupPlay(withoutCatan, CUSTOM_GAME_ID)).toBe(true);
  });

  it('US-ER-01 AK-5: a bound group plays only its game', () => {
    const bound = aGroup({ binding: { kind: 'game', gameId: CUSTOM_GAME_ID } });
    expect(canGroupPlay(bound, CUSTOM_GAME_ID)).toBe(true);
    expect(canGroupPlay(bound, OTHER_GAME_ID)).toBe(false);
    expect(canGroupPlay(bound, CATAN_GAME_ID)).toBe(false);
    const catanTable = aGroup({ binding: { kind: 'game', gameId: CATAN_GAME_ID } });
    expect(canGroupPlay(catanTable, CATAN_GAME_ID)).toBe(true);
    expect(canGroupPlay(catanTable, CUSTOM_GAME_ID)).toBe(false);
  });

  it('US-ER-01 AK-5: an archived group plays nothing', () => {
    const archived = aGroup({ archived: true });
    expect(canGroupPlay(archived, CATAN_GAME_ID)).toBe(false);
    expect(canGroupPlay(archived, CUSTOM_GAME_ID)).toBe(false);
  });
});
