import { CATAN_GAME_ID } from '@/games/catan';
import type { GameId } from '@/core/model';
import { LandscapePicture } from '@/ui/art/Pictures';
import { firstLetter } from './GameCards';
import styles from './GameSymbol.module.css';

/**
 * The symbol of a game in a circle (design I3-C EM3, SY1): the landscape for Catan, the first
 * letter for a custom game, as on its card. Decorative: the name stands beside it.
 */
export function GameSymbol({
  gameId,
  name,
  size,
}: {
  readonly gameId: GameId;
  readonly name: string;
  /** Diameter in px: 40 in the list, 44 in the head of a result. */
  readonly size: 40 | 44;
}): React.JSX.Element {
  return (
    <span
      className={styles.symbol}
      style={{ width: `${String(size)}px`, height: `${String(size)}px` }}
      aria-hidden="true"
    >
      {gameId === CATAN_GAME_ID ? (
        <LandscapePicture className={styles.picture} />
      ) : (
        <span className={styles.letter}>{firstLetter(name)}</span>
      )}
    </span>
  );
}
