import { aGroup, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RouteObject } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toGroupId, toPersonId, type Group, type PersonId } from '@/core/model';
import { CATAN_GAME_ID } from '@/games/catan';
import type { BoardBrainDb } from '@/infra/db/database';
import { ColorsView } from './ColorsView';
import { OptionsView } from './OptionsView';
import { PreparationLayout } from './PreparationLayout';
import { TableChoiceView } from './TableChoiceView';

type User = ReturnType<typeof userEvent.setup>;

const NAMES = ['Anna', 'Ben', 'Clara', 'David', 'Eva'];
const personId = (index: number): PersonId =>
  toPersonId(`00000000-0000-4000-8000-0000000000a${String(index + 1)}`);

function aTable(id: number, name: string, size: number, fields: Partial<Group> = {}): Group {
  const colors = ['red', 'blue', 'white', 'orange'] as const;
  return aGroup({
    id: toGroupId(`00000000-0000-4000-8000-0000000000c${String(id)}`),
    name,
    members: NAMES.slice(0, size).map((_, index) => ({
      personId: personId(index),
      groupColor: 'teal',
      ...(index < colors.length ? { catanColor: colors[index] } : {}),
    })),
    ...fields,
  });
}

const ROUTES: RouteObject[] = [
  {
    path: '/partie/neu',
    element: <PreparationLayout />,
    children: [
      { path: 'tisch', element: <TableChoiceView /> },
      { path: 'optionen', element: <OptionsView /> },
      { path: 'farben', element: <ColorsView /> },
    ],
  },
  { path: '/partie', element: <h1>match page</h1> },
];

async function setUp(path = '/partie/neu/tisch'): Promise<BoardBrainDb> {
  const { db } = renderWithApp(null, { path, routes: ROUTES });
  await db.persons.bulkAdd(NAMES.map((name, index) => aPerson({ id: personId(index), name })));
  await db.groups.bulkAdd([
    aTable(1, 'Freitagsrunde', 4),
    aTable(2, 'Profis', 3, { binding: { kind: 'game', gameId: CATAN_GAME_ID } }),
    aTable(3, 'Uno-Runde', 2, { binding: { kind: 'global', excludesCatan: true } }),
    aTable(4, 'Zu fünft', 5),
    aTable(5, 'Früher', 2, { archived: true }),
  ]);
  return db;
}

async function chooseTable(user: User, name = 'Freitagsrunde'): Promise<void> {
  await user.click(await screen.findByRole('button', { name: new RegExp(`^${name}:`) }));
  await screen.findByRole('heading', { name: 'Wie spielt ihr?' });
}

function switchOf(name: string): HTMLElement {
  return screen.getByRole('switch', { name });
}

describe('US-AB-01 choose the table', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AK-1: offers only active tables that can play Catan', async () => {
    await setUp();

    const tables = await screen.findAllByRole('button', { name: /:/ });

    expect(tables.map((table) => table.getAttribute('aria-label'))).toEqual([
      'Freitagsrunde: Anna, Ben, Clara, David',
      'Profis: Anna, Ben, Clara',
    ]);
    expect(screen.getByText('nur Catan')).toBeInTheDocument();
  });

  it('shows how to add a table when none can play Catan', async () => {
    const { db } = renderWithApp(null, { path: '/partie/neu/tisch', routes: ROUTES });
    await db.groups.add(
      aTable(3, 'Uno-Runde', 2, { binding: { kind: 'global', excludesCatan: true } }),
    );

    expect(await screen.findByText('Noch kein Tisch kann Catan spielen')).toBeInTheDocument();
  });

  it('AK-2: a tap leads on with all members of the table', async () => {
    const user = userEvent.setup();
    await setUp();

    await chooseTable(user);

    expect(screen.getByText('Anna, Ben, Clara, David')).toBeInTheDocument();
  });

  it('holding a table shows all its persons and can choose it', async () => {
    await setUp();
    const table = await screen.findByRole('button', { name: /^Profis:/ });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    fireEvent.pointerDown(table);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(table);
    fireEvent.click(table);
    vi.useRealTimers();

    const details = screen.getByRole('alertdialog');
    expect(within(details).getByRole('heading', { name: 'Profis' })).toBeInTheDocument();
    expect(within(details).getByText('3 Personen · nur Catan')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Wie spielt ihr?' })).not.toBeInTheDocument();

    fireEvent.click(within(details).getByRole('button', { name: 'Tisch wählen' }));

    expect(await screen.findByRole('heading', { name: 'Wie spielt ihr?' })).toBeInTheDocument();
  });

  it('leads to the table choice when the options are opened without a table', async () => {
    await setUp('/partie/neu/optionen');

    expect(
      await screen.findByRole('heading', { name: 'Welcher Tisch spielt?' }),
    ).toBeInTheDocument();
  });
});

describe('US-AB-01 options of the match', () => {
  it('AK-3, AK-4: all draws and the order are on, starting resources off', async () => {
    const user = userEvent.setup();
    await setUp();
    await chooseTable(user);

    for (const name of ['Landschaftsfelder', 'Häfen', 'Zahlenchips', 'Reihenfolge losen']) {
      expect(switchOf(name)).toHaveAttribute('aria-checked', 'true');
    }
    expect(switchOf('Startrohstoffe ziehen')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: /^Basisspiel/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('AK-4: starting resources show count and replacement', async () => {
    const user = userEvent.setup();
    await setUp();
    await chooseTable(user);

    await user.click(switchOf('Startrohstoffe ziehen'));
    await user.click(screen.getByRole('button', { name: 'Mehr' }));

    expect(screen.getByRole('status')).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: 'mit Zurücklegen' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('FA-LS-07: an order set by hand needs every person before the colours', async () => {
    const user = userEvent.setup();
    await setUp();
    await chooseTable(user);
    const next = screen.getByRole('button', { name: 'Weiter zu den Farben' });

    await user.click(switchOf('Reihenfolge losen'));

    expect(next).toBeDisabled();
    expect(screen.getByText('Der Reihe nach antippen · als Nächstes Platz 1')).toBeInTheDocument();

    for (const name of ['David', 'Clara', 'Ben']) {
      await user.click(screen.getByRole('button', { name }));
    }

    expect(screen.getByRole('button', { name: '4Anna' })).toHaveAttribute('aria-pressed', 'true');
    expect(next).toBeEnabled();
  });

  it('FA-LS-07: without placement the colours follow at once', async () => {
    const user = userEvent.setup();
    await setUp();
    await chooseTable(user);

    await user.click(switchOf('Reihenfolge losen'));
    await user.click(screen.getByRole('button', { name: 'Ohne Platzierung' }));

    expect(screen.getByText('Keine Gebäude und Straßen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weiter zu den Farben' })).toBeEnabled();
  });
});

describe('US-PG-04 colours of the match', () => {
  async function toColors(user: User): Promise<void> {
    await chooseTable(user);
    await user.click(screen.getByRole('button', { name: 'Weiter zu den Farben' }));
    await screen.findByRole('heading', { name: 'Welche Farben?' });
  }

  function chosen(name: string): string | null | undefined {
    return within(screen.getByRole('group', { name: `Farbe von ${name}` }))
      .getAllByRole('button')
      .find((button) => button.getAttribute('aria-pressed') === 'true')
      ?.getAttribute('aria-label');
  }

  it('AK-1: starts with the colours of the table and sums up the options', async () => {
    const user = userEvent.setup();
    await setUp();
    await toColors(user);

    expect(['Anna', 'Ben', 'Clara', 'David'].map(chosen)).toEqual([
      'Rot',
      'Blau',
      'Weiß',
      'Orange',
    ]);
    expect(
      screen.getByText('Basisspiel · 3 Losschritte · Reihenfolge gelost · ohne Startrohstoffe'),
    ).toBeInTheDocument();
  });

  it('AK-2: a taken colour swaps, only for this match, and can be undone', async () => {
    const user = userEvent.setup();
    const db = await setUp();
    await toColors(user);

    await user.click(
      within(screen.getByRole('group', { name: 'Farbe von Anna' })).getByRole('button', {
        name: 'Blau',
      }),
    );

    expect([chosen('Anna'), chosen('Ben')]).toEqual(['Blau', 'Rot']);
    expect(screen.getAllByText('· einmalig')).toHaveLength(2);
    const table = await db.groups.get(toGroupId('00000000-0000-4000-8000-0000000000c1'));
    expect(table?.members[0]?.catanColor).toBe('red');

    await user.click(screen.getByRole('button', { name: 'Wie am Tisch' }));

    expect([chosen('Anna'), chosen('Ben')]).toEqual(['Rot', 'Blau']);
  });

  it('ADR-014: "Generierung starten" stores the match and its first step, then shows it', async () => {
    const user = userEvent.setup();
    const db = await setUp();
    await toColors(user);

    await user.click(screen.getByRole('button', { name: 'Generierung starten' }));

    expect(await screen.findByRole('heading', { name: 'match page' })).toBeInTheDocument();
    const stored = await db.session.toArray();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.generation.steps).toHaveLength(1);
  });

  it('a running match leads away from the preparation', async () => {
    const user = userEvent.setup();
    await setUp();
    await toColors(user);
    await user.click(screen.getByRole('button', { name: 'Generierung starten' }));
    await screen.findByRole('heading', { name: 'match page' });

    act(() => {
      window.history.back();
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'match page' })).toBeInTheDocument();
    });
  });
});
