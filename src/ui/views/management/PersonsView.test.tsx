import { aGroup, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toGroupId, toPersonId } from '@/core/model';
import { PersonsView } from './PersonsView';

type User = ReturnType<typeof userEvent.setup>;

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const ZOE = toPersonId('00000000-0000-4000-8000-0000000000a3');

// Accessible names of the person cards, e.g. "Anna: Freitagsrunde, Familie".
async function personCards(): Promise<(string | null)[]> {
  const list = await screen.findByRole('list', { name: 'Alle Personen' });
  return within(list)
    .getAllByRole('link')
    .map((link) => link.getAttribute('aria-label'));
}

async function personNames(): Promise<string[]> {
  return (await personCards()).map((label) => label?.split(':')[0] ?? '');
}

async function nameField(): Promise<HTMLElement> {
  return screen.findByLabelText('Name');
}

// With persons the form is closed until "new person" is chosen.
async function openForm(user: User): Promise<void> {
  const [plus] = await screen.findAllByRole('button', { name: 'Neue Person' });
  if (plus === undefined) {
    throw new Error('button "Neue Person" is missing');
  }
  await user.click(plus);
}

describe('US-PG-01 Create a person (person management)', () => {
  it('shows a hint and the form while there are no persons', async () => {
    renderWithApp(<PersonsView />);

    expect(await screen.findByText('Noch keine Personen angelegt.')).toBeInTheDocument();
    expect(await nameField()).toBeInTheDocument();
  });

  it('AK-1: shows the saved person in the person list and empties the field', async () => {
    const user = userEvent.setup();
    renderWithApp(<PersonsView />);

    await user.type(await nameField(), '  Anna ');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await expect.poll(personNames).toEqual(['Anna']);
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('');
    });
  });

  it('AK-1: keeps a name that was typed while the previous save was still running', async () => {
    const user = userEvent.setup();
    let releaseSave = (): void => undefined;
    const release = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    renderWithApp(<PersonsView />, {
      wrapMasterData: (service) => ({
        ...service,
        createPerson: async (input) => {
          await release;
          return service.createPerson(input);
        },
      }),
    });

    await user.type(await nameField(), 'Anna');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Ben');
    releaseSave();

    await expect.poll(personNames).toEqual(['Anna']);
    // Saving has finished once the button is enabled again.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Speichern' })).toBeEnabled();
    });
    expect(screen.getByLabelText('Name')).toHaveValue('Ben');
  });

  it('AK-1: lists persons alphabetically', async () => {
    const { db } = renderWithApp(<PersonsView />);

    await db.persons.bulkAdd([
      aPerson({ id: toPersonId('00000000-0000-4000-8000-0000000000c1'), name: 'Clara' }),
      aPerson({ id: toPersonId('00000000-0000-4000-8000-0000000000c2'), name: 'anna' }),
      aPerson({ id: toPersonId('00000000-0000-4000-8000-0000000000c3'), name: 'Ben' }),
    ]);

    await expect.poll(personNames).toEqual(['anna', 'Ben', 'Clara']);
  });

  it('AK-2: saving is impossible with an empty or blank name', async () => {
    const user = userEvent.setup();
    renderWithApp(<PersonsView />);
    const field = await nameField();
    const save = screen.getByRole('button', { name: 'Speichern' });

    expect(save).toBeDisabled();
    await user.type(field, '   ');
    expect(save).toBeDisabled();
    await user.type(field, 'A');
    expect(save).toBeEnabled();
  });

  it('AK-3: shows a same-named person while typing and blocks saving', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<PersonsView />);
    await db.persons.add(aPerson({ name: 'Anna', archived: true }));
    await expect.poll(personNames).toEqual(['Anna']);

    await openForm(user);
    await user.type(await nameField(), ' anna');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Es gibt bereits eine Person namens „anna“. Bitte wähle einen anderen Namen.',
    );
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
    await user.keyboard('{Enter}');
    expect(await db.persons.count()).toBe(1);
  });

  it('AK-3: changing the name removes the error', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<PersonsView />);
    await db.persons.add(aPerson({ name: 'Anna' }));
    await expect.poll(personNames).toEqual(['Anna']);

    await openForm(user);
    await user.type(await nameField(), 'Anna');
    await user.type(screen.getByLabelText('Name'), 'lena');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeEnabled();
  });

  it('closes the form with "new person" once persons exist', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<PersonsView />);
    await db.persons.add(aPerson({ name: 'Anna' }));
    await expect.poll(personNames).toEqual(['Anna']);
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();

    await openForm(user);
    expect(await nameField()).toHaveFocus();
    await openForm(user);

    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });
});

describe('US-VW-05 Persons and tables in the overview (person list)', () => {
  it('AK-1: shows the names of the tables of each person or that they sit at none', async () => {
    const { db } = renderWithApp(<PersonsView />);

    await db.persons.bulkAdd([
      aPerson({ id: ANNA, name: 'Anna' }),
      aPerson({ id: BEN, name: 'Ben' }),
      aPerson({ id: ZOE, name: 'Zoe' }),
    ]);
    await db.groups.bulkAdd([
      aGroup({ id: toGroupId('00000000-0000-4000-8000-0000000000c1'), name: 'Freitagsrunde' }),
      aGroup({ id: toGroupId('00000000-0000-4000-8000-0000000000c2'), name: 'Familie' }),
    ]);

    await expect
      .poll(personCards)
      .toEqual([
        'Anna: Familie, Freitagsrunde',
        'Ben: Familie, Freitagsrunde',
        'Zoe: an keinem Tisch',
      ]);
    const list = screen.getByRole('list', { name: 'Alle Personen' });
    expect(within(list).getByText('an keinem Tisch')).toBeVisible();
    expect(within(list).getAllByText('Familie, Freitagsrunde')).toHaveLength(2);
  });

  it('AK-2: every person card opens the page of the person', async () => {
    const { db } = renderWithApp(<PersonsView />);

    await db.persons.add(aPerson({ id: ANNA, name: 'Anna' }));

    const card = await screen.findByRole('link', { name: 'Anna: an keinem Tisch' });
    expect(card).toHaveAttribute('href', `/verwaltung/personen/${ANNA}`);
  });

  it('shows at most four colour dots and the rest as "+n"', async () => {
    const { db } = renderWithApp(<PersonsView />);

    await db.persons.bulkAdd([
      aPerson({ id: ANNA, name: 'Anna' }),
      aPerson({ id: BEN, name: 'Ben' }),
    ]);
    await db.groups.bulkAdd(
      Array.from({ length: 7 }, (_, index) =>
        aGroup({
          id: toGroupId(`00000000-0000-4000-8000-0000000000d${String(index)}`),
          name: `Tisch ${String(index)}`,
        }),
      ),
    );

    const card = await screen.findByRole('link', { name: /^Anna: Tisch 0/ });
    expect(within(card).getByText('+3')).toBeInTheDocument();
  });

  it('finds persons by name and hides "new person" while searching', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<PersonsView />);
    await db.persons.bulkAdd([
      aPerson({ id: ANNA, name: 'Anna' }),
      aPerson({ id: BEN, name: 'Ben' }),
    ]);
    await expect.poll(personNames).toEqual(['Anna', 'Ben']);

    await user.click(screen.getByRole('button', { name: 'Personen suchen' }));
    await user.type(screen.getByRole('searchbox', { name: 'Person suchen' }), 'be');

    await expect.poll(personNames).toEqual(['Ben']);
    const list = screen.getByRole('list', { name: 'Alle Personen' });
    expect(within(list).queryByRole('button', { name: 'Neue Person' })).not.toBeInTheDocument();
  });

  it('says so when the search finds nobody and clears the search when closed', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<PersonsView />);
    await db.persons.add(aPerson({ id: ANNA, name: 'Anna' }));
    await expect.poll(personNames).toEqual(['Anna']);

    await user.click(screen.getByRole('button', { name: 'Personen suchen' }));
    await user.type(screen.getByRole('searchbox', { name: 'Person suchen' }), ' Xaver ');

    expect(await screen.findByText('Keine Person gefunden für „Xaver“.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Suche leeren und schließen' }));
    await expect.poll(personNames).toEqual(['Anna']);
  });
});
