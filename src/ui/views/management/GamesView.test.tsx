import { defined } from '@tests/support/defined';
import { aCustomGame } from '@tests/support/masterDataFakes';
import { OverviewRoutes } from '@tests/support/overviewRoutes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

function gameCards(): string[] {
  return within(screen.getByRole('list', { name: 'Spiele' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

describe('US-SP-03 Supported and custom games (games page, design I3-B)', () => {
  it('AK-1: one grid: "Neues Spiel", Catan as a development card, then the custom games', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: '/verwaltung/spiele' });
    await db.games.add(aCustomGame({ name: 'Uno' }));

    expect(await screen.findByText('Uno')).toBeInTheDocument();
    expect(gameCards()).toEqual([
      'Neues Spiel',
      'Catannoch nie gespieltmit Generierung',
      '0UUnonoch nie gespieltohne Punkte0',
    ]);
    expect(screen.getByText('Zahl in der Ecke: Partien')).toBeInTheDocument();
  });

  it('says when there are no custom games yet', async () => {
    renderWithApp(<OverviewRoutes />, { path: '/verwaltung/spiele' });

    expect(await screen.findByText('Noch keine eigenen Spiele')).toBeInTheDocument();
  });
});

describe('US-SP-02 Create a custom game (design I3-B V2)', () => {
  it('AK-1, AK-4: "Neues Spiel" opens its own page; the game is created with its points', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: '/verwaltung/spiele' });

    // The plus in the head and the dashed card both open the page.
    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: 'Neues Spiel' })).toHaveLength(2);
    });
    const [plus, card] = screen.getAllByRole('link', { name: 'Neues Spiel' });
    expect(card).toHaveAttribute('href', defined(plus, 'plus').getAttribute('href'));
    await user.click(defined(plus, 'plus'));
    const editor = await screen.findByRole('dialog', { name: 'Neues Spiel' });
    expect(within(editor).getByRole('radio', { name: /Keine Punkte/ })).toBeChecked();
    await user.type(within(editor).getByRole('textbox', { name: 'Name des Spiels' }), 'Skyjo');
    await user.click(within(editor).getByRole('radio', { name: /Wenigste Punkte gewinnen/ }));
    await user.click(within(editor).getByRole('button', { name: 'Spiel anlegen' }));

    expect(await screen.findByText('Skyjo')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    const [game] = await db.games.toArray();
    expect(game).toMatchObject({ name: 'Skyjo', scoring: 'lowest-wins' });
  });

  it('saving is impossible with a blank name', async () => {
    const user = userEvent.setup();
    renderWithApp(<OverviewRoutes />, { path: '/verwaltung/spiele/neu' });

    await user.type(await screen.findByRole('textbox', { name: 'Name des Spiels' }), '  ');

    expect(screen.getByRole('button', { name: 'Spiel anlegen' })).toBeDisabled();
  });

  it.each(['UNO', 'catan'])(
    'AK-2: points out the taken name %j while typing and does not save',
    async (name) => {
      const user = userEvent.setup();
      const { db } = renderWithApp(<OverviewRoutes />, { path: '/verwaltung/spiele/neu' });
      await db.games.add(aCustomGame({ name: 'Uno' }));

      await user.type(await screen.findByRole('textbox', { name: 'Name des Spiels' }), name);

      expect(await screen.findByText('Name gibt es schon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Spiel anlegen' })).toBeDisabled();
      expect(await db.games.count()).toBe(1);
    },
  );
});
