import { useId, type ReactNode } from 'react';
import { cx } from '@/ui/components/classNames';
import { PressableButton } from '@/ui/components/Pressable';
import shared from './Match.module.css';
import styles from './MatchDialog.module.css';

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
}: MatchDialogProps): React.JSX.Element {
  const titleId = useId();
  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onDismiss();
        }
      }}
    >
      <div
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
