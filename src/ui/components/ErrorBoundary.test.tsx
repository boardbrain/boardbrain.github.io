import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function BrokenView(): React.JSX.Element {
  throw new Error('test error');
}

describe('Development Guidelines 7.2 error boundary', () => {
  beforeEach(() => {
    // React and the error boundary log the intentional error.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the view as long as no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>content</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('shows an understandable message with a reload button on error', () => {
    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Etwas ist schiefgelaufen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neu laden' })).toBeInTheDocument();
  });

  it('offers the technical details for copying', () => {
    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Error: test error/)).toBeInTheDocument();
  });
});
