import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '@tests/support/renderWithApp';
import { BoardView } from './BoardView';

describe('US-PL-01 board view', () => {
  it('shows title, explanation, back button and the board', () => {
    renderWithApp(<BoardView />, { path: '/brett' });

    expect(screen.getByRole('heading', { name: 'Brett' })).toBeInTheDocument();
    expect(screen.getByText(/So zeigt BoardBrain das Spielbrett/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Spielbrett mit 19 Feldern' })).toBeInTheDocument();
  });
});
