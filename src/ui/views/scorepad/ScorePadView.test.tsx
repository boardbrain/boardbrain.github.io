import { aCustomGame, aGroup, aPerson, TEST_NOW } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toGameId, toPersonId, type ScoreTarget } from '@/core/model';
import { createScorePad, type ScorePad, type ScorePadCalculation } from '@/core/scorepad';
import type { BoardBrainDb } from '@/infra/db/database';
import { StartView } from '@/ui/views/start/StartView';
import { PadGameChoiceView } from './PadGameChoiceView';
import { NewScorePadView, ScorePadView } from './ScorePadView';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const TABLE = aGroup({ name: 'Freitagsrunde' });
const SKYJO = aCustomGame({ name: 'Skyjo', scoring: 'lowest-wins' });

async function seed(db: BoardBrainDb, pad?: Partial<ScorePad>): Promise<void> {
  await db.persons.bulkAdd([aPerson(), aPerson({ id: BEN, name: 'Ben' })]);
  await db.groups.add(TABLE);
  await db.games.add(SKYJO);
  if (pad !== undefined) {
    await db.scorePad.put({
      ...createScorePad({
        gameId: SKYJO.id,
        groupId: TABLE.id,
        participants: [ANNA, BEN],
        startedAt: TEST_NOW,
        settings: { target: null, calculation: 'app' },
      }),
      ...pad,
    });
  }
}

function settings(
  target: ScoreTarget | null,
  calculation: ScorePadCalculation = 'app',
): ScorePad['settings'] {
  return { target, calculation };
}

// The field above the keyboard, named after the person and what is typed.
function field(): HTMLElement {
  return screen.getByRole('textbox', { name: /, (Runde \d+|Neuer Stand)/ });
}

describe('US-NB-01 start a score pad', () => {
  it('AK-1: the game choice shows only active custom games with points', async () => {
    const { db } = renderWithApp(<PadGameChoiceView />, { path: '/notizblock/neu' });
    await seed(db);
    await db.games.add(
      aCustomGame({ id: toGameId('00000000-0000-4000-8000-0000000000b9'), name: 'Uno' }),
    );

    expect(await screen.findByRole('link', { name: 'Skyjo' })).toHaveAttribute(
      'href',
      `/notizblock/neu/${SKYJO.id}`,
    );
    expect(screen.queryByRole('link', { name: 'Uno' })).not.toBeInTheDocument();
    expect(screen.getByText('Spiele ohne Punkte: Ergebnis eintragen')).toBeInTheDocument();
  });

  it('AK-1: the game choice has the search and the order of the game list (PO 25.11.2026)', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<PadGameChoiceView />, { path: '/notizblock/neu' });
    await seed(db);
    await db.games.add(
      aCustomGame({
        id: toGameId('00000000-0000-4000-8000-0000000000b8'),
        name: 'Wizard',
        scoring: 'highest-wins',
      }),
    );

    expect(
      await screen.findByRole('button', { name: /^Sortiert nach zuletzt gespielt/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Spiele suchen' }));
    await user.type(screen.getByRole('searchbox'), 'wiz');
    expect(screen.getByRole('link', { name: 'Wizard' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Skyjo' })).not.toBeInTheDocument();
  });

  it('AK-3: "Los geht’s" starts the score pad with the chosen target', async () => {
    const user = userEvent.setup();
    // The data come first, so the page does not lead away before them.
    const { db, router } = renderWithApp(<NewScorePadView />, {
      routes: [
        { path: '/', element: <p>start</p> },
        { path: '/notizblock/neu/:gameId/:groupId', element: <NewScorePadView /> },
        { path: '/notizblock', element: <ScorePadView /> },
      ],
      path: '/',
    });
    await seed(db);
    await router.navigate(`/notizblock/neu/${SKYJO.id}/${TABLE.id}`);

    const sheet = await screen.findByRole('dialog', { name: 'Los geht’s' });
    expect(within(sheet).getByText('Ihr beendet selbst')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Runden' }));
    expect(within(sheet).getByRole('button', { name: '10' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(within(sheet).getByRole('button', { name: 'Andere' }));
    await user.clear(within(sheet).getByRole('textbox', { name: 'Eigenes Ziel' }));
    await user.type(within(sheet).getByRole('textbox', { name: 'Eigenes Ziel' }), '7');
    await user.click(within(sheet).getByRole('button', { name: 'Selbst rechnen' }));
    await user.click(within(sheet).getByRole('button', { name: 'Starten' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/notizblock');
    });
    const pad = await db.scorePad.get('current');
    expect(pad?.settings).toEqual(settings({ kind: 'rounds', value: 7 }, 'self'));
    expect(await screen.findByRole('button', { name: 'Ziel 7R, ändern' })).toBeInTheDocument();
  });

  it('"Zurück" in a running score pad leads to the start (PO 24.11.2026)', async () => {
    const user = userEvent.setup();
    const { db, router } = renderWithApp(<ScorePadView />, {
      routes: [
        { path: '/', element: <p>start</p> },
        { path: '/notizblock/neu/:gameId', element: <p>table</p> },
        { path: '/notizblock', element: <ScorePadView /> },
      ],
      path: '/',
    });
    await seed(db, { rounds: [{ [ANNA]: 3, [BEN]: 4 }] });
    await router.navigate(`/notizblock/neu/${SKYJO.id}`);
    await router.navigate('/notizblock');

    await user.click(await screen.findByRole('button', { name: 'Zurück' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('the choice of game leads to the start while a score pad runs (E-51)', async () => {
    const { db, router } = renderWithApp(<PadGameChoiceView />, {
      routes: [
        { path: '/', element: <p>start</p> },
        { path: '/notizblock/neu', element: <PadGameChoiceView /> },
      ],
      path: '/',
    });
    await seed(db, {});
    await router.navigate('/notizblock/neu');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('AK-4: the start shows the running score pad; "Partie" asks first', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<StartView />);
    await seed(db, { rounds: [{ [ANNA]: 3, [BEN]: 4 }] });

    const row = await screen.findByRole('link', { name: /Skyjo · Freitagsrunde · Runde 2/ });
    expect(row).toHaveAttribute('href', '/notizblock');
    await user.click(screen.getByRole('button', { name: 'Partie' }));
    const ask = screen.getByRole('alertdialog', { name: 'Notizblock läuft' });
    expect(within(ask).getByText('Erst beenden, dann neue Partie')).toBeInTheDocument();
  });
});

describe('US-NB-02 enter and correct rounds', () => {
  it('AK-2, AK-3: "Weiter" moves on and the complete round stores itself', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<ScorePadView />, { path: '/notizblock' });
    await seed(db, {});

    await user.click(await screen.findByRole('button', { name: 'Runde 1, Anna' }));
    expect(screen.getByText('Runde 1')).toBeInTheDocument();
    await user.type(field(), '12{Enter}');
    await user.click(screen.getByRole('button', { name: 'Vorzeichen wechseln' }));
    // The minus alone is seen: the key is pressed and the field shows a real minus sign.
    expect(screen.getByRole('button', { name: 'Vorzeichen wechseln' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(field()).toHaveValue('−');
    await user.type(field(), '5{Enter}');

    await waitFor(async () => {
      expect((await db.scorePad.get('current'))?.rounds).toEqual([{ [ANNA]: 12, [BEN]: -5 }]);
    });
    expect(
      await screen.findByRole('button', { name: 'Runde 1, Ben: Stand -5, ändern' }),
    ).toBeInTheDocument();
  });

  it('AK-3: leaving the field with a person missing marks it', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<ScorePadView />, { path: '/notizblock' });
    await seed(db, {});

    await user.click(await screen.findByRole('button', { name: 'Runde 1, Anna' }));
    await user.type(field(), '12');
    field().blur();

    expect(await screen.findByText('Noch nicht alle eingetragen')).toBeInTheDocument();
    expect((await db.scorePad.get('current'))?.rounds).toEqual([]);
  });

  it('AK-4: a stored number is changed, a round deleted after asking', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<ScorePadView />, { path: '/notizblock' });
    await seed(db, {
      rounds: [
        { [ANNA]: 3, [BEN]: 4 },
        { [ANNA]: 1, [BEN]: 1 },
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'Runde 1, Ben: Stand 4, ändern' }));
    expect(screen.getByText('Runde 1 ändern')).toBeInTheDocument();
    await user.clear(field());
    await user.type(field(), '9');
    // The cell shows what is typed before it is stored.
    expect(screen.getByRole('button', { name: 'Runde 1, Ben: Stand 4, ändern' })).toHaveTextContent(
      '9',
    );
    await user.type(field(), '{Enter}');
    expect(
      await screen.findByRole('button', { name: 'Runde 2, Ben: Stand 10, ändern' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Runde 1 löschen' }));
    await user.click(
      within(screen.getByRole('alertdialog', { name: 'Runde 1 löschen?' })).getByRole('button', {
        name: 'Löschen',
      }),
    );
    await waitFor(async () => {
      expect((await db.scorePad.get('current'))?.rounds).toEqual([{ [ANNA]: 1, [BEN]: 1 }]);
    });
  });
});

describe('US-NB-03 target and calculation', () => {
  it('AK-3: calculating oneself, the new standing is typed and only standings are shown', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<ScorePadView />, { path: '/notizblock' });
    await seed(db, {
      settings: settings(null, 'self'),
      rounds: [{ [ANNA]: 10, [BEN]: 20 }],
    });

    await user.click(await screen.findByRole('button', { name: 'Runde 2, Anna' }));
    expect(screen.getByText('Neuer Stand')).toBeInTheDocument();
    await user.type(field(), '15{Enter}');
    await user.type(field(), '18{Enter}');

    await waitFor(async () => {
      expect((await db.scorePad.get('current'))?.rounds.at(-1)).toEqual({ [ANNA]: 5, [BEN]: -2 });
    });
    expect(screen.queryByText('+5')).not.toBeInTheDocument();
  });

  it('AK-4: reaching the target shows "Ziel erreicht" once', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<ScorePadView />, { path: '/notizblock' });
    await seed(db, { settings: settings({ kind: 'points', value: 10 }) });

    await user.click(await screen.findByRole('button', { name: 'Runde 1, Anna' }));
    await user.type(field(), '12{Enter}');
    await user.type(field(), '3{Enter}');

    const sheet = await screen.findByRole('dialog', { name: 'Ziel erreicht' });
    expect(within(sheet).getByText('Anna hat 12 Punkte')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Weiterspielen' }));
    expect(screen.queryByRole('dialog', { name: 'Ziel erreicht' })).not.toBeInTheDocument();
    expect((await db.scorePad.get('current'))?.isTargetNoticed).toBe(true);
  });
});

describe('US-NB-04 end a score pad', () => {
  it('AK-3: "Beenden ohne Ergebnis" asks and discards', async () => {
    const user = userEvent.setup();
    // Without a score pad the view leads to the start; the seed follows the first drawing.
    const { db } = renderWithApp(<ScorePadView />, { path: '/notizblock' });
    await seed(db, { rounds: [{ [ANNA]: 3, [BEN]: 4 }] });

    await user.click(await screen.findByRole('button', { name: 'Beenden ohne Ergebnis' }));
    const ask = screen.getByRole('alertdialog', { name: 'Notizblock beenden?' });
    expect(within(ask).getByText('1 Runde wird verworfen')).toBeInTheDocument();
    await user.click(within(ask).getByRole('button', { name: 'Beenden' }));

    await waitFor(async () => {
      expect(await db.scorePad.count()).toBe(0);
    });
  });
});
