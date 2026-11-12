import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { BackButton } from './BackButton';

function renderRoutes(initialEntries: string[]): void {
  const router = createMemoryRouter(
    [
      { path: '/', element: <Link to="/verwaltung/personen">to persons</Link> },
      { path: '/verwaltung', element: <h1>management page</h1> },
      { path: '/verwaltung/personen', element: <BackButton fallback="/verwaltung" /> },
    ],
    { initialEntries },
  );
  render(<RouterProvider router={router} />);
}

describe('Design D-3 back button', () => {
  it('goes back to where the person came from', async () => {
    const user = userEvent.setup();
    renderRoutes(['/']);

    await user.click(screen.getByRole('link', { name: 'to persons' }));
    await user.click(screen.getByRole('button', { name: 'Zurück' }));

    expect(screen.getByRole('link', { name: 'to persons' })).toBeInTheDocument();
  });

  it('leads to the fallback when the page was opened directly', async () => {
    const user = userEvent.setup();
    renderRoutes(['/verwaltung/personen']);

    await user.click(screen.getByRole('button', { name: 'Zurück' }));

    expect(screen.getByRole('heading', { name: 'management page' })).toBeInTheDocument();
  });
});
