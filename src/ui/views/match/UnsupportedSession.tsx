import { useState, useTransition } from 'react';
import { useNavigate } from 'react-router';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { ExitDoorIcon } from '@/ui/components/Icons';
import { Notice } from '@/ui/components/Notice';
import { PressableButton } from '@/ui/components/Pressable';
import { EndMatchDialog } from './EndMatchDialog';
import shared from './Match.module.css';

/**
 * A stored match of a version this app does not know (Architecture 10.3): a message instead of
 * a crash, and the offer to end it.
 */
export function UnsupportedSession(): React.JSX.Element {
  const { session } = useAppDependencies();
  const navigate = useNavigate();
  const [isAsking, setAsking] = useState(false);
  const [, startTransition] = useTransition();
  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('partie.laufendePartie')}</h1>
        </div>
      </div>
      <Notice tone="warning">{t('partie.unbekannteVersion')}</Notice>
      <div>
        <PressableButton
          type="button"
          className={shared.pill}
          onClick={() => {
            setAsking(true);
          }}
        >
          <ExitDoorIcon size={14} />
          {t('partie.beenden')}
        </PressableButton>
      </div>
      {isAsking && (
        <EndMatchDialog
          onCancel={() => {
            setAsking(false);
          }}
          onEnd={() => {
            setAsking(false);
            startTransition(async () => {
              await session.endWithoutResult();
              await navigate('/', { replace: true });
            });
          }}
        />
      )}
    </main>
  );
}
