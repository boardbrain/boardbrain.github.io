import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CATAN_BOARD } from '@/games/catan';
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
