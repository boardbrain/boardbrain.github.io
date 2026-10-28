// Text fields keep their menu, e.g. to paste a name.
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/**
 * K-4: a long press with a finger or pen opens no browser menu ("open in new tab", Android) and
 * selects nothing; the app answers with its own pressed state instead. A right click with the
 * mouse and the menu in text fields stay. Returns a function that removes the listeners.
 */
export function suppressTouchContextMenu(target: Document): () => void {
  let lastPointerType = 'mouse';

  function rememberPointer(event: PointerEvent): void {
    lastPointerType = event.pointerType;
  }

  function preventMenu(event: MouseEvent): void {
    if (lastPointerType === 'mouse') return;
    if (event.target instanceof Element && event.target.closest(EDITABLE) !== null) return;
    event.preventDefault();
  }

  target.addEventListener('pointerdown', rememberPointer, true);
  target.addEventListener('contextmenu', preventMenu);
  return () => {
    target.removeEventListener('pointerdown', rememberPointer, true);
    target.removeEventListener('contextmenu', preventMenu);
  };
}
