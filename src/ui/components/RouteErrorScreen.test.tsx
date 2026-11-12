import { render, screen } from '@testing-library/react';
import { createMemoryRouter, Outlet } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteErrorScreen } from './RouteErrorScreen';

function BrokenView(): React.JSX.Element {
  throw new Error('broken view');
}

// The same shape as in main.tsx: the error view sits on the frame route.
function renderAt(path: string, onError?: (error: unknown) => void): void {
  const router = createMemoryRouter(
    [
      {
        element: (
          <div>
            <nav>frame</nav>
            <Outlet />
          </div>
        ),
        errorElement: <RouteErrorScreen onError={onError} />,
        children: [
          { path: '/', element: <p>start</p> },
          { path: '/kaputt', element: <BrokenView /> },
          {
            path: '/nachladen',
            lazy: () => Promise.reject(new Error('Failed to fetch dynamically imported module')),
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('K-5 error view of the routes', () => {
  beforeEach(() => {
    // React, React Router and the error view log the intentional errors.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the view as long as no error occurs', () => {
    renderAt('/');

    expect(screen.getByText('start')).toBeInTheDocument();
  });

  it('shows the own error screen on the whole screen when a view throws while drawing', async () => {
    renderAt('/kaputt');

    expect(
      await screen.findByRole('heading', { name: 'Etwas ist schiefgelaufen' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Unexpected Application Error!')).not.toBeInTheDocument();
    expect(screen.queryByText('frame')).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith('Unexpected error in a view', expect.any(Error));
  });

  it('K-9: passes the error on for the diagnostics', async () => {
    const onError = vi.fn();
    renderAt('/kaputt', onError);

    await screen.findByRole('heading', { name: 'Etwas ist schiefgelaufen' });

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'broken view' }));
  });

  it('shows the own error screen when a view cannot be loaded', async () => {
    renderAt('/nachladen');

    expect(
      await screen.findByRole('heading', { name: 'Etwas ist schiefgelaufen' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Unexpected Application Error!')).not.toBeInTheDocument();
  });
});
