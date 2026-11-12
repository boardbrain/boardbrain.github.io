import { useId, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { cx } from '@/ui/components/classNames';
import { PressableButton } from '@/ui/components/Pressable';
import { dialogPlace } from './dialogPlace';
import shared from './Match.module.css';
import styles from './MatchDialog.module.css';

/**
 * A question about pieces on the board (design I2-H, R7): the marked pieces stay bright over the
 * dark, and the window gives way to them.
 */
export type DialogFocus = {
  /** The area the board is drawn in. */
  readonly target: RefObject<HTMLElement | null>;
  /** The marked pieces alone, drawn over the same area (`BoardSpotlight`). */
  readonly spot: ReactNode;
};

type MatchDialogProps = {
  readonly title?: string;
  /** Short lines below the title, as keywords (design I2-C). */
  readonly lines?: readonly string[];
  /** Own content instead of title and lines, e.g. the details of a table. */
  readonly children?: ReactNode;
  readonly cancelLabel: string;
  readonly onCancel: () => void;
  /** The cancel button is the destructive choice, in red; the confirm button gets the focus. */
  readonly isCancelDanger?: boolean;
  /** A tap beside the window; without it, it cancels. */
  readonly onDismiss?: () => void;
  /** Without a confirm button the dialog only informs. */
  readonly confirmLabel?: string;
  readonly isDanger?: boolean;
  readonly onConfirm?: () => void;
  readonly focus?: DialogFocus | null | undefined;
};

/**
 * Question or information in a small window above everything (design I2-C), e.g. before
 * repeating a step or ending the match. A tap beside the window closes it.
 */
export function MatchDialog({
  title,
  lines = [],
  children,
  cancelLabel,
  onCancel,
  isCancelDanger = false,
  onDismiss = onCancel,
  confirmLabel,
  isDanger = false,
  onConfirm,
  focus,
}: MatchDialogProps): React.JSX.Element {
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const target = focus?.target;
  // R7: lays the marked pieces exactly over the board and moves the window where it covers the
  // fewest of them. Measured before painting and again whenever the screen or board changes.
  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    const spot = spotRef.current;
    const box = windowRef.current;
    const board = target?.current;
    if (
      backdrop === null ||
      spot === null ||
      box === null ||
      board === undefined ||
      board === null
    ) {
      return undefined;
    }
    const place = (): void => {
      const frame = backdrop.getBoundingClientRect();
      const area = board.getBoundingClientRect();
      spot.style.left = `${String(area.left - frame.left)}px`;
      spot.style.top = `${String(area.top - frame.top)}px`;
      spot.style.width = `${String(area.width)}px`;
      spot.style.height = `${String(area.height)}px`;
      const marks = [...spot.querySelectorAll('[data-piece]')].map((piece) => {
        const rect = piece.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - frame.left,
          y: rect.top + rect.height / 2 - frame.top,
        };
      });
      const size = box.getBoundingClientRect();
      backdrop.dataset.place = dialogPlace(frame, size, marks);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(backdrop);
    observer.observe(board);
    return () => {
      observer.disconnect();
    };
  }, [target]);
  return (
    <div
      ref={backdropRef}
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onDismiss();
        }
      }}
    >
      {focus !== undefined && focus !== null && (
        <div ref={spotRef} className={styles.spot}>
          {focus.spot}
        </div>
      )}
      <div
        ref={windowRef}
        className={styles.dialog}
        role={confirmLabel === undefined ? 'dialog' : 'alertdialog'}
        aria-modal="true"
        aria-labelledby={title === undefined ? undefined : titleId}
      >
        {title !== undefined && (
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        )}
        {lines.length > 0 && (
          <div className={styles.lines}>
            {lines.map((line) => (
              <p key={line} className={styles.line}>
                {line}
              </p>
            ))}
          </div>
        )}
        {children}
        <div className={styles.buttons}>
          <PressableButton
            type="button"
            className={cx(shared.secondary, isCancelDanger && shared.dangerText)}
            autoFocus={!isCancelDanger}
            onClick={onCancel}
          >
            {cancelLabel}
          </PressableButton>
          {confirmLabel !== undefined && (
            <PressableButton
              type="button"
              className={cx(shared.primary, isDanger && shared.danger)}
              autoFocus={isCancelDanger}
              onClick={onConfirm}
            >
              {confirmLabel}
            </PressableButton>
          )}
        </div>
      </div>
    </div>
  );
}
