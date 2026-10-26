import { aCustomGame, aGroup, aPerson } from '@tests/support/masterDataFakes';
import { OverviewRoutes } from '@tests/support/overviewRoutes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, waitFor, within } from '@testing-library/react';
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

describe('US-VW-02 Edit a table (table page)', () => {
  async function openEditor(): Promise<{
    user: ReturnType<typeof userEvent.setup>;
    db: BoardBrainDb;
  }> {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await addAnnaAndBen(db);
    await db.groups.add(aGroup({ id: FRIDAY, name: 'Freitagsrunde' }));
    await user.click(await screen.findByRole('link', { name: 'Bearbeiten' }));
    return { user, db };
  }

  it('AK-1, AK-2: opens the editor with the stored values and without a bench', async () => {
    await openEditor();

    const editor = await screen.findByRole('dialog', { name: 'Tisch bearbeiten' });
    expect(within(editor).getByLabelText('Gruppenname')).toHaveValue('Freitagsrunde');
    expect(within(editor).getByText(/Wer am Tisch sitzt, bleibt fest/)).toBeInTheDocument();
    expect(within(editor).queryByRole('heading', { name: 'Wer spielt mit?' })).toBeNull();
    expect(within(editor).getByRole('button', { name: 'Änderungen speichern' })).toBeDisabled();
  });

  it('AK-1: saves a new name and colours and closes the editor', async () => {
    const { user, db } = await openEditor();
    const editor = await screen.findByRole('dialog', { name: 'Tisch bearbeiten' });

    await user.clear(within(editor).getByLabelText('Gruppenname'));
    await user.type(within(editor).getByLabelText('Gruppenname'), 'Zu zweit');
    await user.click(within(editor).getByRole('button', { name: 'Gelb' }));
    await user.click(within(editor).getByRole('button', { name: 'Änderungen speichern' }));

    expect(await screen.findByRole('heading', { name: 'Zu zweit', level: 1 })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    const stored = await db.groups.get(FRIDAY);
    expect(stored?.name).toBe('Zu zweit');
    expect(stored?.members[0]?.groupColor).toBe('yellow');
  });

  it('AK-6: excluding Catan drops the Catan colours', async () => {
    const { user, db } = await openEditor();
    const editor = await screen.findByRole('dialog', { name: 'Tisch bearbeiten' });

    await user.click(within(editor).getByRole('switch', { name: /Catan ausschließen/ }));
    await user.click(within(editor).getByRole('button', { name: 'Änderungen speichern' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    const stored = await db.groups.get(FRIDAY);
    expect(stored?.binding).toEqual({ kind: 'global', excludesCatan: true });
    expect(stored?.members.every((member) => member.catanColor === undefined)).toBe(true);
  });

  it('closing with unsaved changes asks first', async () => {
    const { user } = await openEditor();
    const editor = await screen.findByRole('dialog', { name: 'Tisch bearbeiten' });
    await user.type(within(editor).getByLabelText('Gruppenname'), '!');

    await user.click(within(editor).getByRole('button', { name: 'Schließen' }));

    expect(
      await screen.findByRole('alertdialog', { name: 'Änderungen verwerfen?' }),
    ).toHaveTextContent('Deine Änderungen an „Freitagsrunde“ sind noch nicht gespeichert.');
  });

  it('closing without changes goes back to the table page', async () => {
    const { user } = await openEditor();

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Schließen' }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Freitagsrunde', level: 1 })).toBeInTheDocument();
  });
});
