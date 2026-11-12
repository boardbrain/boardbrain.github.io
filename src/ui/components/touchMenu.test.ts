import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { suppressTouchContextMenu } from './touchMenu';

function press(element: Element, pointerType: string): boolean {
  element.dispatchEvent(new PointerEvent('pointerdown', { pointerType, bubbles: true }));
  const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
  element.dispatchEvent(menu);
  return menu.defaultPrevented;
}

describe('K-4 No browser menu on a long press', () => {
  let remove: () => void;

  beforeEach(() => {
    document.body.replaceChildren();
    remove = suppressTouchContextMenu(document);
  });

  afterEach(() => {
    remove();
  });

  function append<K extends keyof HTMLElementTagNameMap>(tag: K): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    document.body.append(element);
    return element;
  }

  it('suppresses the menu after a finger on a link', () => {
    expect(press(append('a'), 'touch')).toBe(true);
  });

  it('suppresses the menu after a pen on a button', () => {
    expect(press(append('button'), 'pen')).toBe(true);
  });

  it('keeps the menu for a right click with the mouse', () => {
    expect(press(append('a'), 'mouse')).toBe(false);
  });

  it('keeps the menu in text fields, also inside an editable element', () => {
    expect(press(append('input'), 'touch')).toBe(false);
    expect(press(append('textarea'), 'touch')).toBe(false);
    const editable = append('div');
    editable.setAttribute('contenteditable', 'true');
    const inner = document.createElement('span');
    editable.append(inner);
    expect(press(inner, 'touch')).toBe(false);
  });

  it('keeps the menu without any pointer before, e.g. from the keyboard', () => {
    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    append('a').dispatchEvent(menu);
    expect(menu.defaultPrevented).toBe(false);
  });

  it('removes its listeners again', () => {
    remove();
    expect(press(append('a'), 'touch')).toBe(false);
    remove = suppressTouchContextMenu(document);
  });
});
