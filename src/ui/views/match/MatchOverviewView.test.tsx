import { aGroup, aPerson, utcDateTime } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RouteObject } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Clock, StoredSession } from '@/app/ports';
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
async function runMatch(
  options: Partial<CatanOptions> = {},
  sessionClock?: Clock,
): Promise<BoardBrainDb> {
  const { db, session, router } = renderWithApp(null, {
    routes: ROUTES,
    ...(sessionClock === undefined ? {} : { sessionClock }),
  });
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
    // Design I2-H: without pieces there is nothing to tap, so no hint either.
    expect(screen.queryByText('Stein antippen zum Wiederholen')).not.toBeInTheDocument();
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

describe('US-AB-03 AK-8 Tapping pieces on the board of the overview (design I2-H)', () => {
  it('names the hint, asks about the tapped piece and lays it bright over the dark', async () => {
    const user = userEvent.setup();
    await runMatch();

    expect(await screen.findByText('Stein antippen zum Wiederholen')).toBeInTheDocument();
    const roads = screen.getAllByRole('button', { name: /^Straße von .* wiederholen$/ });
    expect(roads).toHaveLength(6);
    await user.click(roads[0] ?? document.body);

    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Nur dieser Schritt wird neu gelost')).toBeInTheDocument();
    const spot = screen.getByTestId('board-spotlight');
    expect(within(spot).getAllByTestId('board-road')).toHaveLength(1);
    expect(within(spot).queryAllByTestId('board-settlement')).toEqual([]);

    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(screen.queryByTestId('board-spotlight')).not.toBeInTheDocument();
  });

  it('a piece of the results asks without a spotlight, as no board is shown there', async () => {
    const user = userEvent.setup();
    await runMatch();
    await user.click(await screen.findByRole('tab', { name: 'Ergebnisse' }));

    await user.click(
      screen.getAllByRole('button', { name: /^Straße von .* wiederholen$/ })[0] ?? document.body,
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.queryByTestId('board-spotlight')).not.toBeInTheDocument();
  });
});

describe('US-AB-07 AK-6, AK-7 the history of the timer (design I3-B, ADR-031)', () => {
  // The sheet counts with the real time, so the session service does too.
  const REAL_TIME = { now: () => new Date().toISOString(), localDateTime: utcDateTime };

  function hhmm(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  async function openSheet(): Promise<{ db: BoardBrainDb; sheet: HTMLElement }> {
    const db = await runMatch({}, REAL_TIME);
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: /^Spieldauer .* – Verlauf$/ }));
    return { db, sheet: await screen.findByRole('dialog', { name: 'Spieldauer' }) };
  }

  it('AK-6: adds a pause in minutes; "Fertig" stores beginning and pause', async () => {
    const { db, sheet } = await openSheet();
    const user = userEvent.setup();
    expect(within(sheet).getByText('jetzt')).toBeInTheDocument();
    // Right after the start the only stretch is shorter than a minute: no pause fits.
    await user.click(
      within(sheet).getByRole('button', { name: 'Pause in dieser Strecke nachtragen' }),
    );
    expect(within(sheet).getByRole('button', { name: 'Hinzufügen' })).toBeDisabled();
    expect(within(sheet).getByRole('button', { name: '5 Minuten' })).toBeDisabled();
    await user.click(within(sheet).getByRole('button', { name: 'Abbrechen' }));

    fireEvent.change(within(sheet).getByLabelText('Beginn der Partie'), {
      target: { value: hhmm(new Date(Date.now() - 10 * 60_000)) },
    });
    await user.click(
      within(sheet).getByRole('button', { name: 'Pause in dieser Strecke nachtragen' }),
    );
    await user.click(within(sheet).getByRole('button', { name: '5 Minuten' }));
    await user.click(within(sheet).getByRole('button', { name: 'Hinzufügen' }));
    expect(within(sheet).getByText('Pause 1')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Fertig' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Spieldauer' })).not.toBeInTheDocument();
    });
    const pauses = (await db.session.toArray())[0]?.clock?.pauses ?? [];
    expect(pauses).toHaveLength(1);
    expect(Date.parse(pauses[0]?.to ?? '') - Date.parse(pauses[0]?.from ?? '')).toBe(5 * 60_000);
  });

  it('AK-6: a pause before the beginning is not taken and says why', async () => {
    const { sheet } = await openSheet();
    fireEvent.change(within(sheet).getByLabelText('Beginn der Partie'), {
      target: { value: hhmm(new Date(Date.now() - 10 * 60_000)) },
    });
    const user = userEvent.setup();
    await user.click(
      within(sheet).getByRole('button', { name: 'Pause in dieser Strecke nachtragen' }),
    );
    await user.click(within(sheet).getByRole('button', { name: '5 Minuten' }));
    await user.click(within(sheet).getByRole('button', { name: 'Hinzufügen' }));

    fireEvent.change(within(sheet).getByLabelText('Pause 1 von'), {
      target: { value: hhmm(new Date(Date.now() - 20 * 60_000)) },
    });

    expect(within(sheet).getByRole('alert')).toHaveTextContent('Nicht übernommen · vor dem Beginn');
  });

  it('AK-6: pausing in the sheet acts at once and needs no "Fertig"', async () => {
    const { db, sheet } = await openSheet();
    const user = userEvent.setup();

    await user.click(within(sheet).getByRole('button', { name: 'Anhalten' }));

    expect(await within(sheet).findByRole('button', { name: 'Fortsetzen' })).toBeInTheDocument();
    expect((await db.session.toArray())[0]?.clock?.pauses).toHaveLength(1);
    expect(within(sheet).getByText('Pause 1')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Fertig' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('AK-7: closing with a change asks; "Verwerfen" keeps the stored timer', async () => {
    const { db, sheet } = await openSheet();
    const user = userEvent.setup();
    const stored = (await db.session.toArray())[0]?.clock;
    fireEvent.change(within(sheet).getByLabelText('Beginn der Partie'), {
      target: { value: hhmm(new Date(Date.now() - 5 * 60_000)) },
    });

    await user.click(within(sheet).getByRole('button', { name: 'Verlauf schließen' }));

    const question = await screen.findByRole('alertdialog', { name: 'Änderungen übernehmen?' });
    await user.click(within(question).getByRole('button', { name: 'Verwerfen' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Spieldauer' })).not.toBeInTheDocument();
    });
    expect((await db.session.toArray())[0]?.clock).toEqual(stored);
  });
});
