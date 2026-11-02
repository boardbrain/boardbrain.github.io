import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import { catanPlacementOrder, type CatanOrderSpinStep } from '@/games/catan';
import { t } from '@/i18n/t';
import { Coin } from './Coin';
import { colorOf } from './matchColors';
import { Reveal } from './Reveal';
import styles from './MatchView.module.css';
import { cx } from '@/ui/components/classNames';

// The newest card is lifted by 10 px (Q3).
const LIFT_PX = -10;

type OrderStepProps = {
  readonly session: StoredSession;
  readonly step: CatanOrderSpinStep;
  readonly nameOf: (personId: PersonId) => string;
};

/**
 * One spin of the order as a row of cards Q3 (US-LS-03 AK-2, AK-3, design I2-C page 6): open
 * places face down with their number, the new card lifted, a golden band "Start" or "Platz n".
 * The last place follows without a spin.
 */
export function OrderStep({ session, step, nameOf }: OrderStepProps): React.JSX.Element {
  const steps = session.generation.steps.map((record) => record.step);
  const drawn = steps.flatMap((other) => (other.kind === 'order-spin' ? [other] : []));
  const order =
    catanPlacementOrder(session.setup, steps) ??
    drawn.sort((a, b) => a.position - b.position).map((spin) => spin.result);
  const count = session.setup.participants.length;
  return (
    <div className={styles.qRow} style={{ gridTemplateColumns: `repeat(${String(count)}, 1fr)` }}>
      {session.setup.participants.map((_, place) => {
        const who = order[place];
        if (who === undefined) {
          return (
            <div
              key={`place-${String(place)}`}
              className={cx(styles.qCard, styles.qBack, place === count - 1 && styles.qLast)}
            >
              <span className={styles.qPlace}>{place + 1}</span>
            </div>
          );
        }
        const content = (
          <>
            <span className={styles.qBand}>
              {place === 0 ? t('partie.start') : t('partie.platz', { platz: place + 1 })}
            </span>
            <Coin name={nameOf(who)} color={colorOf(session, who)} />
            <strong className={styles.qName}>{nameOf(who)}</strong>
            <span
              className={styles.stripe}
              style={{ background: `var(--color-catan-${colorOf(session, who)})` }}
            />
          </>
        );
        return place === step.position ? (
          <Reveal key={who} className={cx(styles.qCard, styles.qNow)} restY={LIFT_PX}>
            {content}
          </Reveal>
        ) : (
          <div key={who} className={styles.qCard}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
