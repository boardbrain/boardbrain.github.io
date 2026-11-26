import { aCustomGame, aGroup, aPerson } from '@tests/support/masterDataFakes';
import { OverviewRoutes } from '@tests/support/overviewRoutes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { aMatch } from '@tests/support/resultFakes';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  parseLocalDate,
  parseLocalTime,
  toMatchId,
  toPersonId,
  type LocalDate,
  type LocalTime,
  type Match,
} from '@/core/model';
import { CATAN_GAME_ID } from '@/games/catan';
import type { BoardBrainDb } from '@/infra/db/database';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const TABLE = aGroup({ name: 'Freitagsrunde' });
const PAGE = `/verwaltung/gruppen/${TABLE.id}`;
const RESULTS = `${PAGE}?reiter=ergebnisse`;

function day(text: string): LocalDate {
  const parsed = parseLocalDate(text);
  if (!parsed.ok) throw new Error(text);
  return parsed.value;
}

function at(text: string): LocalTime {
  const parsed = parseLocalTime(text);
  if (!parsed.ok) throw new Error(text);
  return parsed.value;
}

function match(id: number, fields: Partial<Match>): Match {
  return aMatch({ id: toMatchId(`00000000-0000-4000-8000-0000000000${String(id)}`), ...fields });
}

const UNO_DRAW = match(11, {
  date: day('2026-11-14'),
  time: at('20:15'),
  winnerIds: [ANNA, BEN],
});
const UNO_LATER = match(12, { date: day('2026-11-16'), winnerIds: [BEN] });
const CATAN = match(13, {
  gameId: CATAN_GAME_ID,
  date: day('2026-11-16'),
  time: at('19:00'),
  edition: 'cities-and-knights',
  mode: 'standard',
  winnerIds: [BEN],
  scores: { [ANNA]: 8, [BEN]: 10 },
  catanColors: { [ANNA]: 'red', [BEN]: 'blue' },
  durationMinutes: 83,
  notes: 'Räuber bei Anna',
});

async function seed(db: BoardBrainDb, matches: readonly Match[]): Promise<void> {
  await db.persons.bulkAdd([
    aPerson({ id: ANNA, name: 'Anna' }),
    aPerson({ id: BEN, name: 'Ben' }),
  ]);
  await db.games.add(aCustomGame());
  await db.groups.add(TABLE);
  await db.matches.bulkAdd([...matches]);
}

describe('US-ER-04 Results of a table (table page, design I3-C)', () => {
  it('AK-1: the tab "Ergebnisse" lists the results newest first with game, time and winner', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: RESULTS });
    await seed(db, [UNO_DRAW, CATAN, UNO_LATER]);

    expect(await screen.findByRole('tab', { name: 'Ergebnisse', selected: true })).toBeVisible();
    const rows = await screen.findAllByRole('link', { name: /gewinnt|Unentschieden/u });
    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual([
      // Specification 3.7: within a day the result without a time comes after those with one,
      // so newest first it stands on top.
      'Uno, Ben gewinnt',
      'Catan, 19:00, Ben gewinnt',
      'Uno, 20:15, Unentschieden: Anna und Ben',
    ]);
  });

  it('AK-1: one heading per day', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: RESULTS });
    await seed(db, [UNO_DRAW, CATAN, UNO_LATER]);

    expect(await screen.findAllByRole('list', { name: /^Ergebnisse am/u })).toHaveLength(2);
  });

  it('AK-1: without results the tab says so', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: RESULTS });
    await seed(db, []);

    expect(await screen.findByText('Noch keine Ergebnisse')).toBeVisible();
  });

  it('the tabs switch with a tap and the arrow keys; the address keeps the tab', async () => {
    const user = userEvent.setup();
    const { db, router } = renderWithApp(<OverviewRoutes />, { path: PAGE });
    await seed(db, [UNO_LATER]);

    await user.click(await screen.findByRole('tab', { name: 'Ergebnisse' }));
    expect(router.state.location.search).toBe('?reiter=ergebnisse');
    expect(await screen.findByRole('link', { name: 'Uno, Ben gewinnt' })).toBeVisible();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Statistik', selected: true })).toHaveFocus();
    expect(
      await within(screen.getByRole('tabpanel', { name: 'Statistik' })).findByRole('heading', {
        name: 'Rangliste',
      }),
    ).toBeInTheDocument();

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Am Tisch', selected: true })).toHaveFocus();
    expect(router.state.location.search).toBe('');
  });

  it('US-ER-01 AK-1: the plus in the head enters a result for this table', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: PAGE });
    await seed(db, []);

    expect(await screen.findByRole('link', { name: 'Ergebnis eintragen' })).toHaveAttribute(
      'href',
      `${PAGE}/ergebnis`,
    );
  });

  it('AK-2, US-ER-02 AK-5, US-ER-03 AK-2: a result shows places, points, colours and all data', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: RESULTS });
    await seed(db, [CATAN]);

    await user.click(await screen.findByRole('link', { name: 'Catan, 19:00, Ben gewinnt' }));

    expect(await screen.findByRole('heading', { name: 'Catan', level: 1 })).toBeVisible();
    const places = within(screen.getByRole('list', { name: 'Ergebnis' }));
    const rows = places.getAllByRole('listitem');
    // Each row: place or trophy, the coin with the initial, name, colour, points.
    expect(rows.map((row) => row.textContent)).toEqual(['BBenBlau10', '2AAnnaRot8']);
    expect(places.getByLabelText('Sieger')).toBeVisible();
    expect(places.getByLabelText('Platz 2')).toBeVisible();
    expect(screen.getByText('Siegpunkte')).toBeVisible();
    expect(screen.getByText('Städte & Ritter')).toBeVisible();
    expect(screen.getByText('1 h 23 min')).toBeVisible();
    expect(screen.getByText('Räuber bei Anna')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Bearbeiten' })).toHaveAttribute(
      'href',
      `${PAGE}/ergebnisse/${CATAN.id}/bearbeiten`,
    );
  });

  it('AK-2: without places the winners come first, the others without a place', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: RESULTS });
    await seed(db, [UNO_LATER]);

    await user.click(await screen.findByRole('link', { name: 'Uno, Ben gewinnt' }));

    const rows = within(await screen.findByRole('list', { name: 'Ergebnis' })).getAllByRole(
      'listitem',
    );
    expect(rows.map((row) => row.textContent)).toEqual(['BBen', 'AAnna']);
  });

  it('US-ER-05 AK-2, AK-3: deleting asks first; afterwards the list is current', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: RESULTS });
    await seed(db, [UNO_LATER, CATAN]);

    await user.click(await screen.findByRole('link', { name: 'Uno, Ben gewinnt' }));
    await user.click(await screen.findByRole('button', { name: 'Ergebnis löschen' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Ergebnis löschen?' });
    expect(dialog).toHaveTextContent('Lässt sich nicht rückgängig machen');

    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(await db.matches.count()).toBe(2);

    await user.click(screen.getByRole('button', { name: 'Ergebnis löschen' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Löschen' }),
    );

    expect(await screen.findByRole('tab', { name: 'Ergebnisse', selected: true })).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Catan, 19:00, Ben gewinnt' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Uno, Ben gewinnt' })).toBeNull();
    expect(await db.matches.count()).toBe(1);
  });

  it('a result that no longer exists says so', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, {
      path: `${PAGE}/ergebnisse/${UNO_LATER.id}`,
    });
    await seed(db, []);

    expect(await screen.findByText('Dieses Ergebnis gibt es nicht mehr.')).toBeVisible();
  });
});
