import { aCustomGame, aGroup, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { aMatch } from '@tests/support/resultFakes';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import {
  parseLocalDate,
  toGroupId,
  toMatchId,
  toPersonId,
  type LocalDate,
  type Match,
} from '@/core/model';
import { assert } from '@/core/shared';
import type { BoardBrainDb } from '@/infra/db/database';
import { GroupView } from '@/ui/views/management/GroupView';
import { StatsTablesView } from './StatsTablesView';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const FRIDAY = aGroup({ name: 'Freitagsrunde' });
const FAMILY = aGroup({ id: toGroupId('00000000-0000-4000-8000-0000000000c2'), name: 'Familie' });
const FRIENDS = aGroup({ id: toGroupId('00000000-0000-4000-8000-0000000000c3'), name: 'Freunde' });
const OLD = aGroup({
  id: toGroupId('00000000-0000-4000-8000-0000000000c4'),
  name: 'Alte Runde',
  archived: true,
});

function day(text: string): LocalDate {
  const parsed = parseLocalDate(text);
  assert(parsed.ok, 'a calendar day');
  return parsed.value;
}

function match(id: number, fields: Partial<Match>): Match {
  return aMatch({ id: toMatchId(`00000000-0000-4000-8000-0000000000${String(id)}`), ...fields });
}

async function seed(db: BoardBrainDb, matches: readonly Match[]): Promise<void> {
  await db.persons.bulkAdd([
    aPerson({ id: ANNA, name: 'Anna' }),
    aPerson({ id: BEN, name: 'Ben' }),
  ]);
  await db.games.add(aCustomGame());
  await db.groups.bulkAdd([FRIDAY, FAMILY, FRIENDS, OLD]);
  await db.matches.bulkAdd([...matches]);
}

function StatisticsRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/statistik" element={<StatsTablesView />} />
      <Route path="/statistik/:groupId" element={<GroupView isStatistics />} />
    </Routes>
  );
}

const MATCHES = [
  match(11, { groupId: FRIDAY.id, date: day('2026-10-02'), winnerIds: [BEN] }),
  match(12, { groupId: FRIDAY.id, date: day('2026-10-09'), winnerIds: [BEN] }),
  match(13, { groupId: FRIDAY.id, date: day('2026-10-16'), winnerIds: [ANNA] }),
  match(14, { groupId: FAMILY.id, date: day('2026-11-01'), winnerIds: [ANNA] }),
  match(15, { groupId: FAMILY.id, date: day('2026-11-08'), winnerIds: [BEN] }),
];

describe('US-ST-01 AK-7 Choice of the table (design I3-D KS2, TW1)', () => {
  it('lists the tables last played first and those without matches at the end', async () => {
    const { db } = renderWithApp(<StatisticsRoutes />, { path: '/statistik' });
    await seed(db, MATCHES);

    expect(await screen.findByRole('heading', { name: 'Statistik' })).toBeInTheDocument();
    const cards = await screen.findAllByRole('link', { name: /Partien/u });
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual([
      'Familie, 2 Partien, vorn Gleichstand, 1 Sieg',
      'Freitagsrunde, 3 Partien, vorn Ben, 2 Siege',
      'Freunde, noch keine Partien',
    ]);
  });

  it('a card opens the statistics of its table', async () => {
    const user = userEvent.setup();
    const { db, router } = renderWithApp(<StatisticsRoutes />, { path: '/statistik' });
    await seed(db, MATCHES);

    await user.click(
      await screen.findByRole('link', { name: 'Freitagsrunde, 3 Partien, vorn Ben, 2 Siege' }),
    );
    expect(router.state.location.pathname).toBe(`/statistik/${FRIDAY.id}`);
    expect(
      await screen.findByRole('tab', { name: 'Statistik', selected: true }),
    ).toBeInTheDocument();
  });

  it('an archived table shows only with matches', async () => {
    const { db } = renderWithApp(<StatisticsRoutes />, { path: '/statistik' });
    await seed(db, [...MATCHES, match(16, { groupId: OLD.id, date: day('2025-01-03') })]);

    expect(
      await screen.findByRole('link', { name: 'Alte Runde, 1 Partie, vorn Anna, 1 Sieg' }),
    ).toBeInTheDocument();
  });

  it('without tables it says so', async () => {
    renderWithApp(<StatisticsRoutes />, { path: '/statistik' });

    expect(await screen.findByText('Noch keine Tische angelegt.')).toBeInTheDocument();
  });
});
