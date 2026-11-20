import { useEffect, type ReactNode } from 'react';
import { t } from '@/i18n/t';
import { cx } from './classNames';
import { BackIcon, CloseIcon } from './Icons';
import styles from './EditorDialog.module.css';
import { PressableButton } from './Pressable';

type EditorDialogProps = {
  readonly title: string;
  /** Called by the close button and the Escape key. */
  readonly onClose: () => void;
  readonly children: ReactNode;
  /**
   * A short form such as a game (design I3-B): a narrow window, and on phones the save button at
   * the bottom of the page.
   */
  readonly isNarrow?: boolean;
};

/**
 * Frame of the table editor (design I1-C, I1-F): on phones a page of its own with a back arrow,
 * on tablets and computers a window with a close cross.
 */
export function EditorDialog({
  title,
  onClose,
  children,
  isNarrow = false,
}: EditorDialogProps): React.JSX.Element {
  // Escape closes the editor; the keyboard is an external system, hence the effect.
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop}>
      <div
        className={cx(styles.dialog, isNarrow && styles.narrow)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.dialogHeader}>
          <PressableButton
            type="button"
            className={styles.backButton}
            aria-label={t('gruppen.schliessen')}
            onClick={onClose}
          >
            <span className={styles.backIcon}>
              <BackIcon />
            </span>
            <span className={styles.closeIcon}>
              <CloseIcon />
            </span>
          </PressableButton>
          <h2 className={styles.dialogTitle}>{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
