import { useRef } from 'react';
import { t, type TextKey } from '@/i18n/t';
import { StatsSheet } from './StatsSheet';
import styles from './StatsInfoSheet.module.css';

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
 * "Rangliste"; closes like every sheet of the statistics, also by swiping it down.
 */
export function StatsInfoSheet({ onClose }: { readonly onClose: () => void }): React.JSX.Element {
  const sheetRef = useRef<HTMLDivElement>(null);
  return (
    <StatsSheet title={t('statistik.info.titel')} sheetRef={sheetRef} onClose={onClose}>
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
    </StatsSheet>
  );
}
