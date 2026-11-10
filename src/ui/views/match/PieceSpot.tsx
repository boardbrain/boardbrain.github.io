import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import { CATAN_BOARD } from '@/games/catan';
import { BoardSpotlight, type PieceMarking } from '@/ui/board/Board';
import { matchBoardPieces } from './boardPieces';

type PieceSpotProps = {
  readonly session: StoredSession;
  readonly nameOf: (personId: PersonId) => string;
  readonly marked: PieceMarking;
};

/**
 * The marked pieces of the board shown, bright over the dark of a question about repeating one
 * (US-AB-03 AK-8, design I2-H, R7).
 */
export function PieceSpot({ session, nameOf, marked }: PieceSpotProps): React.JSX.Element {
  const { buildings, roads } = matchBoardPieces(session, nameOf);
  return <BoardSpotlight board={CATAN_BOARD} buildings={buildings} roads={roads} marked={marked} />;
}
