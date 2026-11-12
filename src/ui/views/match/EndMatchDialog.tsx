import { t } from '@/i18n/t';
import { MatchDialog } from './MatchDialog';

/**
 * The question before "Partie beenden ohne Ergebnis" (US-AB-06 AK-3).
 */
export function EndMatchDialog({
  onCancel,
  onEnd,
}: {
  readonly onCancel: () => void;
  readonly onEnd: () => void;
}): React.JSX.Element {
  return (
    <MatchDialog
      title={t('partie.beendenFrage')}
      lines={[t('partie.beendenVerworfen'), t('partie.beendenKeinErgebnis')]}
      cancelLabel={t('allgemein.abbrechen')}
      confirmLabel={t('partie.beendenBestaetigen')}
      isDanger
      onCancel={onCancel}
      onConfirm={onEnd}
    />
  );
}
