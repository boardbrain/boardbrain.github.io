import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { Outlet, useLocation } from 'react-router';
import { t } from '@/i18n/t';
import { HandNavigation, type HandArea } from './HandNavigation';
import { isHandFolded } from './cardHand';
import { FolderIcon, HomeIcon, RotateIcon } from './Icons';
import { Logo } from './Logo';
import styles from './AppLayout.module.css';

const LOGO_SIZE = 28;
const HINT_ICON_SIZE = 56;

// Architecture 13.1: only areas that already exist. Later areas (statistics I3, data I4,
// settings I6) are one entry each; their look is in docs/design/d3-start-navigation-final-preview.html.
const AREAS: readonly HandArea[] = [
  { to: '/', label: 'navigation.start', icon: HomeIcon, isEnd: true },
  { to: '/verwaltung', label: 'navigation.verwaltung', icon: FolderIcon },
];

/**
 * Frame of the app (Architecture 13.1, designs D-3 and K-3): header with logo, the view and the
 * main navigation as a hand of cards at the bottom, folded on every page but the start view. The
 * diagnostics view is deliberately missing from the navigation; it is reached via `#/diagnose`
 * only. Phones in landscape only see a hint to turn the phone (NFA-PL-04, E-29). Animations
 * follow the system setting to reduce motion.
 */
export function AppLayout(): React.JSX.Element {
  const { pathname } = useLocation();
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className={styles.layout}>
          <div className={isHandFolded(pathname) ? styles.foldedApp : styles.app}>
            <header className={styles.header}>
              <span className={styles.appName}>
                <Logo size={LOGO_SIZE} />
                {t('app.name')}
              </span>
            </header>
            <div className={styles.content}>
              <Outlet />
            </div>
            <HandNavigation areas={AREAS} />
          </div>
          <div className={styles.rotateHint}>
            <span className={styles.rotateIcon}>
              <RotateIcon size={HINT_ICON_SIZE} />
            </span>
            <strong className={styles.rotateTitle}>{t('drehen.titel')}</strong>
            <span className={styles.rotateText}>{t('drehen.text')}</span>
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
