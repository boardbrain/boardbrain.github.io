import { aCustomGame, aGroup, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { toPersonId } from '@/core/model';
import { ManagementView } from './ManagementView';

describe('Architecture 13.1 management overview (design D-3)', () => {
  it('leads to persons, tables and games as playing cards', async () => {
    renderWithApp(<ManagementView />);

    expect(screen.getByRole('heading', { level: 1, name: 'Verwaltung' })).toBeInTheDocument();
    const areas = screen.getByRole('navigation', { name: 'Bereiche der Verwaltung' });
    const links = await within(areas).findAllByRole('link');
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Personen: 0',
      'Tische: 0',
      'Spiele: 1',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/verwaltung/personen',
      '/verwaltung/gruppen',
      '/verwaltung/spiele',
    ]);
  });

  it('shows the first names of each area below the title', async () => {
    const { db } = renderWithApp(<ManagementView />);
    await db.persons.bulkAdd(
      ['Anna', 'Ben', 'Clara', 'David'].map((name, index) =>
        aPerson({
          id: toPersonId(`00000000-0000-4000-8000-0000000000a${String(index + 1)}`),
          name,
        }),
      ),
    );
    await db.groups.add(aGroup({ name: 'Freitagsrunde' }));
    await db.games.add(aCustomGame());

    expect(await screen.findByRole('link', { name: 'Personen: 4' })).toHaveTextContent(
      'Anna, Ben, Clara',
    );
    expect(screen.getByRole('link', { name: 'Tische: 1' })).toHaveTextContent('Freitagsrunde');
    expect(screen.getByRole('link', { name: 'Spiele: 2' })).toHaveTextContent('Catan, Uno');
  });
});
