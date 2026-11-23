import type { ReactNode } from 'react';
import { BackButton } from './BackButton';
import styles from './Page.module.css';

type PageProps = {
  readonly title: string;
  /** A line below the title, e.g. the day of a result. */
  readonly subtitle?: string;
  /** A picture between the back button and the title, e.g. the symbol of a game. */
  readonly picture?: ReactNode;
  readonly intro?: string;
  /** Controls to the right of the heading, e.g. a search button. */
  readonly actions?: ReactNode;
  /** Fills the visible height instead of scrolling; the content gets the remaining space. */
  readonly isFullHeight?: boolean;
  /** Shows a back button; the address is used when there is no previous page (design D-3). */
  readonly backFallback?: string;
  readonly children?: ReactNode;
};

/**
 * Main area of a view with heading and optional introduction. Every view but the start has the
 * same width, padding and head height (design I2-G), so the back button keeps its place.
 */
export function Page({
  title,
  subtitle,
  picture,
  intro,
  actions,
  isFullHeight,
  backFallback,
  children,
}: PageProps): React.JSX.Element {
  return (
    <main
      className={[styles.page, isFullHeight === true && styles.fill]
        .filter((name) => typeof name === 'string')
        .join(' ')}
    >
      <div className={styles.header}>
        {backFallback !== undefined && <BackButton fallback={backFallback} />}
        {picture}
        {subtitle === undefined ? (
          <h1 className={styles.title}>{title}</h1>
        ) : (
          <div className={styles.titles}>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.subtitle}>{subtitle}</div>
          </div>
        )}
        {actions}
      </div>
      {intro !== undefined && <p className={styles.intro}>{intro}</p>}
      {children}
    </main>
  );
}
