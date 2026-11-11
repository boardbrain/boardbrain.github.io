import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorScreen, type ReloadableLocation } from './ErrorScreen';

type FakeLocation = ReloadableLocation & { readonly reloads: string[] };

function fakeLocation(hash: string): FakeLocation {
  const reloads: string[] = [];
  return {
    hash,
    reloads,
    reload: () => {
      reloads.push(hash);
    },
    reloadAt: (target) => {
      reloads.push(target);
    },
  };
}

// jsdom has no clipboard; the tests put their own in place.
function stubClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

describe('K-5 error screen', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('shows the table flip as heading, read out as words, and a short text', () => {
    render(<ErrorScreen error={new Error('test error')} location={fakeLocation('#/partie')} />);

    const heading = screen.getByRole('heading', { name: 'Etwas ist schiefgelaufen' });
    expect(heading).toHaveTextContent('(╯°□°)╯︵ ┻━┻');
    expect(
      screen.getByText('Unerwarteter Fehler · gespeicherte Daten bleiben erhalten'),
    ).toBeInTheDocument();
  });

  it('reloads the current address with "Neu laden"', async () => {
    const location = fakeLocation('#/partie');
    render(<ErrorScreen error={new Error('test error')} location={location} />);

    await userEvent.click(screen.getByRole('button', { name: 'Neu laden' }));

    expect(location.reloads).toEqual(['#/partie']);
  });

  it('reloads the app on the start view with "Zum Start"', async () => {
    const location = fakeLocation('#/partie');
    render(<ErrorScreen error={new Error('test error')} location={location} />);

    await userEvent.click(screen.getByRole('button', { name: 'Zum Start' }));

    expect(location.reloads).toEqual(['#/']);
  });

  it('shows the technical details with address and version only when opened', async () => {
    render(<ErrorScreen error={new Error('test error')} location={fakeLocation('#/partie')} />);
    const toggle = screen.getByRole('button', { name: 'Technische Details' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Error: test error/)).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const details = screen.getByText(/Error: test error/);
    expect(details).toHaveTextContent('Adresse: #/partie');
    expect(details).toHaveTextContent(`Version: ${__APP_VERSION__}`);
  });

  it('names the error once, whether or not the stack starts with it', async () => {
    const error = new Error('test error');
    error.stack = 'Error: test error\n    at view.tsx:1';
    render(<ErrorScreen error={error} location={fakeLocation('#/')} />);

    await userEvent.click(screen.getByRole('button', { name: 'Technische Details' }));

    const details = screen.getByText(/at view\.tsx:1/).textContent;
    expect(details.match(/Error: test error/g)).toHaveLength(1);
  });

  it('describes errors that are no Error objects', async () => {
    render(<ErrorScreen error={{ code: 42 }} location={fakeLocation('')} />);

    await userEvent.click(screen.getByRole('button', { name: 'Technische Details' }));

    const details = screen.getByText(/"code":42/);
    expect(details).toHaveTextContent('Adresse: #/');
  });

  it('copies the details and confirms it for two seconds', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    stubClipboard(writeText);
    render(<ErrorScreen error="plain text error" location={fakeLocation('#/diagnose')} />);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    // userEvent waits with setTimeout itself; a plain click keeps the fake timers in control.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Details kopieren' }));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('plain text error'));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Adresse: #/diagnose'));
    expect(screen.getByRole('button', { name: 'Kopiert' })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Details kopieren' })).toBeInTheDocument();
  });

  it('opens the details when copying is not possible', async () => {
    stubClipboard(() => Promise.reject(new Error('denied')));
    render(<ErrorScreen error={new Error('test error')} location={fakeLocation('#/')} />);

    await userEvent.click(screen.getByRole('button', { name: 'Details kopieren' }));

    expect(screen.getByRole('button', { name: 'Technische Details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText(/Error: test error/)).toBeInTheDocument();
  });
});
