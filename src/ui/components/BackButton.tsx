import { useLocation, useNavigate } from 'react-router';
import { t } from '@/i18n/t';
import { BackIcon } from './Icons';
import styles from './BackButton.module.css';

// React Router gives the first entry of a session this key; there is no page to go back to.
const FIRST_ENTRY = 'default';

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
  const navigate = useNavigate();
  const location = useLocation();

  function goBack(): void {
    if (location.key === FIRST_ENTRY) {
      void navigate(fallback, { replace: true });
      return;
    }
    void navigate(-1);
  }

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
