import { animate, m, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useEffectEvent, useRef, type ReactNode, type RefObject } from 'react';
import { t } from '@/i18n/t';
import { PressableButton } from '@/ui/components/Pressable';
import styles from './StatsSheet.module.css';

const ENTER = { type: 'spring', bounce: 0.15, duration: 0.4 } as const;
const LEAVE = { duration: 0.22, ease: [0.4, 0, 1, 1] } as const;
const SNAP_BACK = { type: 'spring', bounce: 0.2, duration: 0.35 } as const;
// As the clock sheet of the match (ClockSheet): dragged down this far, or quicker over a shorter
// way, the sheet goes (pixels, pixels per millisecond).
const CLOSE_DISTANCE = 90;
const FLICK_DISTANCE = 40;
const FLICK_SPEED = 0.6;
/** Movement of the mouse on the grip before it counts as dragging instead of a tap. */
const DRAG_START_PX = 6;

type Drag = { base: number; lastY: number; lastTime: number; speed: number };

/**
 * A sheet from below for the statistics (design I3-D): it rises in, and goes with a tap on the
 * grip or beside it, with Escape, or when it is swiped down by the grip or by its content while
 * the content is scrolled to the top (wish of the PO 26.11.2026). The finger moves a Motion value,
 * never React state per frame (Architecture 13.6); Motion's own dragging would need `domMax`.
 */
export function StatsSheet({
  title,
  sheetRef,
  onClose,
  children,
}: {
  readonly title: string;
  readonly sheetRef: RefObject<HTMLDivElement | null>;
  readonly onClose: () => void;
  readonly children: ReactNode;
}): React.JSX.Element {
  const isReduced = useReducedMotion() === true;
  const y = useMotionValue<number | string>('100%');
  const shade = useTransform(y, (value) => {
    const height = sheetRef.current?.offsetHeight ?? 0;
    const offset = typeof value === 'number' ? value : height;
    return height > 0 ? 1 - Math.min(1, Math.max(0, offset) / height) : 1;
  });
  const isClosing = useRef(false);
  const hasDragged = useRef(false);

  const close = (): void => {
    const sheet = sheetRef.current;
    if (isClosing.current) {
      return;
    }
    isClosing.current = true;
    if (isReduced || sheet === null) {
      onClose();
      return;
    }
    void animate(y, sheet.offsetHeight, LEAVE).then(onClose);
  };
  // Where a drag ends: far or fast enough closes, else the sheet springs back.
  const release = (drag: Drag): void => {
    const offset = y.get();
    const isFar = typeof offset === 'number' && offset > CLOSE_DISTANCE;
    const isFlick =
      typeof offset === 'number' && offset >= FLICK_DISTANCE && drag.speed > FLICK_SPEED;
    if (isFar || isFlick) {
      close();
    } else if (isReduced) {
      y.set(0);
    } else {
      void animate(y, 0, SNAP_BACK);
    }
  };
  const onEscape = useEffectEvent(close);
  const onRelease = useEffectEvent(release);

  // Escape closes the sheet; the keyboard is an external system, hence the effect.
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onEscape();
      }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  // Swiping down with a finger (external system: touch events). The listener must not be
  // passive, so that pulling down at the top moves the sheet instead of bouncing the page.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (sheet === null) {
      return;
    }
    let startY = 0;
    let isTracking = false;
    let drag: Drag | null = null;
    function onStart(event: TouchEvent): void {
      const touch = event.touches[0];
      isTracking = event.touches.length === 1 && touch !== undefined;
      startY = touch?.clientY ?? 0;
      drag = null;
    }
    function onMove(event: TouchEvent): void {
      const touch = event.touches[0];
      if (!isTracking || touch === undefined || sheet === null) {
        return;
      }
      const now = touch.clientY;
      if (drag === null) {
        // Down at the top pulls the sheet; anything else scrolls its content as usual.
        if (now > startY && sheet.scrollTop <= 0) {
          drag = { base: startY, lastY: now, lastTime: event.timeStamp, speed: 0 };
        } else {
          isTracking = now === startY;
          return;
        }
      }
      event.preventDefault();
      const elapsed = event.timeStamp - drag.lastTime;
      if (elapsed > 0) {
        drag.speed = (now - drag.lastY) / elapsed;
      }
      drag.lastY = now;
      drag.lastTime = event.timeStamp;
      y.set(Math.max(0, now - drag.base));
    }
    function onEnd(): void {
      if (drag !== null) {
        onRelease(drag);
      }
      drag = null;
      isTracking = false;
    }
    sheet.addEventListener('touchstart', onStart, { passive: true });
    sheet.addEventListener('touchmove', onMove, { passive: false });
    sheet.addEventListener('touchend', onEnd);
    sheet.addEventListener('touchcancel', onEnd);
    return () => {
      sheet.removeEventListener('touchstart', onStart);
      sheet.removeEventListener('touchmove', onMove);
      sheet.removeEventListener('touchend', onEnd);
      sheet.removeEventListener('touchcancel', onEnd);
    };
  }, [sheetRef, y]);

  // Dragging the grip with a mouse or a pen; fingers go through the touch events above.
  const gripDrag = useRef<(Drag & { startY: number }) | null>(null);
  return (
    <div className={styles.back}>
      <m.div className={styles.shade} style={{ opacity: shade }} onClick={close} />
      <m.div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ y }}
        animate={{ y: 0 }}
        transition={ENTER}
      >
        <PressableButton
          type="button"
          className={styles.grip}
          aria-label={t('partie.schliessen')}
          onPointerDown={(event) => {
            if (event.pointerType === 'touch') {
              return;
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            hasDragged.current = false;
            gripDrag.current = {
              startY: event.clientY,
              base: event.clientY,
              lastY: event.clientY,
              lastTime: event.timeStamp,
              speed: 0,
            };
          }}
          onPointerMove={(event) => {
            const drag = gripDrag.current;
            if (drag === null) {
              return;
            }
            if (!hasDragged.current && event.clientY - drag.startY < DRAG_START_PX) {
              return;
            }
            hasDragged.current = true;
            const elapsed = event.timeStamp - drag.lastTime;
            if (elapsed > 0) {
              drag.speed = (event.clientY - drag.lastY) / elapsed;
            }
            drag.lastY = event.clientY;
            drag.lastTime = event.timeStamp;
            y.set(Math.max(0, event.clientY - drag.base));
          }}
          onPointerUp={() => {
            const drag = gripDrag.current;
            gripDrag.current = null;
            if (drag !== null && hasDragged.current) {
              release(drag);
            }
          }}
          onClick={() => {
            // A drag of the grip ends without a tap.
            if (hasDragged.current) {
              hasDragged.current = false;
              return;
            }
            close();
          }}
        />
        <h2 className={styles.title}>{title}</h2>
        {children}
      </m.div>
    </div>
  );
}
