import { describe, expect, it, vi } from 'vitest';
import { nudgeMissing } from './nudge';

function form(): { root: HTMLElement; first: HTMLElement; second: HTMLElement } {
  const root = document.createElement('form');
  const first = document.createElement('input');
  const second = document.createElement('div');
  const done = document.createElement('input');
  first.dataset.need = '';
  second.dataset.need = '';
  root.append(done, first, second);
  return { root, first, second };
}

describe('design I3-B E6 a greyed-out button shows what is missing (PO 25.11.2026)', () => {
  it('brings the first missing element into view, gliding', () => {
    const { root, first, second } = form();
    const scrollFirst = vi.spyOn(first, 'scrollIntoView');
    const scrollSecond = vi.spyOn(second, 'scrollIntoView');

    nudgeMissing(root);

    expect(scrollFirst).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
    expect(scrollSecond).not.toHaveBeenCalled();
  });

  it('jumps without gliding when the device asks for reduced motion', () => {
    const { root, first } = form();
    const scroll = vi.spyOn(first, 'scrollIntoView');

    nudgeMissing(root, true);

    expect(scroll).toHaveBeenCalledWith({ block: 'center', behavior: 'auto' });
  });

  it('does nothing without a form', () => {
    expect(() => {
      nudgeMissing(null);
    }).not.toThrow();
  });
});
