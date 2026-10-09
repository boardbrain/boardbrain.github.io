import { NavLink, Outlet } from 'react-router';
import { t, type TextKey } from '@/i18n/t';
import { cardRotation, isCompactHand } from './cardHand';
import { FolderIcon, HomeIcon, RotateIcon } from './Icons';
import { Logo } from './Logo';
import styles from './AppLayout.module.css';

const LOGO_SIZE = 28;
const HAND_ICON_SIZE = 22;
const HINT_ICON_SIZE = 56;

type HandArea = {
  readonly to: string;
  readonly label: TextKey;
  readonly icon: (props: { readonly size?: number | undefined }) => React.JSX.Element;
  /** Active only on exactly this address (the start view). */
  readonly isEnd?: boolean;
};

// Architecture 13.1: only areas that already exist. Later areas (statistics I3, data I4,
// settings I6) are one entry each; their look is in docs/design/d3-start-navigation-final-preview.html.
const AREAS: readonly HandArea[] = [
  { to: '/', label: 'navigation.start', icon: HomeIcon, isEnd: true },
  { to: '/verwaltung', label: 'navigation.verwaltung', icon: FolderIcon },
];

function cardClass({ isActive }: { readonly isActive: boolean }): string | undefined {
  return isActive ? styles.activeCard : styles.card;
}

/**
 * Frame of the app (Architecture 13.1, design D-3): header with logo, the view and the main
 * navigation as a hand of cards at the bottom. The diagnostics view is deliberately missing
 * from the navigation; it is reached via `#/diagnose` only. Phones in landscape only see a
 * hint to turn the phone (NFA-PL-04, E-29).
 */
export function AppLayout(): React.JSX.Element {
  const isCompact = isCompactHand(AREAS.length);
  return (
    <div className={styles.layout}>
      <div className={styles.app}>
        <header className={styles.header}>
          <span className={styles.appName}>
            <Logo size={LOGO_SIZE} />
            {t('app.name')}
          </span>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
        <nav className={styles.hand} aria-label={t('navigation.titel')}>
          <ul className={isCompact ? styles.compactHand : styles.handList}>
            {AREAS.map((area, index) => (
              <li key={area.to} className={styles.handItem}>
                <NavLink
                  to={area.to}
                  end={area.isEnd === true}
                  className={cardClass}
                  style={{ rotate: `${String(cardRotation(index, AREAS.length))}deg` }}
                >
                  {area.icon({ size: HAND_ICON_SIZE })}
                  {t(area.label)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={styles.rotateHint}>
        <span className={styles.rotateIcon}>
          <RotateIcon size={HINT_ICON_SIZE} />
        </span>
        <strong className={styles.rotateTitle}>{t('drehen.titel')}</strong>
        <span className={styles.rotateText}>{t('drehen.text')}</span>
      </div>
    </div>
  );
}
