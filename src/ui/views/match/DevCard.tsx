import type { ReactNode } from 'react';
import styles from './DevCard.module.css';
import { cx } from '@/ui/components/classNames';

type DevCardProps = {
  /** Text on the golden ribbon. */
  readonly title: string;
  /** Picture in the frame. */
  readonly art: ReactNode;
  /** Text field with the arch below the picture. */
  readonly children: ReactNode;
  /** The result of a draw (D2): ribbon a little smaller, text centred with more room. */
  readonly isResult?: boolean;
  readonly className?: string | undefined;
};

/**
 * A card built like a development card (design I2-C, K2 and D2): golden ribbon with notches,
 * framed picture, text field with an arch. Own layout, no original card artwork (NFA-GB-06).
 */
export function DevCard({
  title,
  art,
  children,
  isResult = false,
  className,
}: DevCardProps): React.JSX.Element {
  return (
    <span className={cx(styles.card, className)}>
      <span className={styles.head}>
        <span className={cx(styles.ribbon, isResult && styles.resultRibbon)}>
          <strong className={isResult ? styles.resultRibbonText : styles.ribbonText}>
            {title}
          </strong>
        </span>
      </span>
      <span className={styles.art}>{art}</span>
      <span className={cx(styles.text, isResult && styles.resultText)}>{children}</span>
    </span>
  );
}
