import { Link } from 'react-router';
import { t } from '@/i18n/t';
import styles from './PlayingCard.module.css';

const ICON_SIZE = 34;

type PlayingCardProps = {
  readonly to: string;
  readonly title: string;
  readonly count: number;
  /** Symbol of the area; decorative. */
  readonly icon: (props: { readonly size?: number | undefined }) => React.JSX.Element;
  /** Small line below the title, e.g. the first names. */
  readonly note?: string | undefined;
  /** Position in a fan or grid, set by the parent. */
  readonly className?: string | undefined;
};

/**
 * An area of the app as a playing card (design D-3): the count in two corners like a card
 * index, the symbol and the name in the middle. The whole card is a link.
 */
export function PlayingCard({
  to,
  title,
  count,
  icon,
  note,
  className,
}: PlayingCardProps): React.JSX.Element {
  return (
    <Link
      to={to}
      className={[styles.card, className].filter((name) => typeof name === 'string').join(' ')}
      aria-label={t('karten.karte', { name: title, anzahl: count })}
    >
      <span className={styles.corner} aria-hidden="true">
        {count}
      </span>
      <span className={styles.icon}>{icon({ size: ICON_SIZE })}</span>
      <span className={styles.title}>{title}</span>
      {note !== undefined && note !== '' && <span className={styles.note}>{note}</span>}
      <span className={styles.cornerBottom} aria-hidden="true">
        {count}
      </span>
    </Link>
  );
}
