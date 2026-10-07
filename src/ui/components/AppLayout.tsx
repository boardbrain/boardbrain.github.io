import { NavLink, Outlet } from 'react-router';
import { t } from '@/i18n/t';
import styles from './AppLayout.module.css';

function navLinkClass({ isActive }: { readonly isActive: boolean }): string | undefined {
  return isActive ? styles.activeLink : styles.link;
}

/**
 * Frame of the app with header and main navigation (Architecture 13.1). The diagnostics view
 * is deliberately missing from the navigation; it is reached via `#/diagnose` only.
 */
export function AppLayout(): React.JSX.Element {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.appName}>{t('app.name')}</span>
        <nav aria-label={t('navigation.titel')}>
          <ul className={styles.navList}>
            <li>
              <NavLink to="/" end className={navLinkClass}>
                {t('navigation.start')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/verwaltung" className={navLinkClass}>
                {t('navigation.verwaltung')}
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
