import { Link } from 'react-router';
import styles from './LinkList.module.css';

type LinkListProps = {
  readonly label: string;
  readonly links: readonly { readonly to: string; readonly text: string }[];
};

/**
 * Navigation to sub-areas as large touch targets (Development Guidelines 6).
 */
export function LinkList({ label, links }: LinkListProps): React.JSX.Element {
  return (
    <nav aria-label={label}>
      <ul className={styles.list}>
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className={styles.link}>
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
