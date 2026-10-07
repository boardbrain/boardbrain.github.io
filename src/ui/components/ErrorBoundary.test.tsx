import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function BrokenView(): React.JSX.Element {
  throw new Error('Testfehler');
}

describe('Entwicklungsrichtlinien 7.2 Error Boundary', () => {
  beforeEach(() => {
    // React und die Error Boundary protokollieren den absichtlichen Fehler.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('zeigt die Ansicht, solange kein Fehler auftritt', () => {
    render(
      <ErrorBoundary>
        <p>Inhalt</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Inhalt')).toBeInTheDocument();
  });

  it('zeigt bei einem Fehler eine verständliche Meldung mit „Neu laden“', () => {
    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Etwas ist schiefgelaufen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neu laden' })).toBeInTheDocument();
  });

  it('bietet die technischen Details zum Kopieren an', () => {
    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Error: Testfehler/)).toBeInTheDocument();
  });
});
