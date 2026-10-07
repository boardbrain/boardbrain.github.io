import { aCustomGame } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GamesView } from './GamesView';

function customGamesArea(): HTMLElement {
  return screen.getByRole('region', { name: 'Eigene Spiele' });
}

describe('US-SP-02 Create a custom game (game management)', () => {
  it('shows Catan under supported games and a hint under custom games', async () => {
    renderWithApp(<GamesView />);

    const supported = screen.getByRole('region', { name: 'Unterstützte Spiele' });
    expect(within(supported).getByRole('listitem')).toHaveTextContent('Catan');
    expect(
      await within(customGamesArea()).findByText('Noch keine eigenen Spiele angelegt.'),
    ).toBeInTheDocument();
  });

  it('AK-1: shows the saved game in the area "Eigene Spiele"', async () => {
    const user = userEvent.setup();
    renderWithApp(<GamesView />);

    await user.type(screen.getByLabelText('Name'), 'Uno');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await within(customGamesArea()).findByRole('listitem')).toHaveTextContent('Uno');
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('saving is impossible with a blank name', async () => {
    const user = userEvent.setup();
    renderWithApp(<GamesView />);

    await user.type(screen.getByLabelText('Name'), '  ');

    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });

  it('AK-2: points out an existing game with the same name and does not save', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GamesView />);
    await db.games.add(aCustomGame({ name: 'Uno' }));

    await user.type(screen.getByLabelText('Name'), 'UNO');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Es gibt bereits ein Spiel namens „UNO“. Bitte wähle einen anderen Namen.',
    );
    expect(await db.games.count()).toBe(1);
  });

  it('AK-2: points out Catan as an existing game and does not save', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GamesView />);

    await user.type(screen.getByLabelText('Name'), 'catan');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('„catan“');
    expect(await db.games.count()).toBe(0);
  });

  it('AK-2: changing the name removes the hint', async () => {
    const user = userEvent.setup();
    renderWithApp(<GamesView />);

    await user.type(screen.getByLabelText('Name'), 'Catan');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await screen.findByRole('alert');
    await user.type(screen.getByLabelText('Name'), ' Junior');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
