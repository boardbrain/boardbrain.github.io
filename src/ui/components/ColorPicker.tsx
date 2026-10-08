import type { CatanColorKey, GroupColorKey } from '@/core/model';
import { t } from '@/i18n/t';
import styles from './ColorPicker.module.css';

type ColorPickerProps<K extends GroupColorKey> = {
  /** Accessible name of the whole group of colours, e.g. "Gruppenfarbe von Anna". */
  readonly label: string;
  readonly options: readonly K[];
  readonly selected: K;
  /** Which palette the swatches show. */
  readonly palette: 'group' | 'catan';
  /** Name of the other person who has the colour; the swatch shows their initial. */
  readonly holderOf?: (color: K) => string | undefined;
  readonly onSelect: (color: K) => void;
};

/**
 * Row of colour swatches. Every swatch is a button with the colour name as label; the
 * selected one is marked for assistive technology and visibly (US-PG-03). A colour that
 * another person has shows their initial and names them in the label (AK-5: choosing it swaps).
 * Colour values come from the design tokens only (NFA-GB-05).
 */
export function ColorPicker<K extends GroupColorKey | CatanColorKey>({
  label,
  options,
  selected,
  palette,
  holderOf,
  onSelect,
}: ColorPickerProps<K>): React.JSX.Element {
  return (
    <div role="group" aria-label={label} className={styles.row}>
      {options.map((color) => {
        const holder = color === selected ? undefined : holderOf?.(color);
        const name = t(`farben.${color}`);
        return (
          <div key={color} className={styles.item}>
            <button
              type="button"
              className={color === selected ? styles.selected : styles.swatch}
              style={{ background: `var(--color-${palette}-${color})` }}
              aria-label={
                holder === undefined ? name : t('farben.vergeben', { farbe: name, name: holder })
              }
              aria-pressed={color === selected}
              onClick={() => {
                onSelect(color);
              }}
            >
              {holder?.charAt(0)}
            </button>
            <span className={styles.name}>{name}</span>
          </div>
        );
      })}
    </div>
  );
}
