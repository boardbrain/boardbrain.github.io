import { aCustomGame, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toGroupId, toPersonId } from '@/core/model';
import type { BoardBrainDb } from '@/infra/db/database';
import { GroupsView } from './GroupsView';

type User = ReturnType<typeof userEvent.setup>;

const NOW = '2026-10-07T18:30:00.000Z';
const NAMES = ['Anna', 'Ben', 'Clara', 'David', 'Eva'];

async function addPersons(db: BoardBrainDb, count: number): Promise<void> {
  await db.persons.bulkAdd(
    NAMES.slice(0, count).map((name, index) =>
      aPerson({ id: toPersonId(`00000000-0000-4000-8000-0000000000a${String(index + 1)}`), name }),
    ),
  );
}

async function openEditor(user: User): Promise<void> {
  const button = await screen.findByRole('button', { name: 'Neuer Tisch' });
  await waitFor(() => {
    expect(button).toBeEnabled();
  });
  await user.click(button);
}

async function bring(user: User, ...names: string[]): Promise<void> {
  for (const name of names) {
    await user.click(await screen.findByRole('button', { name }));
  }
}

function pressedColor(group: string): string | undefined {
  return (
    within(screen.getByRole('group', { name: group }))
      .getAllByRole('button')
      .find((button) => button.getAttribute('aria-pressed') === 'true')
      ?.getAttribute('aria-label') ?? undefined
  );
}

async function setUpEditor(user: User, count: number, ...names: string[]): Promise<BoardBrainDb> {
  const { db } = renderWithApp(<GroupsView />);
  await addPersons(db, count);
  await openEditor(user);
  await bring(user, ...names);
  return db;
}

describe('US-PG-02 The room with all tables', () => {
  it('shows a hint and a blocked "new table" with fewer than two persons', async () => {
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 1);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Lege zuerst mindestens zwei Personen an',
    );
    expect(screen.getByRole('button', { name: 'Neuer Tisch' })).toBeDisabled();
  });

  it('shows a hint while there are no groups', async () => {
    renderWithApp(<GroupsView />);

    expect(await screen.findByText('Noch keine Tische angelegt.')).toBeInTheDocument();
  });

  it('AK-1: saves a group of 2 and shows it as a table with name, game and number', async () => {
    const user = userEvent.setup();
    const db = await setUpEditor(user, 2, 'Anna', 'Ben');

    await user.click(screen.getByRole('button', { name: 'Gruppe anlegen' }));

    const room = await screen.findByRole('list', { name: 'Alle Tische' });
    expect(await within(room).findByText('Anna & Ben')).toBeInTheDocument();
    expect(within(room).getByText('Alle Spiele · 2')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await db.groups.count()).toBe(1);
  });

  it('closes the editor with the back button and with Escape', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);
    await openEditor(user);

    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openEditor(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the game of a bound group and "ohne Catan" for an excluding group', async () => {
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);
    const uno = aCustomGame({ name: 'Uno' });
    await db.games.add(uno);
    const members = [
      { personId: toPersonId('00000000-0000-4000-8000-0000000000a1'), groupColor: 'red' },
      { personId: toPersonId('00000000-0000-4000-8000-0000000000a2'), groupColor: 'blue' },
    ] as const;
    const base = { archived: false, members, createdAt: NOW, updatedAt: NOW };
    await db.groups.bulkAdd([
      {
        ...base,
        id: toGroupId('00000000-0000-4000-8000-0000000000c1'),
        name: 'Ohne',
        binding: { kind: 'global', excludesCatan: true },
      },
      {
        ...base,
        id: toGroupId('00000000-0000-4000-8000-0000000000c2'),
        name: 'Uno-Runde',
        binding: { kind: 'game', gameId: uno.id },
      },
    ]);

    expect(await screen.findByText('Alle Spiele ohne Catan · 2')).toBeInTheDocument();
    expect(screen.getByText('Uno · 2')).toBeInTheDocument();
  });
});

describe('US-VW-05 Search in the room', () => {
  async function withGroups(): Promise<{ user: User }> {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 3);
    await openEditor(user);
    await bring(user, 'Anna', 'Ben');
    await user.clear(screen.getByLabelText('Gruppenname'));
    await user.type(screen.getByLabelText('Gruppenname'), 'Freitag');
    await user.click(screen.getByRole('button', { name: 'Gruppe anlegen' }));
    await screen.findByText('Freitag');
    await openEditor(user);
    await bring(user, 'Ben', 'Clara');
    await user.clear(screen.getByLabelText('Gruppenname'));
    await user.type(screen.getByLabelText('Gruppenname'), 'Familie');
    await user.click(screen.getByRole('button', { name: 'Gruppe anlegen' }));
    await screen.findByText('Familie');
    return { user };
  }

  it('opens a search field with the lupe and filters by group name', async () => {
    const { user } = await withGroups();

    await user.click(screen.getByRole('button', { name: 'Gruppen suchen' }));
    await user.keyboard('fam');

    const room = screen.getByRole('list', { name: 'Alle Tische' });
    expect(within(room).queryByText('Freitag')).not.toBeInTheDocument();
    expect(within(room).getByText('Familie')).toBeInTheDocument();
  });

  it('finds groups by a member and says who sits there', async () => {
    const { user } = await withGroups();

    await user.click(screen.getByRole('button', { name: 'Gruppen suchen' }));
    await user.keyboard('clara');

    expect(screen.getByText('Clara sitzt hier')).toBeInTheDocument();
    expect(screen.queryByText('Freitag')).not.toBeInTheDocument();
  });

  it('says so if nothing is found and closes and clears with the cross', async () => {
    const { user } = await withGroups();
    await user.click(screen.getByRole('button', { name: 'Gruppen suchen' }));

    await user.keyboard('Zoe');
    expect(screen.getByText('Keine Gruppe gefunden für „Zoe“.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Suche leeren und schließen' }));
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByText('Freitag')).toBeInTheDocument();
  });
});

describe('US-PG-02 Bring persons to the table', () => {
  it('AK-2: suggests the name from the members and allows changing it', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 3, 'Anna', 'Ben', 'Clara');

    const name = screen.getByLabelText('Gruppenname');
    expect(name).toHaveValue('Anna, Ben & Clara');
    await user.clear(name);
    await user.type(name, 'Freitag');
    expect(name).toHaveValue('Freitag');
  });

  it('AK-2: the name is required', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 2, 'Anna', 'Ben');

    await user.clear(screen.getByLabelText('Gruppenname'));

    expect(screen.getByRole('button', { name: 'Gruppe anlegen' })).toBeDisabled();
  });

  it('AK-3: saving is impossible with fewer than two members', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 2, 'Anna');
    const save = screen.getByRole('button', { name: 'Gruppe anlegen' });

    expect(save).toBeDisabled();
    await bring(user, 'Ben');
    expect(save).toBeEnabled();
  });

  it('AK-3: the 13th person cannot join', async () => {
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
    await openEditor(user);

    for (let index = 0; index < 12; index += 1) {
      await user.click(
        await screen.findByRole('button', { name: `Person ${String(index).padStart(2, '0')}` }),
      );
    }

    expect(screen.getByRole('button', { name: 'Person 12' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('12 am Tisch');
  });

  it('AK-4: Catan is blocked with the reason from 5 members and available up to 4', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 5, 'Anna', 'Ben', 'Clara', 'David');
    expect(screen.getByRole('button', { name: 'Nur Catan' })).toBeEnabled();

    await bring(user, 'Eva');

    expect(screen.getByRole('button', { name: 'Nur Catan' })).toBeDisabled();
    expect(
      screen.getByText('Catan geht nur mit höchstens 4 Personen. Dieser Tisch hat 5.'),
    ).toBeInTheDocument();
  });

  it('AK-4: falls back to all games when a Catan group grows to 5 members', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 5, 'Anna', 'Ben', 'Clara', 'David');
    await user.click(screen.getByRole('button', { name: 'Nur Catan' }));

    await bring(user, 'Eva');

    expect(screen.getByRole('button', { name: 'Alle Spiele' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('AK-4: bindings to custom games stay available for large groups', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 5);
    await db.games.add(aCustomGame({ name: 'Uno' }));
    await openEditor(user);
    await bring(user, 'Anna', 'Ben', 'Clara', 'David', 'Eva');
    await user.click(await screen.findByRole('button', { name: 'Anderes Spiel ▾' }));

    expect(screen.getByRole('button', { name: 'Nur Uno' })).toBeEnabled();
  });

  it('AK-4: a group bound to an own game is saved with that game', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await addPersons(db, 2);
    const uno = aCustomGame({ name: 'Uno' });
    await db.games.add(uno);
    await openEditor(user);
    await bring(user, 'Anna', 'Ben');

    await user.click(await screen.findByRole('button', { name: 'Anderes Spiel ▾' }));
    await user.click(screen.getByRole('button', { name: 'Nur Uno' }));
    await user.click(screen.getByRole('button', { name: 'Gruppe anlegen' }));

    await waitFor(async () => {
      expect((await db.groups.toArray())[0]?.binding).toEqual({ kind: 'game', gameId: uno.id });
    });
  });

  it('AK-5: a person from another group can join another table', async () => {
    const user = userEvent.setup();
    const db = await setUpEditor(user, 3, 'Anna', 'Ben');
    await user.click(screen.getByRole('button', { name: 'Gruppe anlegen' }));
    await screen.findByText('Anna & Ben');

    await openEditor(user);
    await bring(user, 'Anna', 'Clara');
    await user.click(screen.getByRole('button', { name: 'Gruppe anlegen' }));

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
    await openEditor(user);

    await bring(user, 'anna', 'Anna');

    expect(screen.getByRole('alert')).toHaveTextContent('Diese Personen heißen gleich: anna, Anna');
    expect(screen.getByRole('button', { name: 'Gruppe anlegen' })).toBeDisabled();
  });
});

describe('E-27 Exclude Catan', () => {
  it('US-PG-02 AK-7: the switch removes the Catan colours of a global group of 3', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 3, 'Anna', 'Ben', 'Clara');
    expect(screen.getByRole('group', { name: 'Catan-Farbe von Clara' })).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: /Catan ausschließen/ }));

    expect(screen.getByRole('switch')).toBeChecked();
    expect(screen.queryByRole('group', { name: /Catan-Farbe/ })).not.toBeInTheDocument();
    expect(screen.getByText('Alle Spiele ohne Catan')).toBeInTheDocument();
  });

  it('US-PG-02 AK-7: saves the exclusion with the group', async () => {
    const user = userEvent.setup();
    const db = await setUpEditor(user, 3, 'Anna', 'Ben', 'Clara');
    await user.click(screen.getByRole('switch', { name: /Catan ausschließen/ }));

    await user.click(screen.getByRole('button', { name: 'Gruppe anlegen' }));

    await waitFor(async () => {
      const [group] = await db.groups.toArray();
      expect(group?.binding).toEqual({ kind: 'global', excludesCatan: true });
      expect(group?.members.every((member) => !('catanColor' in member))).toBe(true);
    });
  });

  it('US-PG-02 AK-7: turning it off brings the Catan colours back', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 3, 'Anna', 'Ben');
    await user.click(screen.getByRole('switch', { name: /Catan ausschließen/ }));

    await user.click(screen.getByRole('switch', { name: /Catan ausschließen/ }));

    expect(pressedColor('Catan-Farbe von Ben')).toBe('Blau');
  });

  it('the switch is on and blocked from 5 members, because Catan is excluded anyway', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 5, 'Anna', 'Ben', 'Clara', 'David', 'Eva');

    const toggle = screen.getByRole('switch', { name: /Catan ausschließen/ });

    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
    expect(screen.getByText('Ab 5 Personen ist Catan ohnehin ausgeschlossen.')).toBeInTheDocument();
  });

  it('there is no switch for a group bound to a game', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 3, 'Anna', 'Ben');

    await user.click(screen.getByRole('button', { name: 'Nur Catan' }));

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});

describe('US-PG-03 Colours of a group', () => {
  it('AK-1: assigns free colours in order when persons join', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 3, 'Anna', 'Ben', 'Clara');

    await user.click(screen.getByRole('button', { name: /^Anna, Rot/ }));
    expect(pressedColor('Gruppenfarbe von Anna')).toBe('Rot');
    await user.click(screen.getByRole('button', { name: /^Ben, Blau/ }));
    expect(pressedColor('Gruppenfarbe von Ben')).toBe('Blau');
    await user.click(screen.getByRole('button', { name: /^Clara, Gelb/ }));
    expect(pressedColor('Gruppenfarbe von Clara')).toBe('Gelb');
  });

  it('AK-2: a global group of 2 to 4 shows group and Catan colours', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 2, 'Anna', 'Ben');

    await user.click(screen.getByRole('button', { name: /^Anna, / }));

    expect(pressedColor('Gruppenfarbe von Anna')).toBe('Rot');
    expect(pressedColor('Catan-Farbe von Anna')).toBe('Rot');
    expect(screen.getByRole('button', { name: 'Anna, Rot, Catan Rot' })).toBeInTheDocument();
  });

  it('AK-3: a group bound to Catan shows only the Catan colour', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 2, 'Anna', 'Ben');

    await user.click(screen.getByRole('button', { name: 'Nur Catan' }));

    expect(screen.queryByRole('group', { name: 'Gruppenfarbe von Ben' })).not.toBeInTheDocument();
    expect(pressedColor('Catan-Farbe von Ben (zugleich Gruppenfarbe)')).toBe('Blau');
  });

  it('AK-4: a group of 5 has only group colours', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 5, 'Anna', 'Ben', 'Clara', 'David', 'Eva');

    expect(screen.queryByRole('group', { name: /Catan-Farbe/ })).not.toBeInTheDocument();
    expect(pressedColor('Gruppenfarbe von Eva')).toBe('Indigo');
  });

  it('AK-5: choosing a colour that someone else has swaps the two', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 2, 'Anna', 'Ben');
    await user.click(screen.getByRole('button', { name: /^Ben, / }));

    await user.click(
      within(screen.getByRole('group', { name: 'Gruppenfarbe von Ben' })).getByRole('button', {
        name: 'Rot, hat Anna',
      }),
    );

    expect(pressedColor('Gruppenfarbe von Ben')).toBe('Rot');
    await user.click(screen.getByRole('button', { name: /^Anna, / }));
    expect(pressedColor('Gruppenfarbe von Anna')).toBe('Blau');
  });

  it('AK-5: swaps Catan colours as well', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 2, 'Anna', 'Ben');
    await user.click(screen.getByRole('button', { name: /^Anna, / }));

    await user.click(
      within(screen.getByRole('group', { name: 'Catan-Farbe von Anna' })).getByRole('button', {
        name: 'Blau, hat Ben',
      }),
    );

    expect(pressedColor('Catan-Farbe von Anna')).toBe('Blau');
    await user.click(screen.getByRole('button', { name: /^Ben, / }));
    expect(pressedColor('Catan-Farbe von Ben')).toBe('Rot');
  });

  it('stores the chosen colours with the group', async () => {
    const user = userEvent.setup();
    const db = await setUpEditor(user, 2, 'Anna', 'Ben');
    await user.click(screen.getByRole('button', { name: /^Ben, / }));
    await user.click(
      within(screen.getByRole('group', { name: 'Gruppenfarbe von Ben' })).getByRole('button', {
        name: 'Rot, hat Anna',
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Gruppe anlegen' }));

    await waitFor(async () => {
      const [group] = await db.groups.toArray();
      expect(group?.members.map((member) => member.groupColor)).toEqual(['blue', 'red']);
    });
  });

  it('keeps the colours of remaining members when one leaves', async () => {
    const user = userEvent.setup();
    await setUpEditor(user, 3, 'Anna', 'Ben', 'Clara');

    await user.click(screen.getByRole('button', { name: 'Ben' }));

    expect(screen.getByRole('button', { name: /^Anna, Rot/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Clara, Gelb/ })).toBeInTheDocument();
  });
});

describe('US-PG-02 The bench', () => {
  async function manyPersons(): Promise<User> {
    const user = userEvent.setup();
    const { db } = renderWithApp(<GroupsView />);
    await db.persons.bulkAdd(
      Array.from({ length: 28 }, (_, index) =>
        aPerson({
          id: toPersonId(`00000000-0000-4000-8000-0000000004${String(index).padStart(2, '0')}`),
          name: index === 21 ? 'Valentina' : `Person ${String(index).padStart(2, '0')}`,
        }),
      ),
    );
    await openEditor(user);
    return user;
  }

  it('shows the number of all persons on the button that expands the bench', async () => {
    await manyPersons();

    expect(await screen.findByRole('button', { name: 'Alle 28 ▾' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('expands the bench with a search field and collapses it again', async () => {
    const user = await manyPersons();

    await user.click(await screen.findByRole('button', { name: 'Alle 28 ▾' }));
    await user.type(screen.getByRole('searchbox', { name: 'Person suchen' }), 'val');

    expect(screen.getByRole('button', { name: 'Valentina' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Person 00' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Weniger ▴' }));
    expect(screen.getByRole('button', { name: 'Alle 28 ▾' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('does not focus the search field on touch screens, so no keyboard pops up', async () => {
    const user = await manyPersons();

    await user.click(await screen.findByRole('button', { name: 'Alle 28 ▾' }));

    expect(screen.getByRole('searchbox', { name: 'Person suchen' })).not.toHaveFocus();
  });

  it('says so if no person matches the search', async () => {
    const user = await manyPersons();
    await user.click(await screen.findByRole('button', { name: 'Alle 28 ▾' }));

    await user.type(screen.getByRole('searchbox', { name: 'Person suchen' }), 'xyz');

    expect(screen.getByText('Keine Person gefunden.')).toBeInTheDocument();
  });

  it('keeps persons at the table while the bench is searched', async () => {
    const user = await manyPersons();
    await user.click(await screen.findByRole('button', { name: 'Valentina' }));
    await user.click(screen.getByRole('button', { name: 'Alle 28 ▾' }));

    await user.type(screen.getByRole('searchbox', { name: 'Person suchen' }), 'val');

    expect(screen.getByRole('button', { name: 'Valentina' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
