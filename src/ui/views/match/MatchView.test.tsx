import { aGroup, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { aStoredSession } from '@tests/support/sessionFakes';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RouteObject } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { SessionService } from '@/app/services/sessionService';
import { toPersonId } from '@/core/model';
import { CATAN_DEFAULT_OPTIONS, type CatanOptions } from '@/games/catan';
import type { BoardBrainDb } from '@/infra/db/database';
import { MatchView } from './MatchView';

type User = ReturnType<typeof userEvent.setup>;

const NAMES = ['Anna', 'Ben', 'Clara', 'David'];
const COLORS = ['red', 'blue', 'white', 'orange'] as const;
const TABLE = aGroup({
  name: 'Freitagsrunde',
  members: NAMES.map((_, index) => ({
    personId: toPersonId(`00000000-0000-4000-8000-0000000000a${String(index + 1)}`),
    groupColor: 'teal',
    catanColor: COLORS[index] ?? 'red',
  })),
});
const NO_DRAWS = { landscapes: false, harbors: false, numbers: false };

const ROUTES: RouteObject[] = [
  { path: '/', element: <h1>start page</h1> },
  { path: '/partie', element: <MatchView /> },
  { path: '/partie/uebersicht', element: <h1>overview page</h1> },
];

async function startMatch(
  options: Partial<CatanOptions> = {},
): Promise<{ db: BoardBrainDb; session: SessionService }> {
  const { db, session, router } = renderWithApp(null, { routes: ROUTES });
  await db.persons.bulkAdd(
    TABLE.members.map((member, index) =>
      aPerson({ id: member.personId, name: NAMES[index] ?? '' }),
    ),
  );
  await db.groups.add(TABLE);
  const prepared = await session.prepare(TABLE.id);
  if (!prepared.ok) throw new Error(prepared.error);
  const started = await session.start({
    groupId: TABLE.id,
    options: { ...CATAN_DEFAULT_OPTIONS, ...options },
    colors: prepared.value.colors,
  });
  if (!started.ok) throw new Error(started.error);
  await act(() => router.navigate('/partie'));
  return { db, session };
}

// Taps the forward button of the step shown and waits until the step is replaced: the button
// belongs to the step and is new for every step.
async function tapForward(user: User, name = 'Losen'): Promise<void> {
  const button = await screen.findByRole('button', { name });
  await waitFor(() => {
    expect(button).toBeEnabled();
  });
  await user.click(button);
  await waitFor(() => {
    expect(button).not.toBeInTheDocument();
  });
}

function progress(): string[] {
  return within(screen.getByRole('list', { name: 'Fortschritt' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

describe('US-AB-02 Go through the generation', () => {
  it('AK-1: shows the stored first step with its phase', async () => {
    const { db } = await startMatch();

    expect(await screen.findByRole('heading', { name: 'Losen' })).toBeInTheDocument();
    expect(screen.getByText('Landschaftsfelder')).toBeInTheDocument();
    expect(screen.getByText('Freitagsrunde · Basisspiel')).toBeInTheDocument();
    expect(progress()).toEqual(['Losen 1/3', 'Reihenfolge', 'Platzierung', 'Rohstoffe']);
    const [stored] = await db.session.toArray();
    expect(stored?.generation.steps).toHaveLength(1);
  });

  it('AK-1: "Losen" confirms the step and shows the next one', async () => {
    const user = userEvent.setup();
    const { db } = await startMatch();
    await screen.findByText('Landschaftsfelder');

    await tapForward(user);

    expect(await screen.findByText('Häfen')).toBeInTheDocument();
    expect(progress()[0]).toBe('Losen 2/3');
    const [stored] = await db.session.toArray();
    expect(stored?.generation.steps.map((record) => record.status)).toEqual([
      'confirmed',
      'revealed',
    ]);
  });

  it('AK-1: after the last step "Zur Übersicht" leads to the overview', async () => {
    const user = userEvent.setup();
    await startMatch({
      personDraws: NO_DRAWS,
      order: { mode: 'none' },
      startingResources: { count: 2, replacement: 'with' },
    });
    expect(await screen.findByRole('heading', { name: 'Startrohstoffe' })).toBeInTheDocument();
    expect(progress()).toEqual(['Platzierung', 'Rohstoffe 1/4']);

    for (let step = 0; step < 3; step++) {
      await tapForward(user);
    }
    await tapForward(user, 'Zur Übersicht');

    expect(await screen.findByRole('heading', { name: 'overview page' })).toBeInTheDocument();
  });
});

describe('US-AB-03 Repeat a step', () => {
  it('AK-1: warns that only this step is drawn again, and draws it again', async () => {
    const user = userEvent.setup();
    const { db } = await startMatch();
    await screen.findByText('Landschaftsfelder');

    await user.click(screen.getByRole('button', { name: 'Wiederholen' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Landschaftsfelder wiederholen?')).toBeInTheDocument();
    expect(within(dialog).getByText('Nur dieser Schritt wird neu gelost')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Wiederholen' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    const [stored] = await db.session.toArray();
    expect(stored?.generation.steps).toHaveLength(1);
    expect(screen.getByText('Landschaftsfelder')).toBeInTheDocument();
  });

  it('can be cancelled', async () => {
    const user = userEvent.setup();
    await startMatch();
    await screen.findByText('Landschaftsfelder');

    await user.click(screen.getByRole('button', { name: 'Wiederholen' }));
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('US-PL-05 Skip the placement', () => {
  it('AK-1, AK-2: offered on the last spin, the match is complete without resources', async () => {
    const user = userEvent.setup();
    await startMatch({ personDraws: NO_DRAWS });
    expect(await screen.findByRole('heading', { name: 'Reihenfolge' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Platzierung überspringen' }),
    ).not.toBeInTheDocument();

    await tapForward(user);
    await tapForward(user);
    await user.click(await screen.findByRole('button', { name: 'Platzierung überspringen' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Überspringen' }),
    );

    expect(await screen.findByRole('heading', { name: 'overview page' })).toBeInTheDocument();
  });
});

describe('US-AB-06 End a match without a result', () => {
  it('AK-1: asks first, then discards the match and leads to the start', async () => {
    const user = userEvent.setup();
    const { db } = await startMatch();
    await screen.findByText('Landschaftsfelder');

    await user.click(screen.getByRole('button', { name: 'Partie beenden ohne Ergebnis' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Beenden' }),
    );

    expect(await screen.findByRole('heading', { name: 'start page' })).toBeInTheDocument();
    expect(await db.session.count()).toBe(0);
  });
});

describe('US-PL-04 Buildings and roads on the board', () => {
  it('AK-1: shows the building drawn and whose turn it is', async () => {
    const user = userEvent.setup();
    await startMatch({ personDraws: NO_DRAWS });
    await screen.findByRole('heading', { name: 'Reihenfolge' });

    for (let spin = 0; spin < 3; spin++) {
      await tapForward(user);
    }

    expect(await screen.findByRole('heading', { name: 'Platzierung' })).toBeInTheDocument();
    expect(progress()).toContain('Platzierung 1/16');
    expect(screen.getAllByTestId('board-settlement')).toHaveLength(1);
    expect(screen.getByText('· Siedlung')).toBeInTheDocument();

    await tapForward(user);

    expect(await screen.findByText('· Straße')).toBeInTheDocument();
    expect(screen.getAllByTestId('board-road')).toHaveLength(1);
  });
});

describe('Architecture 13.2 match from the database', () => {
  it('leads to the start without a match', async () => {
    renderWithApp(null, { path: '/partie', routes: ROUTES });

    expect(await screen.findByRole('heading', { name: 'start page' })).toBeInTheDocument();
  });

  it('leads to the overview once the match runs', async () => {
    await startMatch({ personDraws: NO_DRAWS, order: { mode: 'none' } });

    expect(await screen.findByRole('heading', { name: 'overview page' })).toBeInTheDocument();
  });

  it('Architecture 10.3: a match of an unknown version shows a message and can be ended', async () => {
    const user = userEvent.setup();
    const { db, router } = renderWithApp(null, { routes: ROUTES });
    await db.session.put({ ...aStoredSession(), schemaVersion: 99 });
    await act(() => router.navigate('/partie'));

    expect(
      await screen.findByText(/stammt aus einer anderen Version von BoardBrain/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Partie beenden ohne Ergebnis' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Beenden' }),
    );

    expect(await screen.findByRole('heading', { name: 'start page' })).toBeInTheDocument();
    expect(await db.session.count()).toBe(0);
  });
});
