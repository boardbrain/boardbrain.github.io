import { aCustomGame, aGroup, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { aMatch } from '@tests/support/resultFakes';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { parseLocalDate, toMatchId, toPersonId, type LocalDate, type Match } from '@/core/model';
import { assert } from '@/core/shared';
import { CATAN_GAME_ID } from '@/games/catan';
import type { BoardBrainDb } from '@/infra/db/database';
import { GroupView } from '@/ui/views/management/GroupView';
import { ResultDetailView } from '@/ui/views/management/ResultDetailView';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const CLARA = toPersonId('00000000-0000-4000-8000-0000000000a3');
const TABLE = aGroup({
  name: 'Freitagsrunde',
  members: [
    { personId: ANNA, groupColor: 'red', catanColor: 'red' },
    { personId: BEN, groupColor: 'blue', catanColor: 'blue' },
    { personId: CLARA, groupColor: 'green', catanColor: 'white' },
  ],
});
const PAGE = `/statistik/${TABLE.id}`;

function day(text: string): LocalDate {
  const parsed = parseLocalDate(text);
  assert(parsed.ok, 'a calendar day');
  return parsed.value;
}

function match(id: number, fields: Partial<Match>): Match {
  return aMatch({
    id: toMatchId(`00000000-0000-4000-8000-0000000000${String(id)}`),
    groupId: TABLE.id,
    ...fields,
  });
}

const CATAN = match(14, {
  gameId: CATAN_GAME_ID,
  date: day('2026-11-01'),
  edition: 'base',
  mode: 'standard',
  winnerIds: [BEN],
  scores: { [ANNA]: 7, [BEN]: 10, [CLARA]: 8 },
  catanColors: { [ANNA]: 'red', [BEN]: 'blue', [CLARA]: 'white' },
  durationMinutes: 90,
});

// Anna wins the first, then Ben wins four in a row: Uno, Uno, Catan, Uno.
const MATCHES = [
  match(11, { date: day('2025-05-10'), winnerIds: [ANNA] }),
  match(12, { date: day('2026-03-01'), winnerIds: [BEN] }),
  match(13, { date: day('2026-10-01'), winnerIds: [BEN] }),
  CATAN,
  match(15, { date: day('2026-11-10'), winnerIds: [BEN] }),
];

async function seed(db: BoardBrainDb, matches: readonly Match[]): Promise<void> {
  await db.persons.bulkAdd([
    aPerson({ id: ANNA, name: 'Anna' }),
    aPerson({ id: BEN, name: 'Ben' }),
    aPerson({ id: CLARA, name: 'Clara' }),
  ]);
  await db.games.add(aCustomGame());
  await db.groups.add(TABLE);
  await db.matches.bulkAdd([...matches]);
}

function StatisticsRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/statistik/:groupId" element={<GroupView isStatistics />} />
      <Route
        path="/verwaltung/gruppen/:groupId/ergebnisse/:matchId"
        element={<ResultDetailView />}
      />
    </Routes>
  );
}

async function renderStatistics(
  path: string,
  matches: readonly Match[] = MATCHES,
): Promise<ReturnType<typeof renderWithApp>> {
  const view = renderWithApp(<StatisticsRoutes />, { path });
  await seed(view.db, matches);
  return view;
}

function podium(): HTMLElement {
  return screen.getByRole('region', { name: /^Podest nach/u });
}

describe('US-ST-01 Key figures and ranking of a table (design I3-D)', () => {
  it('AK-7: the card hand leads to the tab "Statistik" of the table', async () => {
    await renderStatistics(PAGE);

    expect(
      await screen.findByRole('tab', { name: 'Statistik', selected: true }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Rangliste' })).toBeInTheDocument();
  });

  it('AK-1: the podium shows the first three by wins, with their unit', async () => {
    await renderStatistics(PAGE);
    await screen.findByRole('heading', { name: 'Rangliste' });

    expect(podium()).toHaveAccessibleName('Podest nach Siege');
    expect(
      within(podium())
        .getAllByRole('listitem')
        .map((step) => step.getAttribute('aria-label')),
    ).toEqual(['Platz 2: Anna, 1 Sieg', 'Platz 1: Ben, 4 Siege', 'Platz 3: Clara, 0 Siege']);
    expect(within(podium()).getByText('5')).toBeInTheDocument();
    expect(within(podium()).getByText('seit 10.05.2025')).toBeInTheDocument();
  });

  it('AK-1: the ranking lists every member; a row unfolds the key figures of the person', async () => {
    const user = userEvent.setup();
    await renderStatistics(PAGE);

    const ben = await screen.findByRole('button', { name: 'Rang 1, Ben, 4 Siege' });
    expect(screen.getByRole('button', { name: 'Rang 2, Anna, 1 Sieg' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rang 3, Clara, 0 Siege' })).toBeInTheDocument();

    await user.click(ben);
    expect(ben).toHaveAttribute('aria-expanded', 'true');
    const details = screen.getByRole('group', { name: 'Kennzahlen von Ben' });
    expect(
      within(details)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['Siege', 'Siegquote', 'Durststrecke', 'Längste Serie', 'Ø Platz', 'Letzter']);
    expect(
      within(details)
        .getAllByRole('definition')
        .map((value) => value.textContent),
    ).toEqual(['4', '80 %', '0', '4', '1,0', '0']);
  });

  it('AK-6: from two wins in a row the current series has its own card that opens the person', async () => {
    const user = userEvent.setup();
    await renderStatistics(PAGE);

    await user.click(
      await screen.findByRole('button', { name: 'Ben, 4 Siege in Folge, Kennzahlen zeigen' }),
    );
    expect(screen.getByRole('button', { name: 'Rang 1, Ben, 4 Siege' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('AK-6: one win alone is no series card', async () => {
    await renderStatistics(PAGE, MATCHES.slice(0, 2));

    await screen.findByRole('heading', { name: 'Rangliste' });
    expect(screen.queryByRole('button', { name: /in Folge/u })).not.toBeInTheDocument();
  });

  it('AK-2: another criterion reorders the podium and stands in the address', async () => {
    const user = userEvent.setup();
    const { router } = await renderStatistics(PAGE);

    await user.click(await screen.findByRole('radio', { name: 'Längste Serie' }));
    expect(router.state.location.search).toBe('?nach=serie');
    expect(podium()).toHaveAccessibleName('Podest nach Längste Serie');
    expect(
      screen.getByRole('button', { name: 'Rang 1, Ben, 4 Siege in Folge' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rang 2, Anna, 1 Sieg' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rang 3, Clara, 0' })).toBeInTheDocument();
  });

  it('without results the tab invites to enter the first one', async () => {
    await renderStatistics(PAGE, []);

    const panel = await screen.findByRole('tabpanel', { name: 'Statistik' });
    expect(await within(panel).findByText('Noch keine Ergebnisse')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Ergebnis eintragen' })).toHaveAttribute(
      'href',
      `/verwaltung/gruppen/${TABLE.id}/ergebnis`,
    );
  });
});

describe('US-ST-03 Filter of the statistics (design I3-D ZE2)', () => {
  it('AK-1: a game in the filter shows only its matches and its criteria', async () => {
    const user = userEvent.setup();
    const { router } = await renderStatistics(PAGE);

    const games = await screen.findByRole('radiogroup', { name: 'Spiel' });
    expect(screen.getByRole('heading', { name: 'Spiele' })).toBeInTheDocument();
    await user.click(within(games).getByRole('radio', { name: /Catan/u }));

    expect(router.state.location.search).toBe(`?spiel=${CATAN_GAME_ID}`);
    expect(screen.getByRole('radio', { name: 'Ø Siegpunkte' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Spiele' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rang 1, Ben, 1 Sieg' })).toBeInTheDocument();
  });

  it('AK-1: a row of the matches per game filters to that game', async () => {
    const user = userEvent.setup();
    const { router } = await renderStatistics(PAGE);

    await user.click(
      await screen.findByRole('button', { name: 'Uno, 4 Partien, nur dieses Spiel zeigen' }),
    );
    expect(router.state.location.search).toBe(`?spiel=${aCustomGame().id}`);
  });

  it('AK-5: a year of the period sheet keeps only its matches', async () => {
    const user = userEvent.setup();
    const { router } = await renderStatistics(PAGE);

    await user.click(await screen.findByRole('button', { name: 'Zeitraum wählen, jetzt Gesamt' }));
    const sheet = screen.getByRole('dialog', { name: 'Zeitraum' });
    await user.click(within(sheet).getByRole('button', { name: '2025' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(router.state.location.search).toBe('?zeitraum=2025');
    expect(screen.getByRole('button', { name: 'Zeitraum wählen, jetzt 2025' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rang 1, Anna, 1 Sieg' })).toBeInTheDocument();
  });

  it('AK-6: an own range shows its errors at once and says how many matches it holds', async () => {
    const user = userEvent.setup();
    const { router } = await renderStatistics(PAGE);

    await user.click(await screen.findByRole('button', { name: 'Zeitraum wählen, jetzt Gesamt' }));
    const sheet = screen.getByRole('dialog', { name: 'Zeitraum' });
    const from = within(sheet).getByLabelText('Von');
    const to = within(sheet).getByLabelText('Bis');

    fireEvent.change(from, { target: { value: '2026-11-05' } });
    fireEvent.change(to, { target: { value: '2026-10-01' } });
    expect(within(sheet).getByRole('alert')).toHaveTextContent('Beginn nach Ende');
    const take = within(sheet).getByRole('button', { name: 'Übernehmen' });
    expect(take).toHaveAttribute('aria-disabled', 'true');
    // A tap on the greyed-out button takes nothing.
    await user.click(take);
    expect(screen.getByRole('dialog', { name: 'Zeitraum' })).toBeInTheDocument();

    fireEvent.change(to, { target: { value: '' } });
    expect(within(sheet).getByRole('alert')).toHaveTextContent('Beginn und Ende wählen');

    fireEvent.change(from, { target: { value: '2024-01-01' } });
    fireEvent.change(to, { target: { value: '2024-12-31' } });
    expect(within(sheet).queryByRole('alert')).not.toBeInTheDocument();
    expect(
      within(sheet).getByRole('button', { name: 'Keine Partien im Zeitraum' }),
    ).toHaveAttribute('aria-disabled', 'true');

    fireEvent.change(from, { target: { value: '2026-10-01' } });
    fireEvent.change(to, { target: { value: '2026-11-05' } });
    await user.click(within(sheet).getByRole('button', { name: '2 Partien zeigen' }));
    expect(router.state.location.search).toBe('?zeitraum=2026-10-01_2026-11-05');
    expect(
      screen.getByRole('button', { name: 'Zeitraum wählen, jetzt 01.10. – 05.11.2026' }),
    ).toBeInTheDocument();
  });

  it('AK-6: an end in the future is an error', async () => {
    const user = userEvent.setup();
    await renderStatistics(PAGE);

    await user.click(await screen.findByRole('button', { name: 'Zeitraum wählen, jetzt Gesamt' }));
    const sheet = screen.getByRole('dialog', { name: 'Zeitraum' });
    fireEvent.change(within(sheet).getByLabelText('Bis'), { target: { value: '2999-01-01' } });
    expect(within(sheet).getByRole('alert')).toHaveTextContent('Ende in der Zukunft');
  });

  it('the period sheet closes with Escape and with the grip without a change', async () => {
    const user = userEvent.setup();
    const { router } = await renderStatistics(PAGE);

    await user.click(await screen.findByRole('button', { name: 'Zeitraum wählen, jetzt Gesamt' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zeitraum wählen, jetzt Gesamt' }));
    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(router.state.location.search).toBe('');
  });

  it('AK-5: a period without matches says so and offers another one', async () => {
    const user = userEvent.setup();
    await renderStatistics(`${PAGE}?zeitraum=2024`);

    expect(await screen.findByText('Keine Partien im Zeitraum')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zeitraum ändern' }));
    expect(screen.getByRole('dialog', { name: 'Zeitraum' })).toBeInTheDocument();
  });
});

describe('US-ST-05 Records (design I3-D)', () => {
  it('AK-1: the series and the drought name the person and the span', async () => {
    await renderStatistics(PAGE);

    expect(await screen.findByRole('heading', { name: 'Rekorde' })).toBeInTheDocument();
    expect(screen.getByText('Ewige Serie')).toBeInTheDocument();
    expect(screen.getByText('4 Siege')).toBeInTheDocument();
    expect(screen.getByText('seit 01.03.2026')).toBeInTheDocument();
    expect(screen.getByText('Längste Durststrecke')).toBeInTheDocument();
  });

  it('AK-2: the longest match of one game opens that match', async () => {
    const user = userEvent.setup();
    const { router } = await renderStatistics(`${PAGE}?spiel=${CATAN_GAME_ID}`);

    await user.click(
      await screen.findByRole('link', { name: 'Längste Partie: 1 h 30 min, Partie ansehen' }),
    );
    expect(router.state.location.pathname).toBe(
      `/verwaltung/gruppen/${TABLE.id}/ergebnisse/${CATAN.id}`,
    );
    // The shortest match needs two matches with a duration.
    expect(screen.queryByText('Kürzeste Partie')).not.toBeInTheDocument();
  });
});
