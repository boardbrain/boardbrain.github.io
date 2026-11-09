import { aGroup, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RouteObject } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { StoredSession } from '@/app/ports';
import { revealedStepIndex } from '@/core/generation';
import { toPersonId } from '@/core/model';
import { CATAN_DEFAULT_OPTIONS, type CatanOptions } from '@/games/catan';
import type { BoardBrainDb } from '@/infra/db/database';
import { MatchOverviewView } from './MatchOverviewView';

const NAMES = ['Anna', 'Ben', 'Clara'];
const COLORS = ['red', 'blue', 'white'] as const;
const TABLE = aGroup({
  name: 'Profis',
  members: NAMES.map((_, index) => ({
    personId: toPersonId(`00000000-0000-4000-8000-0000000000a${String(index + 1)}`),
    groupColor: 'teal',
    catanColor: COLORS[index] ?? 'red',
  })),
});

const ROUTES: RouteObject[] = [
  { path: '/', element: <h1>start page</h1> },
  { path: '/partie/uebersicht', element: <MatchOverviewView /> },
  { path: '/partie', element: <h1>flow page</h1> },
];

// Starts a match and taps "Losen" until it runs, then opens the overview.
async function runMatch(options: Partial<CatanOptions> = {}): Promise<BoardBrainDb> {
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
  let current: StoredSession = started.value;
  // "Losen" until no step is missing, then "Zur Übersicht".
  while (current.generation.state !== 'running') {
    const revealed = revealedStepIndex(current.generation) ?? null;
    const drawn = await session.draw(revealed);
    if (drawn.ok) {
      current = drawn.value;
      continue;
    }
    if (drawn.error !== 'generation-complete' || revealed === null) throw new Error(drawn.error);
    const confirmed = await session.confirm(revealed);
    if (!confirmed.ok) throw new Error(confirmed.error);
    current = confirmed.value;
  }
  await act(() => router.navigate('/partie/uebersicht'));
  return db;
}

describe('US-AB-04 Overview of the running match', () => {
  it('AK-1: shows the board with all pieces and the order', async () => {
    await runMatch();

    expect(await screen.findByRole('heading', { name: 'Laufende Partie' })).toBeInTheDocument();
    expect(screen.getByText('Profis · Basisspiel · Standard')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Brett' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByTestId('board-settlement')).toHaveLength(6);
    expect(screen.getAllByTestId('board-road')).toHaveLength(6);
  });

  it('AK-1: lists the results of all steps', async () => {
    const user = userEvent.setup();
    await runMatch({ startingResources: { count: 2, replacement: 'with' } });

    await user.click(await screen.findByRole('tab', { name: 'Ergebnisse' }));

    for (const name of ['Aufbau', 'Reihenfolge', 'Startrohstoffe', 'Gebäude und Straßen']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
    expect(screen.getByText('Landschaftsfelder')).toBeInTheDocument();
  });

  it('US-PL-05 AK-3: without placement it shows the seats of the table', async () => {
    const user = userEvent.setup();
    await runMatch({ order: { mode: 'none' } });

    expect(await screen.findByText('Ohne Platzierung')).toBeInTheDocument();
    expect(screen.queryAllByTestId('board-settlement')).toHaveLength(0);

    await user.click(screen.getByRole('tab', { name: 'Ergebnisse' }));

    expect(screen.getByRole('heading', { name: 'Personen am Tisch' })).toBeInTheDocument();
  });

  it('US-PL-05 AK-2: a skipped placement says the order still counts', async () => {
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
      options: {
        ...CATAN_DEFAULT_OPTIONS,
        personDraws: { landscapes: false, harbors: false, numbers: false },
      },
      colors: prepared.value.colors,
    });
    if (!started.ok) throw new Error(started.error);
    // Both spins of the order, then skip.
    await session.draw(null);
    await session.draw(0);
    await session.skipPlacement();
    await act(() => router.navigate('/partie/uebersicht'));

    expect(await screen.findByText('Platzierung übersprungen')).toBeInTheDocument();
  });

  it('"Zurück" leads to the start, the match keeps running', async () => {
    const user = userEvent.setup();
    const db = await runMatch();

    await user.click(await screen.findByRole('button', { name: 'Zurück' }));

    expect(await screen.findByRole('heading', { name: 'start page' })).toBeInTheDocument();
    expect(await db.session.count()).toBe(1);
  });

  it('US-AB-06 AK-1: ends the match without a result', async () => {
    const user = userEvent.setup();
    const db = await runMatch();

    await user.click(await screen.findByRole('button', { name: 'Partie beenden ohne Ergebnis' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Beenden' }),
    );

    expect(await screen.findByRole('heading', { name: 'start page' })).toBeInTheDocument();
    expect(await db.session.count()).toBe(0);
  });
});

describe('US-AB-03 AK-6 Repeat a step from the overview (design I2-D)', () => {
  it('AK-2: a row asks first and names what is discarded; afterwards the flow shows the step', async () => {
    const user = userEvent.setup();
    const db = await runMatch();
    await user.click(await screen.findByRole('tab', { name: 'Ergebnisse' }));

    const order = screen.getByRole('region', { name: 'Reihenfolge' });
    const rows = within(order).getAllByRole('button');
    // Two spins for three persons; the last place has no step of its own.
    expect(rows).toHaveLength(2);
    await user.click(rows[0] ?? order);

    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Reihenfolge, Platz 1 wiederholen?')).toBeInTheDocument();
    expect(within(dialog).getByText('Ganze Reihenfolge wird neu gelost')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Wiederholen' }));

    expect(await screen.findByRole('heading', { name: 'flow page' })).toBeInTheDocument();
    const [stored] = await db.session.toArray();
    expect(stored?.generation.state).toBe('generation');
    expect(stored?.generation.steps.some(({ step }) => step.kind === 'order-spin')).toBe(false);
  });

  it('a piece asks before repeating it and can be cancelled', async () => {
    const user = userEvent.setup();
    const db = await runMatch();
    await user.click(await screen.findByRole('tab', { name: 'Ergebnisse' }));

    const pieces = screen.getAllByRole('button', { name: /wiederholen$/ });
    expect(pieces).toHaveLength(12);
    await user.click(pieces[0] ?? document.body);
    expect(within(screen.getByRole('alertdialog')).getByText(/wiederholen\?$/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    const [stored] = await db.session.toArray();
    expect(stored?.generation.state).toBe('running');
  });
});
