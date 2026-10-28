import { useId } from 'react';
import styles from './ConfirmDialog.module.css';
import { PressableButton } from './Pressable';

type ConfirmDialogProps = {
  readonly title: string;
  readonly text: string;
  /** Label of the button that keeps everything as it is. */
  readonly cancelLabel: string;
  /** Label of the button that carries out the action. */
  readonly confirmLabel: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/**
 * Question that must be answered before going on, e.g. "Änderungen verwerfen?" (design I1-F).
 * The cancel button gets the focus, so a quick Enter keeps the changes.
 */
export function ConfirmDialog({
  title,
  text,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps): React.JSX.Element {
  const titleId = useId();
  const textId = useId();
  return (
    <div className={styles.backdrop}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={textId} className={styles.text}>
          {text}
        </p>
        <div className={styles.buttons}>
          <PressableButton type="button" className={styles.cancel} autoFocus onClick={onCancel}>
            {cancelLabel}
          </PressableButton>
          <PressableButton type="button" onClick={onConfirm}>
            {confirmLabel}
          </PressableButton>
        </div>
      </div>
    </div>
  );
}
