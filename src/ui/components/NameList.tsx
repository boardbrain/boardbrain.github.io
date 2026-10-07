import styles from './NameList.module.css';

type NameListProps = {
  readonly label: string;
  readonly items: readonly { readonly id: string; readonly name: string }[];
  readonly emptyText?: string;
};

/**
 * List of named records such as persons or games; shows `emptyText` if there are none.
 */
export function NameList({ label, items, emptyText }: NameListProps): React.JSX.Element {
  if (items.length === 0 && emptyText !== undefined) {
    return <p className={styles.empty}>{emptyText}</p>;
  }
  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
