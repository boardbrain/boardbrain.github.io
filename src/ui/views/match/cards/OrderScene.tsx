import { useRef } from 'react';
import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import { catanPlacementOrder, type CatanOrderSpinStep } from '@/games/catan';
import { t } from '@/i18n/t';
import { cx } from '@/ui/components/classNames';
import { useElementSize } from '@/ui/components/useElementSize';
import { Coin } from '../Coin';
import { colorOf } from '../matchColors';
import { Reveal } from '../Reveal';
import { orderLayout } from './cardLayout';
import { Place, TableCard } from './TableCard';
import { tableSize } from './tableSize';
import shared from '../MatchView.module.css';
import styles from './Cards.module.css';

type OrderFrontProps = {
  readonly name: string;
  readonly color: StoredSession['setup']['colors'][number]['catanColor'];
  /** The place of the card from 0, `null` while it is not drawn yet. */
  readonly place: number | null;
  readonly isNewest?: boolean;
};

/**
 * The front of an order card Q3 (design I2-C, page 6): band "Start" or "Platz n" once the card
 * lies on its place, coin, name and stripe; the newest one is lifted.
 */
function OrderFront({ name, color, place, isNewest = false }: OrderFrontProps): React.JSX.Element {
  return (
    <span
      className={cx(
        shared.qCard,
        styles.orderFace,
        place === null && styles.noBand,
        isNewest && shared.qNow,
        isNewest && styles.lifted,
      )}
    >
      {place !== null && (
        <span className={shared.qBand}>
          {place === 0 ? t('partie.start') : t('partie.platz', { platz: place + 1 })}
        </span>
      )}
      <Coin name={name} color={color} />
      <strong className={shared.qName}>{name}</strong>
      <span className={shared.stripe} style={{ background: `var(--color-catan-${color})` }} />
    </span>
  );
}

type OrderSceneProps = {
  readonly session: StoredSession;
  readonly nameOf: (personId: PersonId) => string;
};

/**
 * Page 6, the order with cards (US-LS-03, US-IN-01 AK-3, design I2-D): the places in a row,
 * before drawing dashed with their number and the person cards face up below. The first spin
 * deals all cards face down onto the places; every spin turns the next place over, the last one
 * follows by itself (FA-LS-02). The face-down cards only show the back: who lies there is not
 * drawn yet.
 */
export function OrderScene({ session, nameOf }: OrderSceneProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = tableSize(useElementSize(ref));
  const persons = session.setup.participants;
  const layout = orderLayout(width, height, persons.length);
  const steps = session.generation.steps.map((record) => record.step);
  const spins = steps
    .filter((step): step is CatanOrderSpinStep => step.kind === 'order-spin')
    .sort((a, b) => a.position - b.position);
  const placed = catanPlacementOrder(session.setup, steps) ?? spins.map((spin) => spin.result);
  const isDealt = placed.length > 0;
  const isComplete = placed.length === persons.length;
  const row = layout.row(persons.length);
  return (
    <div ref={ref} className={styles.table}>
      {layout.slots.map((box, place) => (
        <Place
          key={`place-${String(place)}`}
          box={box}
          label={String(place + 1)}
          isFilled={isDealt}
        />
      ))}
      {layout.slots.map((box, place) => {
        const personId = placed[place];
        if (personId === undefined) {
          return isDealt && <TableCard key={`down-${String(place)}`} box={box} z={5} isFaceDown />;
        }
        const isNewest = !isComplete && place === placed.length - 1;
        const card = (
          <TableCard
            box={box}
            z={5}
            isBareFront
            front={
              <OrderFront
                name={nameOf(personId)}
                color={colorOf(session, personId)}
                place={place}
                isNewest={isNewest}
              />
            }
          />
        );
        // The card just turned over fades in; with the last place, both do (FA-LS-02).
        return place >= spins.length - 1 ? (
          <Reveal key={personId} className={styles.layer}>
            {card}
          </Reveal>
        ) : (
          <div key={personId}>{card}</div>
        );
      })}
      {!isDealt &&
        persons.map((personId, index) => {
          const box = row[index];
          return (
            box !== undefined && (
              <TableCard
                key={personId}
                box={box}
                z={10 + index}
                isBareFront
                front={
                  <OrderFront
                    name={nameOf(personId)}
                    color={colorOf(session, personId)}
                    place={null}
                  />
                }
              />
            )
          );
        })}
    </div>
  );
}
