import { useRef, type ReactNode } from 'react';
import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import { CATAN_RESOURCES, type CatanResource } from '@/games/catan';
import { t } from '@/i18n/t';
import { ResourcesOptionIcon } from '@/ui/art/OptionIcons';
import { ResourceCardPicture } from '@/ui/art/Pictures';
import { cx } from '@/ui/components/classNames';
import { PressableButton } from '@/ui/components/Pressable';
import { useElementSize } from '@/ui/components/useElementSize';
import { colorOf } from '../matchColors';
import { orderOrSeats } from '../matchFlow';
import { RESOURCE_NAMES } from '../matchTexts';
import { Reveal } from '../Reveal';
import { TurnBand } from '../TurnBand';
import { resourcesLayout, type CardBox } from './cardLayout';
import { Place, TableCard } from './TableCard';
import { tableSize } from './tableSize';
import shared from '../MatchView.module.css';
import styles from './Cards.module.css';

type ResourcesSceneProps = {
  readonly session: StoredSession;
  readonly personId: PersonId;
  /** The drawn resources, `null` before drawing (US-AB-02 AK-3). */
  readonly result: readonly CatanResource[] | null;
  /** Indices of the cards turned over (FA-SR-05). */
  readonly opened: readonly number[];
  /** Turns over card `index`; `undefined` where the cards cannot be turned, e.g. in the look back. */
  readonly onTurn?: ((index: number) => void) | undefined;
  readonly nameOf: (personId: PersonId) => string;
  /** "Wiederholen" and the forward button, right below the band as on the placement. */
  readonly actions: ReactNode;
};

function ResourceFront({ resource }: { readonly resource: CatanResource }): React.JSX.Element {
  return <ResourceCardPicture resource={resource} className={shared.resCardArt} />;
}

/**
 * Page 8, the starting resources of a person with cards (US-SR-01, design I2-D): as many places
 * as resources, below them the cards and the band "Name · n Rohstoffe"; the band lies where it
 * lies on the placement, so it does not jump between the pages (PO 09.11.2026). Before the first person
 * draws, the five kinds lie face up; after that the stack stays face down. The drawn cards lie
 * face down on the places until the person turns them over (FA-SR-05, US-SR-01 AK-6). With
 * replacement the stack is complete again at once; without, it lacks this person's cards.
 */
export function ResourcesScene({
  session,
  personId,
  result,
  opened,
  onTurn,
  nameOf,
  actions,
}: ResourcesSceneProps): React.JSX.Element | null {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = tableSize(useElementSize(ref));
  const options = session.setup.options.startingResources;
  if (options === null) {
    return null;
  }
  const { count } = options;
  const layout = resourcesLayout(width, height, count);
  const order = orderOrSeats(session);
  const isFirst = order[0] === personId;
  const stackCount =
    options.replacement === 'with' ? CATAN_RESOURCES.length : CATAN_RESOURCES.length - count;
  return (
    <div className={styles.withBand}>
      <div ref={ref} className={styles.table}>
        {layout.slots.map((box, place) => (
          <Place
            key={`place-${String(place)}`}
            box={box}
            label={t('partie.fragezeichen')}
            isFilled={result !== null}
          />
        ))}
        {result === null && isFirst
          ? CATAN_RESOURCES.map((resource, index) => {
              const box = layout.kinds[index];
              return (
                box !== undefined && (
                  <TableCard
                    key={resource}
                    box={box}
                    z={10}
                    className={styles.resource}
                    front={<ResourceFront resource={resource} />}
                  />
                )
              );
            })
          : Array.from({ length: stackCount }, (_, level) => (
              <TableCard
                key={`stack-${String(level)}`}
                box={layout.stack(level)}
                z={10 + level}
                className={styles.resource}
                isFaceDown
              />
            ))}
        {result !== null && (
          <Reveal className={styles.layer}>
            {result.map((resource, place) => {
              const box = layout.slots[place];
              return (
                box !== undefined && (
                  <DrawnResource
                    key={`${resource}-${String(place)}`}
                    box={box}
                    number={place + 1}
                    resource={resource}
                    isOpen={opened.includes(place)}
                    onTurn={
                      onTurn === undefined
                        ? undefined
                        : () => {
                            onTurn(place);
                          }
                    }
                  />
                )
              );
            })}
          </Reveal>
        )}
      </div>
      <TurnBand
        icon={
          <span className={shared.tbResources}>
            <ResourcesOptionIcon />
          </span>
        }
        name={nameOf(personId)}
        what={count === 1 ? t('partie.einRohstoff') : t('partie.rohstoffe', { anzahl: count })}
        color={colorOf(session, personId)}
        order={order.map((other) => ({
          personId: other,
          name: nameOf(other),
          color: colorOf(session, other),
        }))}
        currentId={personId}
      />
      {actions}
    </div>
  );
}

type DrawnResourceProps = {
  readonly box: CardBox;
  readonly number: number;
  readonly resource: CatanResource;
  readonly isOpen: boolean;
  readonly onTurn: (() => void) | undefined;
};

// A drawn card on its place with its name below; face down it says "Antippen" and turns over
// when tapped.
function DrawnResource({
  box,
  number,
  resource,
  isOpen,
  onTurn,
}: DrawnResourceProps): React.JSX.Element {
  const card = (
    <TableCard
      box={{ x: 0, y: 0, w: box.w, h: box.h }}
      className={styles.resource}
      isFaceDown={!isOpen}
      front={<ResourceFront resource={resource} />}
    />
  );
  const placeStyle = { left: box.x, top: box.y, width: box.w, height: box.h };
  return (
    <>
      {isOpen || onTurn === undefined ? (
        <div className={styles.cardSpot} style={placeStyle}>
          {card}
        </div>
      ) : (
        <PressableButton
          type="button"
          look="card"
          className={styles.cardSpot}
          style={placeStyle}
          aria-label={t('partie.karteUmdrehen', { nummer: number })}
          onClick={onTurn}
        >
          {card}
        </PressableButton>
      )}
      <span
        className={cx(shared.resName, styles.cardName, !isOpen && styles.cardNameMuted)}
        style={{ left: box.x, top: box.y + box.h + 4, width: box.w }}
      >
        {isOpen ? t(RESOURCE_NAMES[resource]) : t('partie.antippen')}
      </span>
    </>
  );
}
