import { t } from '@/i18n/t';
import { BackIcon } from './Icons';
import styles from './BackButton.module.css';
import { useGoBack } from './useGoBack';

type BackButtonProps = {
  /** Destination when the page was opened directly, e.g. via a saved address. */
  readonly fallback: string;
};

/**
 * Goes back to where the person came from, like the back key on Android (design D-3):
 * start → persons → back leads to the start view. Without a previous page it leads to the
 * fallback.
 */
export function BackButton({ fallback }: BackButtonProps): React.JSX.Element {
  const goBack = useGoBack(fallback);
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={t('allgemein.zurueck')}
      onClick={goBack}
    >
      <BackIcon />
    </button>
  );
}
