import { aCustomGame, aGroup, aPerson } from '@tests/support/masterDataFakes';
import { OverviewRoutes } from '@tests/support/overviewRoutes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { aMatch } from '@tests/support/resultFakes';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toGameId, toPersonId } from '@/core/model';
import type { BoardBrainDb } from '@/infra/db/database';
import { ResultEditView, ResultView } from './ResultView';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const TABLE = aGroup({ name: 'Freitagsrunde' });
const SKYJO = aCustomGame({ name: 'Skyjo', scoring: 'lowest-wins' });
const UNO = aCustomGame({ id: toGameId('00000000-0000-4000-8000-0000000000b2'), name: 'Uno' });
const ROUNDS = [
  { [ANNA]: 12, [BEN]: 25 },
  { [ANNA]: 8, [BEN]: -30 },
];
const MATCH = aMatch({
  gameId: SKYJO.id,
  winnerIds: [BEN],
  scores: { [ANNA]: 20, [BEN]: -5 },
  rounds: ROUNDS,
  target: { kind: 'points', value: 100 },
});
const PAGE = `/verwaltung/gruppen/${TABLE.id}/ergebnisse/${MATCH.id}`;

async function seed(db: BoardBrainDb): Promise<void> {
  await db.persons.bulkAdd([aPerson(), aPerson({ id: BEN, name: 'Ben' })]);
  await db.groups.add(TABLE);
  await db.games.bulkAdd([SKYJO, UNO]);
  await db.matches.add(MATCH);
}

const ROUTES = [
  { path: '/', element: <p>start</p> },
  { path: '/ergebnis/neu/:gameId/:groupId', element: <ResultView /> },
  { path: '/notizblock/neu/:gameId/:groupId', element: <p>pad</p> },
  {
    path: '/verwaltung/gruppen/:groupId/ergebnisse/:matchId/bearbeiten',
    element: <ResultEditView />,
  },
];

// The data come first, so a view does not lead away before them.
async function open(path: string): Promise<BoardBrainDb> {
  const { db, router } = renderWithApp(<p />, { routes: ROUTES, path: '/' });
  await seed(db);
  await router.navigate(path);
  return db;
}

// The field above the keyboard while a number of a round is changed.
function field(): HTMLElement {
  return screen.getByRole('textbox', { name: /, Runde \d+ ändern/ });
}

describe('US-NB-01 AK-2 the score pad from the result form (design I3-C2 FB6)', () => {
  it('a new result of a custom game with points offers the score pad after asking', async () => {
    const user = userEvent.setup();
    const db = await open(`/ergebnis/neu/${SKYJO.id}/${TABLE.id}`);
    await user.click(await screen.findByRole('button', { name: 'Notizblock: live mitschreiben' }));

    // The small symbol is easily hit: it asks first (PO 25.11.2026).
    const ask = screen.getByRole('alertdialog', { name: 'Zum Notizblock wechseln?' });
    await user.click(within(ask).getByRole('button', { name: 'Abbrechen' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Notizblock: live mitschreiben' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Zum Notizblock' }),
    );
    expect(await screen.findByText('pad')).toBeInTheDocument();
    expect(await db.scorePad.count()).toBe(0);
  });

  it('a game without points has no button', async () => {
    await open(`/ergebnis/neu/${UNO.id}/${TABLE.id}`);
    expect(await screen.findByText('Uno · Freitagsrunde')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Notizblock: live mitschreiben' }),
    ).not.toBeInTheDocument();
  });
});

describe('US-NB-05 rounds in the result', () => {
  it('AK-1: the detail shows the rounds in a card that opens', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: PAGE });
    await seed(db);

    const card = await screen.findByRole('button', { name: 'Runden zeigen' });
    expect(card).toHaveTextContent('2 Runden');
    expect(card).toHaveTextContent('100P');
    await user.click(card);
    expect(await screen.findByLabelText('Runde 2, Ben: Stand -5')).toBeInTheDocument();
  });

  it('AK-2: changing a number of a round changes the points; the rounds are stored', async () => {
    const user = userEvent.setup();
    const db = await open(`${PAGE}/bearbeiten`);

    await user.click(await screen.findByRole('button', { name: 'Runde 2, Ben: Stand -5, ändern' }));
    await user.clear(field());
    await user.type(field(), '30{Enter}');
    expect(
      await screen.findByRole('button', { name: 'Runde 2, Ben: Stand 55, ändern' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Änderungen speichern' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Speichern' }),
    );
    await waitFor(async () => {
      expect((await db.matches.get(MATCH.id))?.rounds).toEqual([
        ROUNDS[0],
        { [ANNA]: 8, [BEN]: 30 },
      ]);
    });
    expect((await db.matches.get(MATCH.id))?.scores).toEqual({ [ANNA]: 20, [BEN]: 55 });
  });

  it('AK-3: "Sieger oder Rangfolge" warns that the rounds are lost', async () => {
    const user = userEvent.setup();
    await open(`${PAGE}/bearbeiten`);

    await user.click(await screen.findByRole('switch', { name: /Sieger oder Rangfolge/ }));
    const ask = screen.getByRole('alertdialog', { name: 'Runden verwerfen?' });
    expect(
      within(ask).getByText('Ohne Punkte zählt das Ergebnis nicht für Ø Punkte und Bestwerte'),
    ).toBeInTheDocument();
    await user.click(within(ask).getByRole('button', { name: 'Verwerfen' }));
    expect(screen.getByRole('switch', { name: /Sieger oder Rangfolge/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
