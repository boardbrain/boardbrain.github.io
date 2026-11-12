import { useId } from 'react';
import { t } from '@/i18n/t';
import { useCurrentSession, useGroup } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { ChevronIcon, PlayIcon } from '@/ui/components/Icons';
import { Logo } from '@/ui/components/Logo';
import { PlayingCard } from '@/ui/components/PlayingCard';
import { PressableLink } from '@/ui/components/Pressable';
import { useAreaCards } from '@/ui/views/areaCards';
import styles from './StartView.module.css';

const FAN_POSITIONS = [styles.left, styles.middle, styles.right];
const LOGO_SIZE = 44;

/**
 * Start view `#/` (Architecture 13.1, design D-3): persons, tables and games as a fan of
 * playing cards right above the card hand; the view never scrolls. Above them the draw pile
 * "Partie" (I2, US-SP-01 AK-1): it starts a new match, or leads to the running one. At the top
 * the logo with the app name, the only place it appears in the app (design I2-G, L5); below it
 * the banner of a running match leads back to it with one tap (US-AB-04 AK-2, design I2-D);
 * the banners of I4 follow there.
 */
export function StartView(): React.JSX.Element {
  const { db } = useAppDependencies();
  const cards = useAreaCards();
  const current = useCurrentSession(db);
  const group = useGroup(db, current?.status === 'active' ? current.session.groupId : null);
  const headingId = useId();
  return (
    <main className={styles.start}>
      <h1 className={styles.hiddenTitle}>{t('start.titel')}</h1>
      <p className={styles.brand}>
        <Logo size={LOGO_SIZE} />
        {t('app.name')}
      </p>
      {/* Place for the banners (reminder I4, update I4, running match I2) at the top; they must
          not push the cards down while there is room. Look and sizes:
          docs/design/d3-start-navigation-final-preview.html, scope "Mit späteren Funktionen". */}
      {group !== undefined && group !== null && (
        <div className={styles.banner}>
          <span className={styles.bannerText}>
            <b>{group.name}</b>
            {t('start.spieltGerade')}
          </span>
          <PressableLink to="/partie" state={{ from: 'start' }} className={styles.pill}>
            {t('start.weiter')}
            <ChevronIcon size={14} />
          </PressableLink>
        </div>
      )}
      <div className={styles.spacer} />
      {/* "Partie" as a draw pile right above the cards, together with them in one column with a
          14px gap (same reference, docs/design/i2-match-final-preview.html). */}
      <div className={styles.column}>
        <PressableLink
          to={current !== undefined && current.status !== 'none' ? '/partie' : '/partie/neu'}
          state={{ from: 'start' }}
          look="card"
          className={styles.pile}
        >
          <span className={styles.pileStack} aria-hidden="true">
            <span className={styles.back} />
            <span className={styles.back} />
            <span className={styles.back}>
              <span className={styles.backBadge}>
                <PlayIcon size={18} />
              </span>
            </span>
          </span>
          <strong className={styles.pileTitle}>{t('start.partie')}</strong>
          <span className={styles.pileArrow}>
            <ChevronIcon size={20} />
          </span>
        </PressableLink>
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
      </div>
      <div className={styles.spacerLow} />
    </main>
  );
}
