import type { ReactNode } from 'react';
import styles from './Notice.module.css';

type NoticeProps = {
  readonly tone: 'warning' | 'error';
  readonly children: ReactNode;
};

/**
 * Hint that appears after an action, e.g. about a duplicate name. As an alert it is
 * announced and can be found in tests by its role.
 */
export function Notice({ tone, children }: NoticeProps): React.JSX.Element {
  return (
    <div role="alert" className={tone === 'warning' ? styles.warning : styles.error}>
      {children}
    </div>
  );
}
