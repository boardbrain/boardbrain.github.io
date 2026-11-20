import { aCustomGame, aGroup } from '@tests/support/masterDataFakes';
import { aMatch } from '@tests/support/resultFakes';
import { OverviewRoutes } from '@tests/support/overviewRoutes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toGameId, toGroupId } from '@/core/model';
import { CATAN_GAME_ID } from '@/games/catan';

const UNO = toGameId('00000000-0000-4000-8000-0000000000b1');
const SKYJO = toGameId('00000000-0000-4000-8000-0000000000b2');
const PATH = `/verwaltung/spiele/${UNO}`;

describe('US-VW-07 Edit a custom game (game page)', () => {
  it('shows the game with the tables that play only this game', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await db.games.add(aCustomGame({ id: UNO, name: 'Uno' }));
    await db.groups.bulkAdd([
      aGroup({
        id: toGroupId('00000000-0000-4000-8000-0000000000c1'),
        name: 'Uno-Abend',
        binding: { kind: 'game', gameId: UNO },
        members: aGroup().members.map(({ personId, groupColor }) => ({ personId, groupColor })),
      }),
      aGroup({ id: toGroupId('00000000-0000-4000-8000-0000000000c2'), name: 'Alle' }),
    ]);

    expect(await screen.findByRole('heading', { name: 'Uno', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('eigenes Spiel · angelegt am 07.10.2026')).toBeInTheDocument();
    const tables = screen.getByRole('list', { name: 'Tische nur für Uno' });
    expect(
      within(tables)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Uno-Abend2 Personen']);
  });

  it('says when no table plays only this game', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await db.games.add(aCustomGame({ id: UNO, name: 'Uno' }));

    expect(await screen.findByText(/Noch kein Tisch spielt nur Uno\./)).toBeInTheDocument();
  });

  it('AK-1: "Bearbeiten" opens its own page and renames the game', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await db.games.add(aCustomGame({ id: UNO, name: 'Unno' }));

    await user.click(await screen.findByRole('link', { name: 'Bearbeiten' }));
    const editor = await screen.findByRole('dialog', { name: 'Spiel bearbeiten' });
    const field = within(editor).getByRole('textbox', { name: 'Name des Spiels' });
    await user.clear(field);
    await user.type(field, 'Uno');
    await user.click(within(editor).getByRole('button', { name: 'Änderungen speichern' }));

    expect(await screen.findByRole('heading', { name: 'Uno', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect((await db.games.get(UNO))?.name).toBe('Uno');
  });

  it.each(['skyjo', 'CATAN'])('AK-1: refuses the name %j of another game', async (name) => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: `${PATH}/bearbeiten` });
    await db.games.bulkAdd([
      aCustomGame({ id: UNO, name: 'Uno' }),
      aCustomGame({ id: SKYJO, name: 'Skyjo' }),
    ]);

    const field = await screen.findByRole('textbox', { name: 'Name des Spiels' });
    await user.clear(field);
    await user.type(field, name);

    // Checked while typing; saving stays blocked.
    expect(screen.getByText('Name gibt es schon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Änderungen speichern' })).toBeDisabled();
    expect((await db.games.get(UNO))?.name).toBe('Uno');
  });

  it('AK-3: a new direction of a game with points asks before saving', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: `${PATH}/bearbeiten` });
    await db.games.add(aCustomGame({ id: UNO, name: 'Skyjo', scoring: 'lowest-wins' }));
    await db.matches.add(
      aMatch({ gameId: UNO, scores: { [aGroup().members[0]?.personId ?? '']: 3 } }),
    );

    await user.click(await screen.findByRole('radio', { name: /Meiste Punkte gewinnen/ }));
    await user.click(screen.getByRole('button', { name: 'Änderungen speichern' }));
    const question = await screen.findByRole('alertdialog', { name: 'Wertung umkehren?' });
    expect(question).toHaveTextContent('Plätze und Statistik von 1 Ergebnis ändern sich');
    await user.click(within(question).getByRole('button', { name: 'Umkehren' }));

    await screen.findByRole('heading', { name: 'Skyjo', level: 1 });
    expect((await db.games.get(UNO))?.scoring).toBe('highest-wins');
  });

  it('AK-4: "Keine" is locked while a result has points, with the reason', async () => {
    const { db } = renderWithApp(<OverviewRoutes />, { path: `${PATH}/bearbeiten` });
    await db.games.add(aCustomGame({ id: UNO, name: 'Skyjo', scoring: 'lowest-wins' }));
    await db.matches.add(
      aMatch({ gameId: UNO, scores: { [aGroup().members[0]?.personId ?? '']: 3 } }),
    );

    expect(
      await screen.findByText('„Keine“ gesperrt · 1 Ergebnis mit Punkten'),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Keine Punkte/ })).toBeDisabled();
  });

  it('AK-2: Catan has no game page', async () => {
    renderWithApp(<OverviewRoutes />, { path: `/verwaltung/spiele/${CATAN_GAME_ID}` });

    expect(await screen.findByText('Dieses Spiel gibt es nicht.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Bearbeiten' })).not.toBeInTheDocument();
  });

  it('a custom game in the game list opens its page; Catan is built in', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: '/verwaltung/spiele' });
    await db.games.add(aCustomGame({ id: UNO, name: 'Uno' }));

    expect(await screen.findByRole('group', { name: 'Catan' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Catan' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('link', { name: 'Uno' }));

    expect(await screen.findByRole('heading', { name: 'Uno', level: 1 })).toBeInTheDocument();
  });
});
