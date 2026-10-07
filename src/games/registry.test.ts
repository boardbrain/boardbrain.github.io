import { isUuidV4, toGameId } from '@/core/model';
import { CATAN_GAME_ID, CATAN_MODULE } from '@/games/catan';
import { describe, expect, it } from 'vitest';
import { findSupportedGame, gameCapabilities, SUPPORTED_GAMES } from './registry';

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
    });
  });

  it('FA-SP-05: a custom game has no player colours and no victory points', () => {
    expect(gameCapabilities(CUSTOM_GAME_ID)).toEqual({
      isSupported: false,
      playerColors: null,
      supportsVictoryPoints: false,
    });
  });
});
