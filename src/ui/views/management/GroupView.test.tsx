import { aCustomGame, aGroup, aPerson } from '@tests/support/masterDataFakes';
import { OverviewRoutes } from '@tests/support/overviewRoutes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toGroupId, toPersonId } from '@/core/model';
import { CATAN_GAME_ID } from '@/games/catan';
import type { BoardBrainDb } from '@/infra/db/database';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const FRIDAY = toGroupId('00000000-0000-4000-8000-0000000000c1');
const PATH = `/verwaltung/gruppen/${FRIDAY}`;

async function addAnnaAndBen(db: BoardBrainDb): Promise<void> {
  await db.persons.bulkAdd([
    aPerson({ id: ANNA, name: 'Anna' }),
    aPerson({ id: BEN, name: 'Ben' }),
  ]);
}

describe('US-VW-05 Persons and tables in the overview (table page)', () => {
  it('AK-3: shows name, binding, number, date and the members with their colours', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await addAnnaAndBen(db);
    await db.groups.add(aGroup({ id: FRIDAY, name: 'Freitagsrunde' }));

    expect(
      await screen.findByRole('heading', { name: 'Freitagsrunde', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Alle Spiele').length).toBeGreaterThan(0);
    expect(screen.getByText('Personen')).toBeInTheDocument();
    expect(screen.getByText('angelegt am 07.10.2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Am Tisch · 2', level: 2 })).toBeInTheDocument();
    const members = within(screen.getByRole('list', { name: 'Mitglieder' })).getAllByRole('link');
    expect(members.map((link) => link.textContent)).toEqual(['AAnnaRot', 'BBenBlau']);
  });

  it('AK-3: does not show Catan colours, only in the editor', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await addAnnaAndBen(db);
    await db.groups.add(
      aGroup({
        id: FRIDAY,
        members: [
          { personId: ANNA, groupColor: 'yellow', catanColor: 'red' },
          { personId: BEN, groupColor: 'green', catanColor: 'white' },
        ],
      }),
    );

    expect(await screen.findByRole('link', { name: 'Anna, Gelb' })).toBeInTheDocument();
    expect(screen.queryByText('Rot')).not.toBeInTheDocument();
    expect(screen.queryByText('Weiß')).not.toBeInTheDocument();
  });

  it('AK-3: names the bound game as "Nur …" for Catan and custom games', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await addAnnaAndBen(db);
    await db.games.add(aCustomGame({ name: 'Uno' }));
    await db.groups.add(
      aGroup({ id: FRIDAY, binding: { kind: 'game', gameId: aCustomGame().id } }),
    );

    expect((await screen.findAllByText('Nur Uno')).length).toBeGreaterThan(0);
    await db.groups.put(aGroup({ id: FRIDAY, binding: { kind: 'game', gameId: CATAN_GAME_ID } }));
    expect((await screen.findAllByText('Nur Catan')).length).toBeGreaterThan(0);
    await db.groups.put(aGroup({ id: FRIDAY, binding: { kind: 'global', excludesCatan: true } }));
    expect((await screen.findAllByText('Alle Spiele ohne Catan')).length).toBeGreaterThan(0);
  });

  it('AK-4: a member in the list opens the page of the person', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await addAnnaAndBen(db);
    await db.groups.add(aGroup({ id: FRIDAY, name: 'Freitagsrunde' }));

    const members = await screen.findByRole('list', { name: 'Mitglieder' });
    await user.click(within(members).getByRole('link', { name: /Ben/ }));

    expect(await screen.findByRole('heading', { name: 'Ben', level: 1 })).toBeInTheDocument();
  });

  it('AK-4: every seat at the big table opens the page of the person', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await addAnnaAndBen(db);
    await db.groups.add(aGroup({ id: FRIDAY, name: 'Freitagsrunde' }));

    const seat = await screen.findByRole('link', { name: 'Anna, Rot' });
    expect(seat).toHaveAttribute('href', `/verwaltung/personen/${ANNA}`);
    await user.click(seat);

    expect(await screen.findByRole('heading', { name: 'Anna', level: 1 })).toBeInTheDocument();
  });

  it('shows a hint for an address without a known table', async () => {
    renderWithApp(<OverviewRoutes />, { path: '/verwaltung/gruppen/unbekannt' });

    expect(await screen.findByText('Diesen Tisch gibt es nicht.')).toBeInTheDocument();
  });
});
