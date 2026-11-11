import { useRef, useState } from 'react';
import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import { catanPlacementOrder, type CatanOrderSpinStep } from '@/games/catan';
import { t } from '@/i18n/t';
import { cx } from '@/ui/components/classNames';
import { useElementSize } from '@/ui/components/useElementSize';
import { Coin } from '../Coin';
import { colorOf } from '../matchColors';
import { orderLayout, type OrderLayout } from './cardLayout';
import { StagedCards, type StageHandle } from './StagedCards';
import { placeTarget, planOrder, type OrderStageInput } from './stagePlan';
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
  /**
   * In a movement the lift and the golden frame are moved by the plan (design I2-E): the front
   * lies level and carries a frame of its own that fades.
   */
  readonly isStaged?: boolean;
};

/**
 * The front of an order card Q3 (design I2-C, page 6): band "Start" or "Platz n" once the card
 * lies on its place, coin, name and stripe; the newest one is lifted.
 */
function OrderFront({
  name,
  color,
  place,
  isNewest = false,
  isStaged = false,
}: OrderFrontProps): React.JSX.Element {
  return (
    <span
      data-stage-raise={isStaged && place !== null ? '' : undefined}
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
      {isStaged && place !== null && <span data-stage-now="" className={styles.nowFrame} />}
    </span>
  );
}

type OrderSceneProps = {
  readonly session: StoredSession;
  readonly nameOf: (personId: PersonId) => string;
  /**
   * Set while the spin just drawn is still to be shown with its movement (design I2-E,
   * FA-AB-07); `null` shows the order at rest.
   */
  readonly stage?: StageHandle | null;
  /** The spin was drawn on its page without a result after a repetition: collect first (E1). */
  readonly isAfterRepeat?: boolean;
};

/**
 * Page 6, the order with cards (US-LS-03, US-IN-01 AK-3, design I2-D): the places in a row,
 * before drawing dashed with their number and the person cards face up below. The first spin
 * deals all cards face down onto the places; every spin turns the next place over, the last one
 * follows by itself (FA-LS-02). The face-down cards only show the back: who lies there is not
 * drawn yet.
 */
export function OrderScene({
  session,
  nameOf,
  stage = null,
  isAfterRepeat = false,
}: OrderSceneProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const measured = useElementSize(ref);
  const { width, height } = tableSize(measured);
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
  // The spin just drawn: the places before it, the person drawn and, if it is the last spin, the
  // last place that follows by itself.
  const newest = spins[spins.length - 1];
  if (stage !== null && newest !== undefined && measured !== null) {
    const k = newest.position;
    const before = placed.slice(0, k);
    const last =
      isComplete && k === persons.length - 2 ? (placed[persons.length - 1] ?? null) : null;
    return (
      <div ref={ref} className={styles.table} data-stage-root="">
        {layout.slots.map((box, place) => (
          <Place
            key={`place-${String(place)}`}
            box={box}
            label={String(place + 1)}
            isFilled={k > 0}
            stageName={placeTarget(place)}
          />
        ))}
        <OrderStage
          layout={layout}
          input={{
            persons,
            placed: before,
            result: newest.result,
            last,
            mode: k === 0 ? 'deal' : isAfterRepeat ? 'regather' : 'turn',
          }}
          front={(key) => {
            const [personId, place] = splitKey(key, persons);
            return personId === undefined ? null : (
              <OrderFront
                name={nameOf(personId)}
                color={colorOf(session, personId)}
                place={place}
                isStaged
              />
            );
          }}
          handle={stage}
        />
      </div>
    );
  }
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
        return <div key={personId}>{card}</div>;
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

// A front key of the plan: a person in the row, or a person on a place (`orderKey`).
function splitKey(
  key: string,
  persons: readonly PersonId[],
): [PersonId | undefined, number | null] {
  const [person, place] = key.split('@');
  const personId = persons.find((candidate) => candidate === person);
  return [personId, place === undefined ? null : Number(place)];
}

type OrderStageProps = {
  readonly layout: OrderLayout;
  readonly input: Omit<OrderStageInput, 'slots' | 'row' | 'rng'>;
  readonly front: (key: string) => React.ReactNode;
  readonly handle: StageHandle;
};

// The movement of a spin (US-IN-01 AK-3, design I2-E), planned once when it starts.
function OrderStage({ layout, input, front, handle }: OrderStageProps): React.JSX.Element {
  const [plan] = useState(() =>
    planOrder({
      ...input,
      slots: layout.slots,
      row: layout.row(input.persons.length),
      rng: handle.rng,
    }),
  );
  return <StagedCards plan={plan} front={front} isBareFront handle={handle} />;
}
