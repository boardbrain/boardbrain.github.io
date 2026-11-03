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
  while (current.generation.state !== 'running') {
    const advanced = await session.advance(revealedStepIndex(current.generation) ?? null);
    if (!advanced.ok) throw new Error(advanced.error);
    current = advanced.value;
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

    expect(screen.getByRole('heading', { name: 'Reihenfolge am Tisch' })).toBeInTheDocument();
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
    await session.advance(0);
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
