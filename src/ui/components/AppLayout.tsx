import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router';
import { t } from '@/i18n/t';
import { HandNavigation, type HandArea } from './HandNavigation';
import { isHandFolded } from './cardHand';
import { ChartIcon, FolderIcon, HomeIcon, RotateIcon } from './Icons';
import { useIsPhone } from './mediaQueries';
import { suppressTouchContextMenu } from './touchMenu';
import { usePageScroll } from './usePageScroll';
import styles from './AppLayout.module.css';

const HINT_ICON_SIZE = 56;

// Architecture 13.1: only areas that already exist. Later areas (data I4, settings I6) are one
// entry each; their look is in docs/design/d3-start-navigation-final-preview.html. The statistics
// came with I3-D (design KS2: only in the card hand, not on the start).
const AREAS: readonly HandArea[] = [
  {
    to: '/',
    label: 'navigation.start',
    icon: HomeIcon,
    isEnd: true,
    alsoOn: ['/partie', '/ergebnis'],
  },
  { to: '/verwaltung', label: 'navigation.verwaltung', icon: FolderIcon },
  { to: '/statistik', label: 'navigation.statistik', icon: ChartIcon },
];

/**
 * Frame of the app (Architecture 13.1, designs D-3, K-3 and I2-G): the view and the main
 * navigation as a hand of cards at the bottom; on a phone it is folded on every page but the
 * start view. There is no header: every view starts with its own heading, the start view shows
 * the logo (I2-G). The
 * diagnostics view is deliberately missing from the navigation; it is reached via `#/diagnose`
 * only. Phones in landscape only see a hint to turn the phone (NFA-PL-04, E-29). Animations
 * follow the system setting to reduce motion. A long press with a finger opens no browser menu
 * anywhere in the app (K-4). Every page starts at its top, back returns to the place it was left
 * (PO 27.11.2026).
 */
export function AppLayout(): React.JSX.Element {
  const { pathname, key } = useLocation();
  const isPhone = useIsPhone();
  const contentRef = useRef<HTMLDivElement>(null);
  usePageScroll(contentRef, pathname, key, useNavigationType());
  // External system: the browser's context menu on the whole document (K-4).
  useEffect(() => suppressTouchContextMenu(document), []);
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className={styles.layout}>
          <div className={isHandFolded(pathname, isPhone) ? styles.foldedApp : styles.app}>
            <div ref={contentRef} className={styles.content}>
              <Outlet />
            </div>
            <HandNavigation areas={AREAS} isPhone={isPhone} />
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
