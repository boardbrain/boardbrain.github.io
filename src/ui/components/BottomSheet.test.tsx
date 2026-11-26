import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet';

function renderSheet(): { onClose: () => void } {
  const onClose = vi.fn<() => void>();
  render(
    <BottomSheet label="Zeitraum" title="Zeitraum" onClose={onClose}>
      <p>Inhalt</p>
    </BottomSheet>,
  );
  return { onClose };
}

function swipe(element: HTMLElement, from: number, to: number): void {
  fireEvent.touchStart(element, { touches: [{ clientY: from }] });
  fireEvent.touchMove(element, { touches: [{ clientY: to }] });
  fireEvent.touchEnd(element, { touches: [] });
}

describe('Bottom sheet (statistics I3-D, score pad I3-C2, PO 26.11.2026)', () => {
  it('is a dialog with its title and content', () => {
    renderSheet();

    const sheet = screen.getByRole('dialog', { name: 'Zeitraum' });
    expect(sheet).toHaveTextContent('Inhalt');
    expect(screen.getByRole('heading', { name: 'Zeitraum' })).toBeInTheDocument();
  });

  it('closes with the grip', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSheet();

    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('closes with Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSheet();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('closes when swiped down at the top, not while its content is scrolled', async () => {
    const { onClose } = renderSheet();
    const sheet = screen.getByRole('dialog', { name: 'Zeitraum' });

    sheet.scrollTop = 50;
    swipe(sheet, 100, 400);
    expect(onClose).not.toHaveBeenCalled();

    sheet.scrollTop = 0;
    swipe(sheet, 100, 400);
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('springs back after a short pull', () => {
    const { onClose } = renderSheet();

    swipe(screen.getByRole('dialog', { name: 'Zeitraum' }), 100, 130);
    expect(onClose).not.toHaveBeenCalled();
  });
});
