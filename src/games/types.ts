import type { CatanColorKey, GameId } from '@/core/model';

/**
 * Supported game with its own generation (NFA-EW-01, Architecture 5.1). New games are added
 * as a new module in `games/registry.ts` without changing existing modules. What the module tells
 * about results lets `core/results` check them without knowing the game (ADR-028).
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
  /** Keys of the editions; one of them is required in a result (FA-ER-03). */
  readonly editions: readonly string[];
  /** Keys of the modes; the first is the default (FA-ER-03, US-ER-01 AK-6). */
  readonly modes: readonly string[];
  /** Whether a match has exactly one winner, i.e. no draw (FA-ER-07, E-42). */
  readonly hasSingleWinner: boolean;
  /** Whether the duration of a match is recorded (FA-ER-10, E-43). */
  readonly tracksDuration: boolean;
};
