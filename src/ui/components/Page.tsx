import type { ReactNode } from 'react';
import styles from './Page.module.css';

type PageProps = {
  readonly title: string;
  readonly intro?: string;
  /** Controls to the right of the heading, e.g. a search button. */
  readonly actions?: ReactNode;
  /** Wider content area for grids. */
  readonly isWide?: boolean;
  readonly children?: ReactNode;
};

/**
 * Main area of a view with heading and optional introduction.
 */
export function Page({ title, intro, actions, isWide, children }: PageProps): React.JSX.Element {
  return (
    <main className={isWide === true ? styles.wide : styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {actions}
      </div>
      {intro !== undefined && <p className={styles.intro}>{intro}</p>}
      {children}
    </main>
  );
}
