import { aGroup, aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { aStoredSession } from '@tests/support/sessionFakes';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RouteObject } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { SessionService } from '@/app/services/sessionService';
import { toPersonId } from '@/core/model';
import { CATAN_DEFAULT_OPTIONS, type CatanOptions } from '@/games/catan';
import type { BoardBrainDb } from '@/infra/db/database';
import { MatchView } from './MatchView';

type User = ReturnType<typeof userEvent.setup>;

const NAMES = ['Anna', 'Ben', 'Clara', 'David'];
const COLORS = ['red', 'blue', 'white', 'orange'] as const;
const TABLE = aGroup({
  name: 'Freitagsrunde',
  members: NAMES.map((_, index) => ({
    personId: toPersonId(`00000000-0000-4000-8000-0000000000a${String(index + 1)}`),
    groupColor: 'teal',
    catanColor: COLORS[index] ?? 'red',
  })),
});
const NO_DRAWS = { landscapes: false, harbors: false, numbers: false };
const FORWARD = /^(Losen|Weiter|Blättern|Alle umdrehen|Zur Übersicht)$/;

const ROUTES: RouteObject[] = [
  { path: '/', element: <h1>start page</h1> },
  { path: '/partie', element: <MatchView /> },
  { path: '/partie/uebersicht', element: <h1>overview page</h1> },
];

async function startMatch(
  options: Partial<CatanOptions> = {},
): Promise<{ db: BoardBrainDb; session: SessionService }> {
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
  await act(() => router.navigate('/partie'));
  return { db, session };
}

const FORWARD_TIMEOUT_MS = 5000;

// Taps the forward button with this name and waits until it has done its work: the page
// attribute of the view changes (on the board the buttons stay in place), and the buttons are
// enabled again.
async function tapForward(user: User, name: string): Promise<void> {
  const button = await screen.findByRole('button', { name });
  await waitFor(() => {
    expect(button).toBeEnabled();
  });
  const page = screen.getByRole('main').getAttribute('data-page');
  await user.click(button);
  await waitFor(
    () => {
      const main = screen.queryByRole('main');
      expect(main?.getAttribute('data-page')).not.toBe(page);
      const forward = main === null ? null : within(main).queryByRole('button', { name: FORWARD });
      expect(forward?.hasAttribute('disabled') ?? false).toBe(false);
      // Saving the step and the database's live query take longer under the load of the full
      // suite with coverage; one second was too tight there (K-9, check run 12.11.2026).
    },
    { timeout: FORWARD_TIMEOUT_MS },
  );
}

// The label as shown: the old one may still be fading out, hidden (design I2-E, A2).
function forwardName(): string {
  const label = screen.getByRole('button', { name: FORWARD }).cloneNode(true);
  if (!(label instanceof HTMLElement)) {
    return '';
  }
  for (const hidden of label.querySelectorAll('[aria-hidden="true"]')) {
    hidden.remove();
  }
  return label.textContent;
}

// The filled part of each phase's bar, as set by the page.
function barWidths(): string[] {
  return within(screen.getByRole('list', { name: 'Fortschritt' }))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('span')?.style.width ?? '');
}

function progress(): string[] {
  return within(screen.getByRole('list', { name: 'Fortschritt' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

describe('US-AB-02 Go through the generation', () => {
  it('AK-3: shows the first step without a result; nothing is drawn yet', async () => {
    const { db } = await startMatch();

    expect(await screen.findByRole('heading', { name: 'Losen' })).toBeInTheDocument();
    expect(screen.getByText('Landschaftsfelder')).toBeInTheDocument();
    expect(screen.getByText('Wer?')).toBeInTheDocument();
    expect(screen.getByText('Freitagsrunde · Basisspiel')).toBeInTheDocument();
    // PO 12.11.2026: the label counts the step at hand.
    expect(progress()).toEqual(['Losen 1/3', 'Reihenfolge', 'Platzierung', 'Rohstoffe']);
    expect(barWidths()[0]).toBe(`${String(100 / 3)}%`);
    // PO 09.11.2026: the button stays in its place, but there is nothing to repeat yet.
    expect(screen.getByRole('button', { name: 'Wiederholen' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeDisabled();
    const [stored] = await db.session.toArray();
    expect(stored?.generation.steps).toHaveLength(0);
  });

  it('AK-1: "Losen" draws the step; "Weiter" leads to the next draw without drawing it', async () => {
    const user = userEvent.setup();
    const { db } = await startMatch();
    await screen.findByText('Wer?');

    await tapForward(user, 'Losen');

    expect(await screen.findByText('legt sie aus')).toBeInTheDocument();
    expect(shownTexts('Wer?')).toHaveLength(0);
    expect(progress()[0]).toBe('Losen 1/3');
    expect(screen.getByRole('button', { name: 'Wiederholen' })).toBeEnabled();
    await tapForward(user, 'Weiter');

    expect(await screen.findByText('Häfen')).toBeInTheDocument();
    expect(screen.getByText('Wer?')).toBeInTheDocument();
    const [stored] = await db.session.toArray();
    expect(stored?.generation.steps.map((record) => record.status)).toEqual(['confirmed']);
  });

  it('US-SR-01 AK-6: the starting resources are turned over before going on', async () => {
    const user = userEvent.setup();
    const { db } = await startMatch({
      personDraws: NO_DRAWS,
      order: { mode: 'none' },
      startingResources: { count: 2, replacement: 'with' },
    });
    expect(await screen.findByRole('heading', { name: 'Startrohstoffe' })).toBeInTheDocument();
    expect(progress()).toEqual(['Platzierung', 'Rohstoffe 1/4']);

    await tapForward(user, 'Losen');
    await waitFor(() => {
      expect(shownTexts('Antippen')).toHaveLength(2);
    });
    await user.click(screen.getByRole('button', { name: 'Karte 1 umdrehen' }));
    await waitFor(() => {
      expect(shownTexts('Antippen')).toHaveLength(1);
    });
    expect(forwardName()).toBe('Alle umdrehen');
    await tapForward(user, 'Alle umdrehen');

    expect(shownTexts('Antippen')).toHaveLength(0);
    expect(forwardName()).toBe('Weiter');
    const [stored] = await db.session.toArray();
    expect(stored?.generation.gameState.openedResources).toEqual([
      { personId: TABLE.members[0]?.personId, cards: [0, 1] },
    ]);
  });

  it('AK-1: after the last step "Zur Übersicht" leads to the overview', async () => {
    const user = userEvent.setup();
    await startMatch({
      personDraws: NO_DRAWS,
      order: { mode: 'none' },
      startingResources: { count: 1, replacement: 'with' },
    });
    await screen.findByRole('heading', { name: 'Startrohstoffe' });

    for (let person = 0; person < 4; person++) {
      await tapForward(user, 'Losen');
      await tapForward(user, 'Alle umdrehen');
      if (person < 3) {
        await tapForward(user, 'Weiter');
      }
    }
    await tapForward(user, 'Zur Übersicht');

    expect(await screen.findByRole('heading', { name: 'overview page' })).toBeInTheDocument();
    // Twelve taps through every person: with coverage and other test files running at the same
    // time this takes longer than the default 5 s.
  }, 15_000);
});

describe('US-AB-04 AK-3, AK-4 Look back', () => {
  it('shows an earlier step with the note, "Blättern" and back to the current step', async () => {
    const user = userEvent.setup();
    const { db } = await startMatch();
    await tapForward(user, 'Losen');
    await tapForward(user, 'Weiter');
    await tapForward(user, 'Losen');
    expect(await screen.findByText('Häfen')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zurück' }));

    expect(await screen.findByText('Rückblick')).toBeInTheDocument();
    expect(screen.getByText('Landschaftsfelder')).toBeInTheDocument();
    expect(forwardName()).toBe('Blättern');
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeDisabled();
    await tapForward(user, 'Blättern');
    expect(await screen.findByText('Häfen')).toBeInTheDocument();
    expect(screen.queryByText('Rückblick')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zurück' }));
    await user.click(await screen.findByRole('button', { name: 'Zum aktuellen Schritt' }));
    expect(await screen.findByText('Häfen')).toBeInTheDocument();
    // Nothing was drawn while looking back.
    const [stored] = await db.session.toArray();
    expect(stored?.generation.steps).toHaveLength(2);
  });
});

describe('US-AB-03 Repeat a step', () => {
  it('AK-1: warns that only this step is drawn again, then shows it without a result', async () => {
    const user = userEvent.setup();
    const { db } = await startMatch();
    await tapForward(user, 'Losen');

    await user.click(await screen.findByRole('button', { name: 'Wiederholen' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Landschaftsfelder wiederholen?')).toBeInTheDocument();
    expect(within(dialog).getByText('Nur dieser Schritt wird neu gelost')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Wiederholen' }));

    expect(await screen.findByText('Wer?')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    const [stored] = await db.session.toArray();
    expect(stored?.generation.steps).toHaveLength(0);
  });

  it('can be cancelled', async () => {
    const user = userEvent.setup();
    await startMatch();
    await tapForward(user, 'Losen');

    await user.click(await screen.findByRole('button', { name: 'Wiederholen' }));
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('US-PL-05 Skip the placement', () => {
  it('AK-1, AK-2: offered on the empty board, the match is complete without resources', async () => {
    const user = userEvent.setup();
    await startMatch({ personDraws: NO_DRAWS });
    expect(await screen.findByRole('heading', { name: 'Reihenfolge' })).toBeInTheDocument();

    // FA-LS-02: the last place follows by itself after the third spin.
    for (let spin = 0; spin < 3; spin++) {
      await tapForward(user, 'Losen');
    }
    expect(
      screen.queryByRole('button', { name: 'Platzierung überspringen' }),
    ).not.toBeInTheDocument();
    await tapForward(user, 'Weiter');
    const skip = await screen.findByRole('button', { name: 'Platzierung überspringen' });
    await waitFor(() => {
      expect(skip).toBeEnabled();
    });
    await user.click(skip);
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Überspringen' }),
    );

    expect(await screen.findByRole('heading', { name: 'overview page' })).toBeInTheDocument();
  });
});

describe('US-AB-06 End a match without a result', () => {
  it('AK-1: asks first, then discards the match and leads to the start', async () => {
    const user = userEvent.setup();
    const { db } = await startMatch();
    await screen.findByText('Landschaftsfelder');

    await user.click(screen.getByRole('button', { name: 'Partie beenden ohne Ergebnis' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Beenden' }),
    );

    expect(await screen.findByRole('heading', { name: 'start page' })).toBeInTheDocument();
    expect(await db.session.count()).toBe(0);
  });
});

describe('US-PL-04 Buildings and roads on the board', () => {
  it('AK-1: the empty board names the first piece; each drawn piece announces the next (N1)', async () => {
    const user = userEvent.setup();
    await startMatch({ personDraws: NO_DRAWS });
    await screen.findByRole('heading', { name: 'Reihenfolge' });
    for (let spin = 0; spin < 3; spin++) {
      await tapForward(user, 'Losen');
    }
    await tapForward(user, 'Weiter');

    expect(await screen.findByRole('heading', { name: 'Platzierung' })).toBeInTheDocument();
    expect(progress()).toContain('Platzierung 1/16');
    expect(screen.queryAllByTestId('board-settlement')).toHaveLength(0);
    expect(screen.getByText('· Siedlung')).toBeInTheDocument();
    expect(screen.queryByText('Als Nächstes')).not.toBeInTheDocument();

    await tapForward(user, 'Losen');

    expect(screen.getAllByTestId('board-settlement')).toHaveLength(1);
    expect(screen.getByText('Als Nächstes')).toBeInTheDocument();
    expect(screen.getByText('· Straße')).toBeInTheDocument();
    await tapForward(user, 'Losen');
    expect(screen.getAllByTestId('board-road')).toHaveLength(1);
  });
});

describe('Architecture 13.2 match from the database', () => {
  it('leads to the start without a match', async () => {
    renderWithApp(null, { path: '/partie', routes: ROUTES });

    expect(await screen.findByRole('heading', { name: 'start page' })).toBeInTheDocument();
  });

  it('leads to the overview once the match runs', async () => {
    await startMatch({ personDraws: NO_DRAWS, order: { mode: 'none' } });

    expect(await screen.findByRole('heading', { name: 'overview page' })).toBeInTheDocument();
  });

  it('Architecture 10.3: a match of an unknown version shows a message and can be ended', async () => {
    const user = userEvent.setup();
    const { db, router } = renderWithApp(null, { routes: ROUTES });
    await db.session.put({ ...aStoredSession(), schemaVersion: 99 });
    await act(() => router.navigate('/partie'));

    expect(
      await screen.findByText(/stammt aus einer anderen Version von BoardBrain/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Partie beenden ohne Ergebnis' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Beenden' }),
    );

    expect(await screen.findByRole('heading', { name: 'start page' })).toBeInTheDocument();
    expect(await db.session.count()).toBe(0);
  });
});

// Texts as shown: "Antippen" and the name of a resource lie on top of each other, as do "Wer?"
// and the name drawn; the one hidden is marked on itself or on a parent.
function shownTexts(text: string): HTMLElement[] {
  return screen
    .queryAllByText(text)
    .filter((element) => element.closest('[aria-hidden="true"]') === null);
}
