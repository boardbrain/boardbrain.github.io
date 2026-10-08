import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppLayout } from './AppLayout';

function renderAt(path: string): void {
  const router = createMemoryRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <h1>start page</h1> },
          { path: '/verwaltung', element: <h1>management page</h1> },
          { path: '/verwaltung/personen', element: <h1>persons page</h1> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

function navigation(): HTMLElement {
  return screen.getByRole('navigation', { name: 'Hauptnavigation' });
}

describe('Architecture 13.1 app frame and navigation', () => {
  it('shows the app name and the main navigation without the diagnostics view', () => {
    renderAt('/');

    expect(screen.getByText('BoardBrain')).toBeInTheDocument();
    const links = within(navigation()).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Start', 'Verwaltung']);
  });

  it('NFA-PL-04: contains the hint to turn the phone, shown by the layout only in low landscape', () => {
    renderAt('/');

    expect(screen.getByText('Bitte das Handy hochkant drehen')).toBeInTheDocument();
  });

  it('marks the current area, also on sub-pages', () => {
    renderAt('/verwaltung/personen');

    expect(within(navigation()).getByRole('link', { name: 'Verwaltung' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(navigation()).getByRole('link', { name: 'Start' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('navigates between the areas', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(within(navigation()).getByRole('link', { name: 'Verwaltung' }));

    expect(screen.getByRole('heading', { name: 'management page' })).toBeInTheDocument();
  });
});
