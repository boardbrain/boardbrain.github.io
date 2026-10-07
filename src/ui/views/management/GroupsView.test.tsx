import { aCustomGame, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toPersonId } from '@/core/model';
import type { BoardBrainDb } from '@/infra/db/database';
import { GroupsView } from './GroupsView';

const NAMES = ['Anna', 'Ben', 'Clara', 'David', 'Eva'];

async function addPersons(db: BoardBrainDb, count: number): Promise<void> {
  await db.persons.bulkAdd(
    NAMES.slice(0, count).map((name, index) =>
      aPerson({ id: toPersonId(`00000000-0000-4000-8000-0000000000a${String(index + 1)}`), name }),
    ),
  );
}

async function choose(user: ReturnType<typeof userEvent.setup>, ...names: string[]): Promise<void> {
  for (const name of names) {
    await user.click(await screen.findByRole('checkbox', { name }));
  }
}

function pressed(group: string): string | undefined {
  const picker = screen.getByRole('group', { name: group });
  return (
    within(picker)
      .getAllByRole('button')
      .find((button) => button.getAttribute('aria-pressed') === 'true')
      ?.getAttribute('aria-label') ?? undefined
  );
}

describe('US-PG-02 Create a group (group management)', () => {
  it('shows a hint while there are fewer than two persons', async () => {
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 1);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Lege zuerst mindestens zwei Personen an',
    );
  });

  it('AK-1: saves a group with 2 members and shows it in the list', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);

    await choose(user, 'Anna', 'Ben');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    const list = await screen.findByRole('list', { name: 'Alle Gruppen' });
    expect(within(list).getByText('Anna & Ben')).toBeInTheDocument();
    expect(await db.groups.count()).toBe(1);
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Anna' })).not.toBeChecked();
    });
  });

  it('AK-2: suggests the name from the members and allows changing it', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 3);

    await choose(user, 'Anna', 'Ben', 'Clara');

    const name = screen.getByLabelText('Gruppenname');
    expect(name).toHaveValue('Anna, Ben & Clara');
    await user.clear(name);
    await user.type(name, 'Freitag');
    expect(name).toHaveValue('Freitag');
  });

  it('AK-2: the name is required', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);
    await choose(user, 'Anna', 'Ben');

    await user.clear(screen.getByLabelText('Gruppenname'));

    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });

  it('AK-3: saving is impossible with fewer than two members', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);
    const save = screen.getByRole('button', { name: 'Speichern' });

    expect(save).toBeDisabled();
    await choose(user, 'Anna');
    expect(save).toBeDisabled();
    await choose(user, 'Ben');
    expect(save).toBeEnabled();
  });

  it('AK-3: the 13th member cannot be chosen', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await db.persons.bulkAdd(
      Array.from({ length: 13 }, (_, index) =>
        aPerson({
          id: toPersonId(`00000000-0000-4000-8000-0000000001${String(index).padStart(2, '0')}`),
          name: `Person ${String(index).padStart(2, '0')}`,
        }),
      ),
    );

    for (let index = 0; index < 12; index += 1) {
      await user.click(
        await screen.findByRole('checkbox', { name: `Person ${String(index).padStart(2, '0')}` }),
      );
    }

    expect(screen.getByRole('checkbox', { name: 'Person 12' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('12 gewählt');
  });

  it('AK-4: Catan is blocked with the reason from 5 members and available up to 4', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 5);

    await choose(user, 'Anna', 'Ben', 'Clara', 'David');
    expect(screen.getByRole('radio', { name: 'Catan' })).toBeEnabled();
    await choose(user, 'Eva');

    const catan = screen.getByRole('radio', { name: 'Catan' });
    expect(catan).toBeDisabled();
    expect(
      screen.getByText(
        'Catan ist nur für Gruppen mit höchstens 4 Mitgliedern möglich. Diese Gruppe hat 5.',
      ),
    ).toBeInTheDocument();
  });

  it('AK-4: falls back to all games when a Catan group grows to 5 members', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 5);
    await choose(user, 'Anna', 'Ben', 'Clara', 'David');
    await user.click(screen.getByRole('radio', { name: 'Catan' }));

    await choose(user, 'Eva');

    expect(screen.getByRole('radio', { name: 'Alle Spiele' })).toBeChecked();
  });

  it('AK-4: bindings to custom games stay available for large groups', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 5);
    await db.games.add(aCustomGame({ name: 'Uno' }));
    await choose(user, 'Anna', 'Ben', 'Clara', 'David', 'Eva');

    expect(await screen.findByRole('radio', { name: 'Uno' })).toBeEnabled();
  });

  it('AK-5: a person from another group can be chosen again', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 3);
    await choose(user, 'Anna', 'Ben');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await screen.findByText('Anna & Ben');

    await choose(user, 'Anna', 'Clara');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(async () => {
      expect(await db.groups.count()).toBe(2);
    });
  });

  it('AK-6: names the same-named persons and prevents saving', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await db.persons.bulkAdd([
      aPerson({ id: toPersonId('00000000-0000-4000-8000-0000000000a1'), name: 'Anna' }),
      aPerson({ id: toPersonId('00000000-0000-4000-8000-0000000000a2'), name: 'anna' }),
    ]);

    await user.click(await screen.findByRole('checkbox', { name: 'anna' }));
    await user.click(screen.getByRole('checkbox', { name: 'Anna' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Diese Personen heißen gleich: anna, Anna');
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });
});

describe('US-PG-03 Colours of a group', () => {
  it('AK-1: assigns free colours in order when persons are chosen', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 3);

    await choose(user, 'Anna', 'Ben', 'Clara');

    expect(pressed('Gruppenfarbe von Anna')).toBe('Rot');
    expect(pressed('Gruppenfarbe von Ben')).toBe('Blau');
    expect(pressed('Gruppenfarbe von Clara')).toBe('Gelb');
  });

  it('AK-2: a global group of 2 to 4 shows group and Catan colours', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);

    await choose(user, 'Anna', 'Ben');

    expect(pressed('Gruppenfarbe von Anna')).toBe('Rot');
    expect(pressed('Catan-Farbe von Anna')).toBe('Rot');
    expect(pressed('Catan-Farbe von Ben')).toBe('Blau');
  });

  it('AK-3: a group bound to Catan shows only the Catan colour', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);
    await choose(user, 'Anna', 'Ben');

    await user.click(screen.getByRole('radio', { name: 'Catan' }));

    expect(screen.queryByRole('group', { name: 'Gruppenfarbe von Anna' })).not.toBeInTheDocument();
    expect(pressed('Catan-Farbe von Anna (zugleich Gruppenfarbe)')).toBe('Rot');
  });

  it('AK-4: a group of 5 has only group colours', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 5);

    await choose(user, 'Anna', 'Ben', 'Clara', 'David', 'Eva');

    expect(screen.queryByRole('group', { name: /Catan-Farbe/ })).not.toBeInTheDocument();
    expect(pressed('Gruppenfarbe von Eva')).toBe('Violett');
  });

  it('AK-5: choosing a colour that someone else has swaps the two', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);
    await choose(user, 'Anna', 'Ben');

    await user.click(
      within(screen.getByRole('group', { name: 'Gruppenfarbe von Ben' })).getByRole('button', {
        name: 'Rot',
      }),
    );

    expect(pressed('Gruppenfarbe von Ben')).toBe('Rot');
    expect(pressed('Gruppenfarbe von Anna')).toBe('Blau');
  });

  it('AK-5: swaps Catan colours as well', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);
    await choose(user, 'Anna', 'Ben');

    await user.click(
      within(screen.getByRole('group', { name: 'Catan-Farbe von Anna' })).getByRole('button', {
        name: 'Blau',
      }),
    );

    expect(pressed('Catan-Farbe von Anna')).toBe('Blau');
    expect(pressed('Catan-Farbe von Ben')).toBe('Rot');
  });

  it('stores the chosen colours with the group', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);
    await choose(user, 'Anna', 'Ben');
    await user.click(
      within(screen.getByRole('group', { name: 'Gruppenfarbe von Ben' })).getByRole('button', {
        name: 'Rot',
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(async () => {
      const [group] = await db.groups.toArray();
      expect(group?.members.map((member) => member.groupColor)).toEqual(['blue', 'red']);
    });
  });

  it('keeps the colours of remaining members when one is removed', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 3);
    await choose(user, 'Anna', 'Ben', 'Clara');

    await user.click(screen.getByRole('checkbox', { name: 'Ben' }));

    expect(pressed('Gruppenfarbe von Anna')).toBe('Rot');
    expect(pressed('Gruppenfarbe von Clara')).toBe('Gelb');
  });
});
