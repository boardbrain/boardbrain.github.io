import { Link } from 'react-router';
import { t } from '@/i18n/t';
import { PlayingCard } from '@/ui/components/PlayingCard';
import { useAreaCards } from '@/ui/views/areaCards';
import styles from './ManagementView.module.css';

/**
 * Overview of the management area `#/verwaltung` (Architecture 13.1, design D-3): persons,
 * tables and games as a grid of playing cards. The archive follows with its increment.
 */
export function ManagementView(): React.JSX.Element {
  const cards = useAreaCards();
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t('verwaltung.titel')}</h1>
      <nav aria-label={t('verwaltung.bereiche')}>
        <div className={styles.grid}>
          {/* The archive (I5) becomes a fourth card here, see
              docs/design/d3-start-navigation-final-preview.html. */}
          {cards?.map((card) => (
            <PlayingCard
              key={card.key}
              to={card.to}
              title={card.title}
              count={card.count}
              icon={card.icon}
              note={card.names.join(', ')}
            />
          ))}
        </div>
      </nav>
      {/* I1-D: installed apps have no address bar. Until the settings of I6 open the diagnostics
          after tapping the version ten times, this link sits in the bottom padding and moves
          nothing. */}
      <Link to="/diagnose" className={styles.diagnostics}>
        {t('verwaltung.diagnose')}
      </Link>
    </main>
  );
}
