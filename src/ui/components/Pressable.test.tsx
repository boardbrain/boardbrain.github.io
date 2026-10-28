import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { domAnimation, LazyMotion } from 'motion/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { PressableButton, PressableLink } from './Pressable';

function renderInRouter(element: React.JSX.Element): void {
  const router = createMemoryRouter([
    { path: '/', element: <LazyMotion features={domAnimation}>{element}</LazyMotion> },
    { path: '/ziel', element: <h1>target page</h1> },
  ]);
  render(<RouterProvider router={router} />);
}

describe('K-4 Buttons and links with their own pressed state', () => {
  it('a button keeps its role, name and click handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderInRouter(
      <PressableButton type="button" onClick={onClick}>
        save
      </PressableButton>,
    );

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('a disabled button stays disabled and does not react', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderInRouter(
      <PressableButton type="button" disabled onClick={onClick}>
        save
      </PressableButton>,
    );

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('a button passes on its own class and attributes', () => {
    renderInRouter(
      <PressableButton type="submit" className="own" aria-pressed={true}>
        save
      </PressableButton>,
    );

    const button = screen.getByRole('button', { name: 'save' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveClass('own');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('a link as a card leads to its page', async () => {
    const user = userEvent.setup();
    renderInRouter(
      <PressableLink look="card" to="/ziel" className="own" aria-label="to the target">
        card
      </PressableLink>,
    );

    const link = screen.getByRole('link', { name: 'to the target' });
    expect(link).toHaveClass('own');
    expect(link).toHaveAttribute('draggable', 'false');
    await user.click(link);

    expect(screen.getByRole('heading', { name: 'target page' })).toBeInTheDocument();
  });
});
