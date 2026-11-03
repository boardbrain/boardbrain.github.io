import { useRef } from 'react';

// Design I2-C, table choice: holding for 500 ms opens the details; moving more than 10 px
// scrolls instead.
const HOLD_MS = 500;
const MOVE_TOLERANCE_PX = 10;

/**
 * Event handlers of a control that answers a tap and a long press with a finger, pen or mouse.
 */
export type LongPressHandlers = {
  readonly onPointerDown: (event: React.PointerEvent) => void;
  readonly onPointerMove: (event: React.PointerEvent) => void;
  readonly onPointerUp: () => void;
  readonly onPointerLeave: () => void;
  readonly onPointerCancel: () => void;
  readonly onContextMenu: (event: React.MouseEvent) => void;
  readonly onClick: (event: React.MouseEvent) => void;
};

/**
 * Tap and long press on one control (design I2-C, a new pattern of the app): a tap calls
 * `onTap`, holding calls `onHold`, and the click that follows the hold is dropped. The browser
 * menu of a long press is suppressed.
 */
export function useLongPress(onHold: () => void, onTap: () => void): LongPressHandlers {
  const timer = useRef<number | null>(null);
  const held = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  const cancel = (): void => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return {
    onPointerDown: (event) => {
      held.current = false;
      start.current = { x: event.clientX, y: event.clientY };
      cancel();
      timer.current = window.setTimeout(() => {
        held.current = true;
        timer.current = null;
        onHold();
      }, HOLD_MS);
    },
    onPointerMove: (event) => {
      const moved = Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y);
      if (moved > MOVE_TOLERANCE_PX) {
        cancel();
      }
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (event) => {
      event.preventDefault();
    },
    onClick: (event) => {
      if (held.current) {
        held.current = false;
        event.preventDefault();
        return;
      }
      onTap();
    },
  };
}
