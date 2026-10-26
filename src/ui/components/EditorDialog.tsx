import { useEffect, type ReactNode } from 'react';
import { t } from '@/i18n/t';
import { BackIcon, CloseIcon } from './Icons';
import styles from './EditorDialog.module.css';

type EditorDialogProps = {
  readonly title: string;
  /** Called by the close button and the Escape key. */
  readonly onClose: () => void;
  readonly children: ReactNode;
};

/**
 * Frame of the table editor (design I1-C, I1-F): on phones a page of its own with a back arrow,
 * on tablets and computers a window with a close cross.
 */
export function EditorDialog({ title, onClose, children }: EditorDialogProps): React.JSX.Element {
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
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.dialogHeader}>
          <button
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
          </button>
          <h2 className={styles.dialogTitle}>{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
