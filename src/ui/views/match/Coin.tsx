import type { CatanColorKey } from '@/core/model';
import styles from './Coin.module.css';

type CoinProps = {
  readonly name: string;
  readonly color: CatanColorKey;
  readonly className?: string | undefined;
};

/**
 * A person as a coin in their Catan colour with the initial (design I2-C). Decorative: the
 * name stands beside it.
 */
export function Coin({ name, color, className }: CoinProps): React.JSX.Element {
  return (
    <span
      className={[styles.coin, className].filter((part) => part !== undefined).join(' ')}
      style={{ background: `var(--color-catan-${color})` }}
      aria-hidden="true"
    >
      {name.slice(0, 1)}
    </span>
  );
}
