import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { t } from '@/i18n/t';
import { ConfirmDialog } from './ConfirmDialog';

type UnsavedChangesGuardProps = {
  /** True while there are changes that are not saved. */
  readonly isDirty: boolean;
  /** What is not saved, e.g. "Der neue Name „Zoe“ ist noch nicht gespeichert." */
  readonly text: string;
};

/**
 * Asks "Änderungen verwerfen?" before leaving with unsaved changes: back button, the Android
 * back key and the card hand (design I1-F, decision of the PO). Needs a data router.
 */
export function UnsavedChangesGuard({
  isDirty,
  text,
}: UnsavedChangesGuardProps): React.JSX.Element | null {
  const blocker = useBlocker(isDirty);

  // The router holds a blocked navigation (external system). Once nothing is unsaved any more,
  // e.g. right after saving, it may go through without asking.
  useEffect(() => {
    if (blocker.state === 'blocked' && !isDirty) {
      blocker.proceed();
    }
  }, [blocker, isDirty]);

  if (blocker.state !== 'blocked' || !isDirty) {
    return null;
  }
  return (
    <ConfirmDialog
      title={t('verwerfen.titel')}
      text={text}
      cancelLabel={t('verwerfen.weiter')}
      confirmLabel={t('verwerfen.verwerfen')}
      onCancel={() => {
        blocker.reset();
      }}
      onConfirm={() => {
        blocker.proceed();
      }}
    />
  );
}
