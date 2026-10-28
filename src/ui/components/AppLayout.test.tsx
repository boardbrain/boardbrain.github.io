import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from './AppLayout';
import { LONG_PRESS_MS } from './cardHand';

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

describe('Design K-3 folded card hand', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function link(name: string): HTMLElement {
    return within(navigation()).getByRole('link', { name });
  }

  function longPress(name: string): void {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.pointerDown(link(name));
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });
    fireEvent.pointerUp(link(name));
    fireEvent.click(link(name));
    vi.useRealTimers();
  }

  it('is fanned out on the start view and folded on every other page', () => {
    renderAt('/');
    expect(navigation()).toHaveAttribute('data-state', 'fanned');
  });

  it('is folded in the management and on sub-pages, with the names still readable', () => {
    renderAt('/verwaltung/personen');

    expect(navigation()).toHaveAttribute('data-state', 'folded');
    expect(
      within(navigation())
        .getAllByRole('link')
        .map((card) => card.textContent),
    ).toEqual(['Start', 'Verwaltung']);
  });

  it('leads straight to the area with a tap on a folded card and fans out on the start view', async () => {
    const user = userEvent.setup();
    renderAt('/verwaltung/personen');

    await user.click(link('Start'));

    expect(screen.getByRole('heading', { name: 'start page' })).toBeInTheDocument();
    expect(navigation()).toHaveAttribute('data-state', 'fanned');
  });

  it('fans out the whole hand with a long press without leaving the page', () => {
    renderAt('/verwaltung/personen');

    longPress('Start');

    expect(navigation()).toHaveAttribute('data-state', 'open');
    expect(screen.getByRole('heading', { name: 'persons page' })).toBeInTheDocument();
  });

  it('folds the opened hand again with a tap on the backdrop', async () => {
    const user = userEvent.setup();
    renderAt('/verwaltung/personen');
    longPress('Start');

    await user.click(screen.getByRole('button', { name: 'Navigation schließen' }));

    expect(navigation()).toHaveAttribute('data-state', 'folded');
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Navigation schließen' }),
      ).not.toBeInTheDocument();
    });
  });

  it('folds the opened hand again with Escape', async () => {
    const user = userEvent.setup();
    renderAt('/verwaltung/personen');
    longPress('Verwaltung');

    await user.keyboard('{Escape}');

    expect(navigation()).toHaveAttribute('data-state', 'folded');
  });

  it('leads to the area with a tap on a card of the opened hand, folded there again', async () => {
    const user = userEvent.setup();
    renderAt('/verwaltung/personen');
    longPress('Start');

    await user.click(link('Verwaltung'));

    expect(screen.getByRole('heading', { name: 'management page' })).toBeInTheDocument();
    expect(navigation()).toHaveAttribute('data-state', 'folded');
  });

  it('closes the opened hand with a tap on the card of the current page', async () => {
    const user = userEvent.setup();
    renderAt('/verwaltung');
    longPress('Start');

    await user.click(link('Verwaltung'));

    expect(screen.getByRole('heading', { name: 'management page' })).toBeInTheDocument();
    expect(navigation()).toHaveAttribute('data-state', 'folded');
  });

  it('does not open on the start view, where the hand is already fanned out', () => {
    renderAt('/');

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.pointerDown(link('Verwaltung'));
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });

    expect(navigation()).toHaveAttribute('data-state', 'fanned');
  });

  it('does not open after a short tap that was released early', () => {
    renderAt('/verwaltung/personen');

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.pointerDown(link('Start'));
    fireEvent.pointerLeave(link('Start'));
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });

    expect(navigation()).toHaveAttribute('data-state', 'folded');
  });

  it('suppresses the browser menu of a long press only where the hand is folded', () => {
    renderAt('/verwaltung');
    // fireEvent returns false when the default action was prevented.
    expect(fireEvent.contextMenu(link('Start'))).toBe(false);
  });

  it('keeps the browser menu on the start view', () => {
    renderAt('/');
    expect(fireEvent.contextMenu(link('Verwaltung'))).toBe(true);
  });
});
