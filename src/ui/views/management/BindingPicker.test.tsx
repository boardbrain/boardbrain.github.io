import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { toGameId, type GameId } from '@/core/model';
import { BindingPicker, type BindingOption } from './BindingPicker';

const CATAN: BindingOption = {
  gameId: toGameId('00000000-0000-4000-8000-0000000000d1'),
  label: 'Catan',
  maxMembers: 4,
};

function ownGames(...names: string[]): BindingOption[] {
  return names.map((name, index) => ({
    gameId: toGameId(`00000000-0000-4000-8000-0000000000e${String(index)}`),
    label: name,
    maxMembers: 12,
  }));
}

function Picker({
  custom,
  memberCount = 3,
}: {
  readonly custom: readonly BindingOption[];
  readonly memberCount?: number;
}): React.JSX.Element {
  const [choice, setChoice] = useState<GameId | null>(null);
  return (
    <BindingPicker
      supported={[CATAN]}
      custom={custom}
      choice={choice}
      memberCount={memberCount}
      onChoose={setChoice}
    />
  );
}

describe('US-PG-02 AK-4 Choosing what the group plays', () => {
  it('shows only "all games" and Catan without own games', () => {
    render(<Picker custom={[]} />);

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Alle Spiele',
      'Nur Catan',
    ]);
  });

  it('folds out the own games; the chosen one takes the place of "Anderes Spiel"', async () => {
    const user = userEvent.setup();
    render(<Picker custom={ownGames('Uno', 'Skat')} />);
    expect(screen.queryByRole('group', { name: 'Eigene Spiele' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Anderes Spiel ▾' }));
    await user.click(screen.getByRole('button', { name: 'Nur Skat' }));

    expect(screen.queryByRole('group', { name: 'Eigene Spiele' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nur Skat ▾' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Alle Spiele' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('has no search field with up to five own games', async () => {
    const user = userEvent.setup();
    render(<Picker custom={ownGames('Uno', 'Skat', 'Wizard', 'Kniffel', 'Doppelkopf')} />);

    await user.click(screen.getByRole('button', { name: 'Anderes Spiel ▾' }));

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('offers a search field from six own games', async () => {
    const user = userEvent.setup();
    render(
      <Picker custom={ownGames('Uno', 'Skat', 'Wizard', 'Kniffel', 'Doppelkopf', 'Ligretto')} />,
    );
    await user.click(screen.getByRole('button', { name: 'Anderes Spiel ▾' }));

    await user.type(screen.getByRole('searchbox', { name: 'Spiel suchen' }), 'kopf');

    expect(screen.getByRole('button', { name: 'Nur Doppelkopf' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nur Ligretto' })).not.toBeInTheDocument();
  });

  it('says so when the search finds no game', async () => {
    const user = userEvent.setup();
    render(
      <Picker custom={ownGames('Uno', 'Skat', 'Wizard', 'Kniffel', 'Doppelkopf', 'Ligretto')} />,
    );
    await user.click(screen.getByRole('button', { name: 'Anderes Spiel ▾' }));

    await user.type(screen.getByRole('searchbox', { name: 'Spiel suchen' }), 'xyz');

    expect(screen.getByText('Kein Spiel gefunden.')).toBeInTheDocument();
  });

  it('blocks Catan with the reason from five members', () => {
    render(<Picker custom={[]} memberCount={5} />);

    expect(screen.getByRole('button', { name: 'Nur Catan' })).toBeDisabled();
    expect(
      screen.getByText('Catan geht nur mit höchstens 4 Personen. Dieser Tisch hat 5.'),
    ).toBeInTheDocument();
  });
});

describe('Search field of the own games and the keyboard', () => {
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  const sixGames = ownGames('Uno', 'Skat', 'Wizard', 'Kniffel', 'Doppelkopf', 'Ligretto');

  afterEach(() => {
    if (originalMatchMedia !== undefined) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    }
  });

  it('is not focused on touch screens, so no keyboard pops up unasked', async () => {
    const user = userEvent.setup();
    render(<Picker custom={sixGames} />);

    await user.click(screen.getByRole('button', { name: 'Anderes Spiel ▾' }));

    expect(screen.getByRole('searchbox', { name: 'Spiel suchen' })).not.toHaveFocus();
  });

  it('is focused right away with a mouse', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query === '(pointer: fine)',
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
    const user = userEvent.setup();
    render(<Picker custom={sixGames} />);

    await user.click(screen.getByRole('button', { name: 'Anderes Spiel ▾' }));

    expect(screen.getByRole('searchbox', { name: 'Spiel suchen' })).toHaveFocus();
  });
});
