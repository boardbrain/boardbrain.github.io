import { aPerson } from '@tests/support/masterDataFakes';
import { toPersonId } from '@/core/model';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PersonsView } from './PersonsView';

async function personNames(): Promise<string[]> {
  const list = await screen.findByRole('list', { name: 'Alle Personen' });
  return within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

describe('US-PG-01 Create a person (person management)', () => {
  it('shows a hint while there are no persons', async () => {
    renderWithApp(<PersonsView />);

    expect(await screen.findByText('Noch keine Personen angelegt.')).toBeInTheDocument();
  });

  it('AK-1: shows the saved person in the person list and empties the field', async () => {
    const user = userEvent.setup();
    renderWithApp(<PersonsView />);

    await user.type(screen.getByLabelText('Name'), '  Anna ');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await personNames()).toEqual(['Anna']);
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

    await user.type(screen.getByLabelText('Name'), 'Anna');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Ben');
    releaseSave();

    expect(await personNames()).toEqual(['Anna']);
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
    const save = screen.getByRole('button', { name: 'Speichern' });

    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText('Name'), '   ');
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText('Name'), 'A');
    expect(save).toBeEnabled();
  });

  it('AK-3: points out a same-named person and does not save without confirmation', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<PersonsView />);
    await db.persons.add(aPerson({ name: 'Anna' }));

    await user.type(screen.getByLabelText('Name'), ' anna');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    const hint = await screen.findByRole('alert');
    expect(hint).toHaveTextContent('Es gibt bereits eine Person namens „anna“. Trotzdem anlegen?');
    expect(await db.persons.count()).toBe(1);
  });

  it('AK-3: saves the same-named person after confirmation', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<PersonsView />);
    await db.persons.add(aPerson({ name: 'Anna' }));

    await user.type(screen.getByLabelText('Name'), 'Anna');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await user.click(await screen.findByRole('button', { name: 'Trotzdem anlegen' }));

    await expect.poll(personNames).toEqual(['Anna', 'Anna']);
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('AK-3: cancelling the hint keeps the name and saves nothing', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<PersonsView />);
    await db.persons.add(aPerson({ name: 'Anna' }));

    await user.type(screen.getByLabelText('Name'), 'Anna');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await user.click(await screen.findByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Anna');
    expect(await db.persons.count()).toBe(1);
  });

  it('AK-3: changing the name removes the hint', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<PersonsView />);
    await db.persons.add(aPerson({ name: 'Anna' }));

    await user.type(screen.getByLabelText('Name'), 'Anna');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await screen.findByRole('alert');
    await user.type(screen.getByLabelText('Name'), 'lena');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
