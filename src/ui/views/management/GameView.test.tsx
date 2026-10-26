import { aCustomGame, aGroup } from '@tests/support/masterDataFakes';
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

describe('US-VW-07 Rename a custom game (game page)', () => {
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

  it('AK-1: renames the game in place', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await db.games.add(aCustomGame({ id: UNO, name: 'Unno' }));

    await user.click(await screen.findByRole('button', { name: 'Umbenennen' }));
    await user.clear(screen.getByLabelText('Neuer Spielname'));
    await user.type(screen.getByLabelText('Neuer Spielname'), 'Uno{Enter}');

    expect(await screen.findByRole('heading', { name: 'Uno', level: 1 })).toBeInTheDocument();
    expect((await db.games.get(UNO))?.name).toBe('Uno');
  });

  it.each(['skyjo', 'CATAN'])('AK-1: refuses the name %j of another game', async (name) => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: PATH });
    await db.games.bulkAdd([
      aCustomGame({ id: UNO, name: 'Uno' }),
      aCustomGame({ id: SKYJO, name: 'Skyjo' }),
    ]);

    await user.click(await screen.findByRole('button', { name: 'Umbenennen' }));
    await user.clear(screen.getByLabelText('Neuer Spielname'));
    await user.type(screen.getByLabelText('Neuer Spielname'), name);

    // Checked while typing; saving stays blocked.
    expect(screen.getByRole('alert')).toHaveTextContent(
      `Es gibt bereits ein Spiel namens „${name}“. Bitte wähle einen anderen Namen.`,
    );
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
    expect((await db.games.get(UNO))?.name).toBe('Uno');
  });

  it('AK-2: Catan has no game page', async () => {
    renderWithApp(<OverviewRoutes />, { path: `/verwaltung/spiele/${CATAN_GAME_ID}` });

    expect(await screen.findByText('Dieses Spiel gibt es nicht.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Umbenennen' })).not.toBeInTheDocument();
  });

  it('a custom game in the game list opens its page; Catan is built in', async () => {
    const user = userEvent.setup();
    const { db } = renderWithApp(<OverviewRoutes />, { path: '/verwaltung/spiele' });
    await db.games.add(aCustomGame({ id: UNO, name: 'Uno' }));

    const supported = screen.getByRole('list', { name: 'Unterstützte Spiele' });
    expect(supported).toHaveTextContent('fest eingebaut');
    expect(within(supported).queryByRole('link')).not.toBeInTheDocument();
    await user.click(await screen.findByRole('link', { name: /^Uno/ }));

    expect(await screen.findByRole('heading', { name: 'Uno', level: 1 })).toBeInTheDocument();
  });
});
