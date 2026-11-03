import { t } from '@/i18n/t';
import { LandscapePicture } from '@/ui/art/Pictures';
import { BackButton } from '@/ui/components/BackButton';
import { PressableLink } from '@/ui/components/Pressable';
import { DevCard } from './DevCard';
import shared from './Match.module.css';
import styles from './GameChoiceView.module.css';

/**
 * Game choice `#/partie/neu` (US-SP-01, design I2-C page 1, K2): the supported games as cards;
 * in version 1 only Catan, custom games do not appear (AK-2).
 */
export function GameChoiceView(): React.JSX.Element {
  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton fallback="/" />
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('partie.neu')}</h1>
        </div>
      </div>
      <section className={shared.section}>
        <h2 className={shared.sectionTitle}>{t('partie.spielFrage')}</h2>
        <div className={styles.gameGrid}>
          <PressableLink
            to="/partie/neu/tisch"
            look="card"
            className={styles.gameLink}
            aria-label={t('spiele.namen.catan')}
          >
            <DevCard title={t('spiele.namen.catan')} art={<LandscapePicture />}>
              <strong className={styles.lead}>{t('partie.catanPersonen')}</strong>
              <span className={styles.note}>{t('partie.catanAufstellung')}</span>
            </DevCard>
          </PressableLink>
        </div>
      </section>
    </main>
  );
}
