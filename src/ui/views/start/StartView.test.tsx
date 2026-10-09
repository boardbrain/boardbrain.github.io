import { aCustomGame, aGroup, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { toGameId, toPersonId } from '@/core/model';
import { StartView } from './StartView';

function cards(): HTMLElement {
  return screen.getByRole('navigation', { name: 'Karten' });
}

describe('Architecture 13.1 start view (design D-3)', () => {
  it('has a heading for screen readers and the cards persons, tables and games', async () => {
    renderWithApp(<StartView />);

    expect(screen.getByRole('heading', { level: 1, name: 'Start' })).toBeInTheDocument();
    const links = await within(cards()).findAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/verwaltung/personen',
      '/verwaltung/gruppen',
      '/verwaltung/spiele',
    ]);
  });

  it('shows the counts in the corners and invites to start with persons while there are none', async () => {
    renderWithApp(<StartView />);

    const persons = await within(cards()).findByRole('link', { name: 'Personen: 0' });
    expect(persons).toHaveTextContent('hier anfangen');
    expect(within(cards()).getByRole('link', { name: 'Tische: 0' })).toBeInTheDocument();
    // Catan is built in, so there is always at least one game.
    expect(within(cards()).getByRole('link', { name: 'Spiele: 1' })).toBeInTheDocument();
  });

  it('counts persons, tables and built-in plus custom games', async () => {
    const { db } = renderWithApp(<StartView />);
    await db.persons.bulkAdd([
      aPerson(),
      aPerson({ id: toPersonId('00000000-0000-4000-8000-0000000000a2'), name: 'Ben' }),
    ]);
    await db.groups.add(aGroup());
    await db.games.bulkAdd([
      aCustomGame(),
      aCustomGame({ id: toGameId('00000000-0000-4000-8000-0000000000b2'), name: 'Wizard' }),
    ]);

    const persons = await within(cards()).findByRole('link', { name: 'Personen: 2' });
    expect(persons).not.toHaveTextContent('hier anfangen');
    expect(within(cards()).getByRole('link', { name: 'Tische: 1' })).toBeInTheDocument();
    expect(within(cards()).getByRole('link', { name: 'Spiele: 3' })).toBeInTheDocument();
  });
});
