import type { CatanColorKey, GameId } from '@/core/model';

/**
 * Supported game with its own generation (NFA-EW-01, Architecture 5.1). New games are added
 * as a new module in `games/registry.ts` without changing existing modules. Editions, modes
 * and the generation follow with US-SP-04 and increment I2.
 */
export type GameModule = {
  /** Built-in id, the same on every device (NFA-DH-05). */
  readonly id: GameId;
  /**
   * Key of the name in the language file. Games must not depend on the UI texts
   * (Architecture 4.2), so the type is a plain string here; the registry keeps the literal
   * type, which lets the compiler check the key where the UI calls `t()`.
   */
  readonly nameKey: string;
  readonly playerCount: { readonly min: number; readonly max: number };
  /** Player colours of the game, or `null` if it has none (FA-SP-05). */
  readonly playerColors: readonly CatanColorKey[] | null;
  /** Whether victory points can be recorded (FA-SP-05). */
  readonly supportsVictoryPoints: boolean;
};
