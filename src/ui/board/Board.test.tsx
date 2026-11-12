import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CATAN_BOARD, type EdgeId, type VertexId } from '@/games/catan';
import { Board, BoardSpotlight, type BoardBuilding, type BoardRoad } from './Board';

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
      />,
    );

    expect(screen.getByRole('img', { name: 'Brett mit Gebäuden' })).toBeInTheDocument();
    expect(screen.getAllByTestId('board-settlement')).toHaveLength(1);
    expect(screen.getAllByTestId('board-city')).toHaveLength(1);
    expect(screen.getAllByTestId('board-road')).toHaveLength(1);
  });
});

describe('US-IN-02 layers for the highlighting (design D-2)', () => {
  it('AK-7: draws lifted pieces over the overlay, and the top layer over everything', () => {
    const { edge, from, to } = anEdge();

    render(
      <Board
        board={CATAN_BOARD}
        buildings={[
          { key: 'b0', vertex: from, type: 'settlement', color: 'red' },
          { key: 'b1', vertex: to, type: 'city', color: 'blue' },
        ]}
        roads={[{ key: 'r0', edge, from, color: 'red' }]}
        overlay={<g data-testid="overlay" />}
        lifted={['b0']}
        top={<g data-testid="top" />}
      />,
    );

    const inOrder = [
      screen.getByTestId('board-road'),
      screen.getByTestId('board-city'),
      screen.getByTestId('overlay'),
      screen.getByTestId('board-settlement'),
      screen.getByTestId('top'),
    ];
    inOrder.slice(1).forEach((later, index) => {
      const earlier = inOrder[index];
      expect(earlier?.compareDocumentPosition(later)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });
});

describe('US-AB-03 AK-8 tapping pieces (design I2-H)', () => {
  const { edge, from: vertex } = anEdge();
  const buildings: BoardBuilding[] = [
    {
      key: 'building-0',
      vertex,
      type: 'settlement',
      color: 'red',
      label: 'Siedlung von Anna wiederholen',
    },
  ];
  const roads: BoardRoad[] = [
    { key: 'road-0', edge, from: vertex, color: 'red', label: 'Straße von Anna wiederholen' },
  ];

  it('without a handler the pieces are no buttons', () => {
    render(<Board board={CATAN_BOARD} buildings={buildings} roads={roads} />);

    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it('every piece is a button with its name; without a pointer it means its own piece', () => {
    const onPieceTap = vi.fn<(key: string) => void>();
    render(
      <Board board={CATAN_BOARD} buildings={buildings} roads={roads} onPieceTap={onPieceTap} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Straße von Anna wiederholen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siedlung von Anna wiederholen' }));

    expect(onPieceTap.mock.calls).toEqual([['road-0'], ['building-0']]);
  });

  it('marks the asked piece and the pieces discarded with it (M1)', () => {
    render(
      <Board
        board={CATAN_BOARD}
        buildings={buildings}
        roads={roads}
        marked={{ main: 'building-0', others: ['road-0'] }}
      />,
    );

    expect(screen.getAllByTestId('piece-mark')).toHaveLength(1);
    expect(screen.getAllByTestId('piece-mark-other')).toHaveLength(1);
  });

  it('the spotlight shows only the marked pieces (R7)', () => {
    render(
      <BoardSpotlight
        board={CATAN_BOARD}
        buildings={buildings}
        roads={roads}
        marked={{ main: 'road-0', others: [] }}
      />,
    );

    expect(screen.getByTestId('board-spotlight')).toBeInTheDocument();
    expect(screen.getAllByTestId('board-road')).toHaveLength(1);
    expect(screen.queryAllByTestId('board-settlement')).toEqual([]);
    expect(screen.queryAllByTestId('board-hex')).toEqual([]);
  });
});
