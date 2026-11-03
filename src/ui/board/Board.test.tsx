import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CATAN_BOARD, type EdgeId, type VertexId } from '@/games/catan';
import { Board } from './Board';

describe('US-PL-01 board', () => {
  it('AK-1: shows the board with its 19 hexes', () => {
    render(<Board board={CATAN_BOARD} />);

    expect(screen.getByRole('img', { name: 'Spielbrett mit 19 Feldern' })).toBeInTheDocument();
    expect(screen.getAllByTestId('board-hex')).toHaveLength(19);
  });

  it('AK-2: the hexes carry no terrain, no numbers and no text', () => {
    render(<Board board={CATAN_BOARD} />);

    expect(screen.getByRole('img').textContent).toBe('');
  });

  it('AK-3: keeps its orientation: fixed viewBox, scaled with meet', () => {
    render(<Board board={CATAN_BOARD} />);

    const board = screen.getByRole('img');
    expect(board).toHaveAttribute('viewBox', '-60 -53 120 106');
    expect(board).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  });

  it('gives every board its own gradient and filter ids', () => {
    render(
      <>
        <Board board={CATAN_BOARD} />
        <Board board={CATAN_BOARD} />
      </>,
    );

    const hexes = screen.getAllByTestId('board-hex');
    expect(hexes).toHaveLength(38);
    expect(hexes[0]?.getAttribute('fill')).not.toBe(hexes[19]?.getAttribute('fill'));
  });
});

function anEdge(): { edge: EdgeId; from: VertexId; to: VertexId } {
  const [first] = CATAN_BOARD.edges.values();
  const [from, to] = first?.vertices ?? [];
  if (first === undefined || from === undefined || to === undefined) {
    throw new Error('the board has edges');
  }
  return { edge: first.id, from, to };
}

describe('US-PL-04 pieces on the board', () => {
  it('AK-1: draws buildings and roads of the match', () => {
    const { edge, from, to } = anEdge();

    render(
      <Board
        board={CATAN_BOARD}
        label="Brett mit Gebäuden"
        buildings={[
          { key: 'b0', vertex: from, type: 'settlement', color: 'red' },
          { key: 'b1', vertex: to, type: 'city', color: 'blue' },
        ]}
        roads={[{ key: 'r0', edge, from, color: 'red' }]}
        newestKey="r0"
      />,
    );

    expect(screen.getByRole('img', { name: 'Brett mit Gebäuden' })).toBeInTheDocument();
    expect(screen.getAllByTestId('board-settlement')).toHaveLength(1);
    expect(screen.getAllByTestId('board-city')).toHaveLength(1);
    expect(screen.getAllByTestId('board-road')).toHaveLength(1);
  });
});
