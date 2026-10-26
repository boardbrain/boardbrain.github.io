import { aGroup, aPerson } from '@tests/support/masterDataFakes';
import { OverviewRoutes } from '@tests/support/overviewRoutes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toGroupId, toPersonId } from '@/core/model';
import type { BoardBrainDb } from '@/infra/db/database';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const ZOE = toPersonId('00000000-0000-4000-8000-0000000000a3');
const FRIDAY = toGroupId('00000000-0000-4000-8000-0000000000c1');

async function addAnnaAndBen(db: BoardBrainDb): Promise<void> {
  await db.persons.bulkAdd([
    aPerson({ id: ANNA, name: 'Anna' }),
    aPerson({ id: BEN, name: 'Ben' }),
  ]);
}

function rowNames(): string[] {
  return within(screen.getByRole('list', { name: 'Tische' }))
    .getAllByRole('link')
    .map((link) => link.querySelector('strong')?.textContent ?? '');
}

describe('US-VW-05 Persons and tables in the overview (person page)', () => {
  it('AK-2: shows name, date, numbers and the tables of the person with her colour', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: `/verwaltung/personen/${ANNA}` });
    await addAnnaAndBen(db);
    await db.groups.add(aGroup({ id: FRIDAY, name: 'Freitagsrunde' }));

    expect(await screen.findByRole('heading', { name: 'Anna', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('dabei seit 07.10.2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tische · 1', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Tisch')).toBeInTheDocument();
    expect(screen.getByText('Mitspieler')).toBeInTheDocument();
    const row = within(screen.getByRole('list', { name: 'Tische' })).getByRole('link');
    expect(row).toHaveTextContent('Freitagsrunde');
    // Group colour only; the Catan colour of the member is not shown (PO decision I1-E).
    expect(row).toHaveTextContent('Alle Spiele · Rot');
  });

  it('AK-2: says that a person without tables sits at none', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: `/verwaltung/personen/${ZOE}` });
    await db.persons.add(aPerson({ id: ZOE, name: 'Zoe' }));

    expect(await screen.findByText('Zoe sitzt noch an keinem Tisch.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tische · 0', level: 2 })).toBeInTheDocument();
  });

  it('AK-3: a table of the person opens the table page', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: `/verwaltung/personen/${ANNA}` });
    await addAnnaAndBen(db);
    await db.groups.add(aGroup({ id: FRIDAY, name: 'Freitagsrunde' }));

    await user.click(await screen.findByRole('link', { name: /Freitagsrunde/ }));

    expect(
      await screen.findByRole('heading', { name: 'Freitagsrunde', level: 1 }),
    ).toBeInTheDocument();
  });

  it('collapses seven or more tables to six and shows all on request', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: `/verwaltung/personen/${ANNA}` });
    await addAnnaAndBen(db);
    await db.groups.bulkAdd(
      Array.from({ length: 7 }, (_, index) =>
        aGroup({
          id: toGroupId(`00000000-0000-4000-8000-0000000000d${String(index)}`),
          name: `Tisch ${String(index)}`,
        }),
      ),
    );

    const more = await screen.findByRole('button', { name: 'Alle 7 anzeigen ▾' });
    expect(rowNames()).toHaveLength(6);
    await user.click(more);

    expect(rowNames()).toHaveLength(7);
    await user.click(screen.getByRole('button', { name: 'Weniger ▴' }));
    expect(rowNames()).toHaveLength(6);
  });

  it('shows a hint for an address without a valid or known person', async () => {
    renderWithApp(<OverviewRoutes />, { path: '/verwaltung/personen/unbekannt' });

    expect(await screen.findByText('Diese Person gibt es nicht.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeInTheDocument();
  });

  it('shows a hint for a valid id without a person', async () => {
    renderWithApp(<OverviewRoutes />, { path: `/verwaltung/personen/${ZOE}` });

    expect(await screen.findByText('Diese Person gibt es nicht.')).toBeInTheDocument();
  });
});

describe('US-VW-06 Rename a person (person page)', () => {
  async function startRenaming(): Promise<{
    user: ReturnType<typeof userEvent.setup>;
    db: BoardBrainDb;
  }> {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: `/verwaltung/personen/${ANNA}` });
    await addAnnaAndBen(db);
    await db.persons.add(aPerson({ id: ZOE, name: 'Zoe' }));
    await db.groups.add(aGroup({ id: FRIDAY, name: 'Freitagsrunde' }));
    await user.click(await screen.findByRole('button', { name: 'Umbenennen' }));
    return { user, db };
  }

  it('AK-1: the field replaces the profile and saves the new name', async () => {
    const { user, db } = await startRenaming();
    const field = screen.getByLabelText('Neuer Name');
    expect(field).toHaveValue('Anna');
    expect(screen.queryByText('dabei seit 07.10.2026')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();

    await user.clear(field);
    await user.type(field, ' Annika ');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await screen.findByRole('heading', { name: 'Annika', level: 1 })).toBeInTheDocument();
    // The live query may show the name a moment before the form closes.
    await waitFor(() => {
      expect(screen.queryByLabelText('Neuer Name')).not.toBeInTheDocument();
    });
    expect((await db.persons.get(ANNA))?.name).toBe('Annika');
  });

  it.each([
    ['a member of her table', 'BEN'],
    ['a person without a common table', 'zoe'],
  ])('AK-2: the name of %s is an error while typing', async (_case, name) => {
    const { user, db } = await startRenaming();

    await user.clear(screen.getByLabelText('Neuer Name'));
    await user.type(screen.getByLabelText('Neuer Name'), name);

    expect(screen.getByRole('alert')).toHaveTextContent(
      `Es gibt bereits eine Person namens „${name}“. Bitte wähle einen anderen Namen.`,
    );
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
    expect((await db.persons.get(ANNA))?.name).toBe('Anna');
  });

  it('a blank name shows an error while typing and blocks saving', async () => {
    const { user } = await startRenaming();

    await user.clear(screen.getByLabelText('Neuer Name'));
    await user.type(screen.getByLabelText('Neuer Name'), '  ');

    expect(screen.getByRole('alert')).toHaveTextContent('Bitte gib einen Namen ein.');
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });

  it('cancelling keeps the old name without asking', async () => {
    const { user, db } = await startRenaming();

    await user.type(screen.getByLabelText('Neuer Name'), 'x');
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByLabelText('Neuer Name')).not.toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect((await db.persons.get(ANNA))?.name).toBe('Anna');
  });

  it('Escape cancels as well', async () => {
    const { user } = await startRenaming();

    await user.type(screen.getByLabelText('Neuer Name'), 'x{Escape}');

    expect(screen.queryByLabelText('Neuer Name')).not.toBeInTheDocument();
  });

  it('leaving with an unsaved name asks first', async () => {
    const { user } = await startRenaming();
    await user.type(screen.getByLabelText('Neuer Name'), 'x');

    await user.click(screen.getByRole('link', { name: /Freitagsrunde/ }));
    const question = await screen.findByRole('alertdialog', { name: 'Änderungen verwerfen?' });
    expect(question).toHaveTextContent('Der neue Name „Annax“ ist noch nicht gespeichert.');
    await user.click(within(question).getByRole('button', { name: 'Weiter bearbeiten' }));
    expect(screen.getByLabelText('Neuer Name')).toHaveValue('Annax');

    await user.click(screen.getByRole('link', { name: /Freitagsrunde/ }));
    await user.click(await screen.findByRole('button', { name: 'Verwerfen' }));
    expect(
      await screen.findByRole('heading', { name: 'Freitagsrunde', level: 1 }),
    ).toBeInTheDocument();
  });
});
