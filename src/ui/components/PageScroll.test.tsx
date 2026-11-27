import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigationType,
} from 'react-router';
import { describe, expect, it } from 'vitest';
import { usePageScroll } from './usePageScroll';

function Frame(): React.JSX.Element {
  const { pathname, key } = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  usePageScroll(ref, pathname, key, useNavigationType());
  return (
    <div ref={ref} role="region" aria-label="Ansicht">
      <Outlet />
    </div>
  );
}

function openFrame(): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      {
        element: <Frame />,
        children: [
          { path: '/partie', element: <h1>games</h1> },
          { path: '/partie/tisch', element: <h1>tables</h1> },
        ],
      },
    ],
    { initialEntries: ['/partie'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

function scrollTo(top: number): void {
  const view = screen.getByRole('region', { name: 'Ansicht' });
  view.scrollTop = top;
  fireEvent.scroll(view);
}

function scrolled(): number {
  return screen.getByRole('region', { name: 'Ansicht' }).scrollTop;
}

describe('PO 27.11.2026 every page starts at its top', () => {
  it('a new page starts at the top, back returns to the place it was left', async () => {
    const router = openFrame();
    scrollTo(600);

    await act(() => router.navigate('/partie/tisch'));
    expect(screen.getByRole('heading', { name: 'tables' })).toBeInTheDocument();
    expect(scrolled()).toBe(0);

    await act(() => router.navigate(-1));
    expect(screen.getByRole('heading', { name: 'games' })).toBeInTheDocument();
    expect(scrolled()).toBe(600);
  });

  it('a change of the address on the same page keeps the place', async () => {
    const router = openFrame();
    await act(() => router.navigate('/partie/tisch'));
    scrollTo(300);

    await act(() => router.navigate('/partie/tisch?reiter=statistik', { replace: true }));
    expect(scrolled()).toBe(300);
  });
});
