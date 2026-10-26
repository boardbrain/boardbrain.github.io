import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './PillButton.module.css';

type PillButtonProps = {
  readonly icon?: ReactNode;
  readonly children: ReactNode;
} & (
  | { readonly onClick: () => void; readonly to?: never }
  | { readonly to: string; readonly onClick?: never }
);

/**
 * Small action in the style of the value pills, e.g. "✎ Umbenennen" (design I1-F, variant B).
 * Visibly 34 px high; the touch area is 44 px like every other control. With `to` it is a link.
 */
export function PillButton({ icon, children, onClick, to }: PillButtonProps): React.JSX.Element {
  const content = (
    <>
      {icon}
      {children}
    </>
  );
  if (to !== undefined) {
    return (
      <Link to={to} className={styles.pill}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={styles.pill} onClick={onClick}>
      {content}
    </button>
  );
}
