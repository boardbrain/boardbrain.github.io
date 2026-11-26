import { m } from 'motion/react';
import { useEffect } from 'react';
import { t, type TextKey } from '@/i18n/t';
import { PressableButton } from '@/ui/components/Pressable';
import sheet from './PeriodSheet.module.css';
import styles from './StatsInfoSheet.module.css';

const ENTER = { type: 'spring', bounce: 0.15, duration: 0.4 } as const;

// The topics of the explanation in the order of the page: a title and its paragraphs.
const TOPICS: readonly (readonly [TextKey, readonly TextKey[]])[] = [
  ['statistik.info.partienTitel', ['statistik.info.partien']],
  ['statistik.info.siegTitel', ['statistik.info.sieg']],
  ['statistik.info.quoteTitel', ['statistik.info.quote']],
  ['statistik.info.serieTitel', ['statistik.info.serie']],
  ['statistik.info.durstTitel', ['statistik.info.durst']],
  ['statistik.info.formTitel', ['statistik.info.form']],
  ['statistik.info.platzTitel', ['statistik.info.platz', 'statistik.info.letzter']],
  ['statistik.info.punkteTitel', ['statistik.info.punkte']],
  ['statistik.info.ranglisteTitel', ['statistik.info.rangliste']],
  ['statistik.info.paradeTitel', ['statistik.info.parade']],
  [
    'statistik.info.rekordeTitel',
    [
      'statistik.info.rekordeSerie',
      'statistik.info.rekordeDauer',
      'statistik.info.rekordeBestwert',
    ],
  ],
  ['statistik.info.zeitraumTitel', ['statistik.info.zeitraum']],
];

/**
 * How the statistics count, as a sheet from below (design I3-D, wish of the PO 26.11.2026): one
 * short section per figure, so nobody misreads a value. Opened by the small info symbol beside
 * "Rangliste"; closes with the grip, a tap beside it or Escape.
 */
export function StatsInfoSheet({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
  // Escape closes the sheet; the keyboard is an external system, hence the effect.
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
    <div
      className={sheet.back}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <m.div
        className={sheet.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={t('statistik.info.titel')}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={ENTER}
      >
        <PressableButton
          type="button"
          className={sheet.grip}
          aria-label={t('partie.schliessen')}
          onClick={onClose}
        />
        <h2 className={sheet.title}>{t('statistik.info.titel')}</h2>
        {TOPICS.map(([title, paragraphs]) => (
          <section key={title} className={styles.topic}>
            <h3 className={styles.topicTitle}>{t(title)}</h3>
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className={styles.text}>
                {t(paragraph)}
              </p>
            ))}
          </section>
        ))}
      </m.div>
    </div>
  );
}
