import type { ReactNode } from 'react';
import styles from './Page.module.css';

type PageProps = {
  readonly title: string;
  readonly intro?: string;
  readonly children?: ReactNode;
};

/**
 * Main area of a view with heading and optional introduction.
 */
export function Page({ title, intro, children }: PageProps): React.JSX.Element {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      {intro !== undefined && <p className={styles.intro}>{intro}</p>}
      {children}
    </main>
  );
}
