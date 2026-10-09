import { useId } from 'react';
import { t } from '@/i18n/t';
import { PlayingCard } from '@/ui/components/PlayingCard';
import { useAreaCards } from '@/ui/views/areaCards';
import styles from './StartView.module.css';

const FAN_POSITIONS = [styles.left, styles.middle, styles.right];

/**
 * Start view `#/` (Architecture 13.1, design D-3): persons, tables and games as a fan of
 * playing cards right above the card hand; the view never scrolls. "New match" (I2) and the
 * banners (I4, I2) get their place above the cards later.
 */
export function StartView(): React.JSX.Element {
  const cards = useAreaCards();
  const headingId = useId();
  return (
    <main className={styles.start}>
      <h1 className={styles.hiddenTitle}>{t('start.titel')}</h1>
      {/* Place for the banners (reminder I4, update I4, running match I2) at the top; they must
          not push the cards down while there is room. Look and sizes:
          docs/design/d3-start-navigation-final-preview.html, scope "Mit späteren Funktionen". */}
      <div className={styles.spacer} />
      {/* Place for "new match" (I2) as a draw pile right above the cards, together with them in
          one column with a 14px gap (same reference). */}
      <nav className={styles.cards} aria-labelledby={headingId}>
        <h2 id={headingId} className={styles.heading}>
          {t('karten.titel')}
        </h2>
        <div className={styles.fan}>
          {cards?.map((card, index) => (
            <PlayingCard
              key={card.key}
              to={card.to}
              title={card.title}
              count={card.count}
              icon={card.icon}
              note={
                card.key === 'personen' && card.count === 0 ? t('karten.hierAnfangen') : undefined
              }
              className={FAN_POSITIONS[index]}
            />
          ))}
        </div>
      </nav>
      <div className={styles.spacerLow} />
    </main>
  );
}
