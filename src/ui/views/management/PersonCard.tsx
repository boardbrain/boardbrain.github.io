import { Link } from 'react-router';
import type { Person, PersonTable } from '@/core/model';
import { t } from '@/i18n/t';
import styles from './PersonCard.module.css';

// At most this many colour dots; with more tables one less plus "+n", so they fit in one line.
const MAX_DOTS = 5;

type PersonCardProps = {
  readonly person: Person;
  readonly tables: readonly PersonTable[];
};

/**
 * A person as a small playing card in the person list (design I1-E, L1): the number of tables
 * in the corners, the initial, the name, the person's colour at each table and the names of the
 * tables (US-VW-05 AK-1). The whole card opens the person (AK-2).
 */
export function PersonCard({ person, tables }: PersonCardProps): React.JSX.Element {
  const tableNames =
    tables.length === 0
      ? t('personen.keinTisch')
      : tables.map(({ group }) => group.name).join(', ');
  const dots = tables.length > MAX_DOTS ? tables.slice(0, MAX_DOTS - 1) : tables;
  const hidden = tables.length - dots.length;
  return (
    <Link
      to={`/verwaltung/personen/${person.id}`}
      className={[styles.card, tables.length === 0 && styles.alone]
        .filter((name) => typeof name === 'string')
        .join(' ')}
      aria-label={t('personen.karte', { name: person.name, tische: tableNames })}
    >
      <span className={styles.corner} aria-hidden="true">
        {tables.length}
      </span>
      <span className={styles.initial} aria-hidden="true">
        {person.name.charAt(0)}
      </span>
      <span className={styles.name}>{person.name}</span>
      {tables.length > 0 && (
        <span className={styles.dots} aria-hidden="true">
          {dots.map(({ group, member }) => (
            <span
              key={group.id}
              className={styles.dot}
              style={{ background: `var(--color-group-${member.groupColor})` }}
            />
          ))}
          {hidden > 0 && (
            <span className={styles.more}>{t('personen.weitere', { anzahl: hidden })}</span>
          )}
        </span>
      )}
      <span className={styles.tables}>{tableNames}</span>
      <span className={styles.cornerBottom} aria-hidden="true">
        {tables.length}
      </span>
    </Link>
  );
}
