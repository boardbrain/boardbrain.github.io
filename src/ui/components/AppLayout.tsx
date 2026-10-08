import { NavLink, Outlet } from 'react-router';
import { t } from '@/i18n/t';
import { FolderIcon, HomeIcon, RotateIcon } from './Icons';
import { Logo } from './Logo';
import styles from './AppLayout.module.css';

const LOGO_SIZE = 28;
const HAND_ICON_SIZE = 22;
const HINT_ICON_SIZE = 56;

function cardClass({ isActive }: { readonly isActive: boolean }): string | undefined {
  return isActive ? styles.activeCard : styles.card;
}

/**
 * Frame of the app (Architecture 13.1, design D-3): header with logo, the view and the main
 * navigation as a hand of cards at the bottom. The diagnostics view is deliberately missing
 * from the navigation; it is reached via `#/diagnose` only. Phones in landscape only see a
 * hint to turn the phone (NFA-PL-04).
 */
export function AppLayout(): React.JSX.Element {
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
          <ul className={styles.handList}>
            <li className={styles.handItem}>
              <NavLink to="/" end className={cardClass}>
                <HomeIcon size={HAND_ICON_SIZE} />
                {t('navigation.start')}
              </NavLink>
            </li>
            <li className={styles.handItem}>
              <NavLink to="/verwaltung" className={cardClass}>
                <FolderIcon size={HAND_ICON_SIZE} />
                {t('navigation.verwaltung')}
              </NavLink>
            </li>
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
