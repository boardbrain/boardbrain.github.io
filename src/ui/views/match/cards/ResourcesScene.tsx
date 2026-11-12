import { animate, m, useReducedMotion } from 'motion/react';
import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import { flushSync } from 'react-dom';
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
import { TurnBand } from '../TurnBand';
import { resourcesLayout, type CardBox, type ResourcesLayout } from './cardLayout';
import { StagedCards, type StageHandle } from './StagedCards';
import { labelTarget, placeTarget, planResources } from './stagePlan';
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
  /**
   * Set while the cards just drawn are still to be dealt with their movement (design I2-E,
   * FA-AB-07); `null` shows them at rest.
   */
  readonly stage?: StageHandle | null;
  /** "Alle umdrehen": the cards turn over one after another, 0.09 s apart (design I2-D). */
  readonly isTurningAll?: boolean;
  /** Lets "Weiter" play the leaving of the cards before the next person's page (W3). */
  readonly leaveRef?: Ref<ResourcesLeave> | undefined;
};

/** The cards of a person leaving the table (design I2-E). */
export type ResourcesLeave = {
  /** After "Weiter": into the coin of the person in the band (W3). */
  readonly leave: () => Promise<void>;
  /** Before "Wiederholen" is stored: the cards turn face down, then glide onto the stack. */
  readonly turnBack: () => Promise<void>;
};

// Turning back face down takes as long as turning over by hand (0.34 s).
const TURN_BACK_MS = 340;

// W3 (PO 11.11.2026): the cards fly into the coin of the person in the band, shrinking to its
// size, and fade during the last 15 %; 0.06 s apart. Meanwhile the dashed places fade in where
// they lay and the names below them fade out, so the next person's page looks the same.
const LEAVE = { duration: 0.42, gap: 0.06, ease: [0.4, 0, 0.2, 1] } as const;
const PLACE_IN = 0.2;
const NAMES_OUT = 0.22;
const PLACE_OPACITY = 0.55;

async function playLeave(table: HTMLElement, personId: PersonId): Promise<void> {
  const coin = table.parentElement?.querySelector<HTMLElement>(`[data-band-coin="${personId}"]`);
  const target = coin?.getBoundingClientRect();
  const cards = [...table.querySelectorAll<HTMLElement>('[data-leave-card]')];
  const runs = cards.map((card, index) => {
    const box = card.getBoundingClientRect();
    const scale = target === undefined ? 0.2 : target.width / box.width;
    const x =
      target === undefined ? 0 : target.left + target.width / 2 - (box.left + box.width / 2);
    const y =
      target === undefined ? 80 : target.top + target.height / 2 - (box.top + box.height / 2);
    return animate(
      card,
      { x: [0, x, x], y: [0, y, y], scale: [1, scale, scale], opacity: [1, 1, 0] },
      {
        duration: LEAVE.duration,
        delay: index * LEAVE.gap,
        ease: [...LEAVE.ease],
        times: [0, 0.85, 1],
      },
    );
  });
  const names = [...table.querySelectorAll<HTMLElement>('[data-leave-label]')].map((name) =>
    animate(name, { opacity: [1, 0] }, { duration: NAMES_OUT }),
  );
  const places = [...table.querySelectorAll<HTMLElement>('[data-stage^="place-"]')].map(
    (place, index) =>
      animate(
        place,
        { opacity: [0, PLACE_OPACITY] },
        { duration: PLACE_IN, delay: index * LEAVE.gap + LEAVE.gap * 2 },
      ),
  );
  await Promise.all([...runs, ...names, ...places].map((run) => run.finished));
}

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
  actions,
  ...props
}: ResourcesSceneProps): React.JSX.Element | null {
  const { session, personId, nameOf } = props;
  const options = session.setup.options.startingResources;
  if (options === null) {
    return null;
  }
  const { count } = options;
  const order = orderOrSeats(session);
  // Each person's table starts afresh; the band stays, so it changes with the transitions of the
  // placement: crossfade and the ring gliding to the next coin (PO 12.11.2026).
  return (
    <div className={styles.withBand}>
      <ResourcesTable key={personId} {...props} />
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

// The card table of one person's page.
function ResourcesTable({
  session,
  personId,
  result,
  opened,
  onTurn,
  stage = null,
  isTurningAll = false,
  leaveRef,
}: Omit<ResourcesSceneProps, 'actions'>): React.JSX.Element | null {
  const ref = useRef<HTMLDivElement>(null);
  const [isLeaving, setLeaving] = useState(false);
  const [isTurningBack, setTurningBack] = useState(false);
  // Both only last until the step is stored: after "Wiederholen" the same person's table shows
  // the page before drawing, and the cards dealt next turn over again (PO 12.11.2026).
  if (result === null && (isLeaving || isTurningBack)) {
    setLeaving(false);
    setTurningBack(false);
  }
  const isReduced = useReducedMotion() === true;
  useImperativeHandle(leaveRef, () => ({
    leave: async () => {
      const table = ref.current;
      if (table === null || isReduced) {
        return;
      }
      // The places are drawn once more, now empty but still invisible, so they can fade in.
      flushSync(() => {
        setLeaving(true);
      });
      await playLeave(table, personId);
    },
    turnBack: async () => {
      const table = ref.current;
      if (table === null || isReduced) {
        return;
      }
      flushSync(() => {
        setTurningBack(true);
      });
      for (const name of table.querySelectorAll<HTMLElement>('[data-leave-label]')) {
        void animate(name, { opacity: [1, 0] }, { duration: NAMES_OUT });
      }
      await new Promise((resolve) => {
        setTimeout(resolve, TURN_BACK_MS);
      });
    },
  }));
  const measured = useElementSize(ref);
  const { width, height } = tableSize(measured);
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
  const isStaging = stage !== null && result !== null && measured !== null;
  return (
    <div ref={ref} className={styles.table} data-stage-root="">
      {isStaging && (
        <>
          {layout.slots.map((box, place) => (
            <Place
              key={`place-${String(place)}`}
              box={box}
              label={t('partie.fragezeichen')}
              isFilled={false}
              stageName={placeTarget(place)}
            />
          ))}
          {layout.slots.map((box, place) => (
            <span
              key={`label-${String(place)}`}
              data-stage={labelTarget(place)}
              className={cx(shared.resName, styles.cardName, styles.cardNameMuted)}
              style={{ left: box.x, top: box.y + box.h + 4, width: box.w }}
            >
              {t('partie.antippen')}
            </span>
          ))}
          <ResourcesStage
            layout={layout}
            isFirst={isFirst}
            stackBefore={stackCount}
            isWithReplacement={options.replacement === 'with'}
            handle={stage}
          />
        </>
      )}
      {!isStaging &&
        layout.slots.map((box, place) => (
          <Place
            key={`place-${String(place)}`}
            box={box}
            label={t('partie.fragezeichen')}
            isFilled={result !== null && !isLeaving}
            stageName={isLeaving ? placeTarget(place) : undefined}
            isHidden={isLeaving}
            flipKey={`place:${String(place)}`}
          />
        ))}
      {isStaging
        ? null
        : result === null && isFirst
          ? CATAN_RESOURCES.map((resource, index) => {
              const box = layout.kinds[index];
              return (
                box !== undefined && (
                  <TableCard
                    key={resource}
                    box={box}
                    z={10}
                    flipKey={index < count ? `res:${String(index)}` : undefined}
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
                // The cards of a person drawn again glide onto the top of the stack.
                flipKey={
                  level >= stackCount - count ? `res:${String(stackCount - 1 - level)}` : undefined
                }
                className={styles.resource}
                isFaceDown
              />
            ))}
      {result !== null && !isStaging && (
        <div className={styles.layer}>
          {result.map((resource, place) => {
            const box = layout.slots[place];
            return (
              box !== undefined && (
                <DrawnResource
                  key={`${resource}-${String(place)}`}
                  box={box}
                  number={place + 1}
                  resource={resource}
                  isOpen={opened.includes(place) && !isTurningBack}
                  flipKey={`res:${String(place)}`}
                  turnDelay={isTurningAll ? place * TURN_ALL_GAP : 0}
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
        </div>
      )}
    </div>
  );
}

// "Alle umdrehen": the cards turn over one after another (reference I2-D: 0.09 s apart).
const TURN_ALL_GAP = 0.09;
// Design I2-E: "Antippen" fades out during the first half of the turn, then the name fades in.
const LABEL_OUT_SECONDS = 0.17;
const LABEL_IN_SECONDS = 0.2;

type DrawnResourceProps = {
  readonly box: CardBox;
  readonly number: number;
  readonly resource: CatanResource;
  readonly isOpen: boolean;
  /** Seconds before the card turns over, when all turn over at once. */
  readonly turnDelay: number;
  readonly flipKey: string;
  readonly onTurn: (() => void) | undefined;
};

// A drawn card on its place with its name below; face down it says "Antippen" and turns over
// when tapped.
function DrawnResource({
  box,
  number,
  resource,
  isOpen,
  turnDelay,
  flipKey,
  onTurn,
}: DrawnResourceProps): React.JSX.Element {
  const card = (
    <TableCard
      box={{ x: 0, y: 0, w: box.w, h: box.h }}
      className={styles.resource}
      isFaceDown={!isOpen}
      delay={turnDelay}
      front={<ResourceFront resource={resource} />}
    />
  );
  // Turned back face down (a repetition) the labels change at once.
  const labelOut = isOpen
    ? { duration: LABEL_OUT_SECONDS, ease: 'easeIn' as const, delay: turnDelay }
    : { duration: 0 };
  const labelIn = isOpen
    ? { duration: LABEL_IN_SECONDS, ease: 'easeOut' as const, delay: turnDelay + LABEL_OUT_SECONDS }
    : { duration: 0 };
  const placeStyle = { left: box.x, top: box.y, width: box.w, height: box.h };
  const isLocked = isOpen || onTurn === undefined;
  return (
    <>
      {/* Always the same element, so the card stays the same and turns over when it is opened;
          once open, or where it cannot be turned, it is locked and only shows the card. */}
      <PressableButton
        type="button"
        look="card"
        data-leave-card=""
        data-flip={flipKey}
        className={cx(styles.cardSpot, isLocked && styles.cardSpotLocked)}
        style={placeStyle}
        disabled={isLocked}
        aria-hidden={isLocked ? true : undefined}
        tabIndex={isLocked ? -1 : undefined}
        aria-label={t('partie.karteUmdrehen', { nummer: number })}
        onClick={onTurn}
      >
        {card}
      </PressableButton>
      <span
        data-leave-label=""
        className={cx(shared.resName, styles.cardName, styles.labelStack)}
        style={{ left: box.x, top: box.y + box.h + 4, width: box.w }}
      >
        <m.span
          className={styles.cardNameMuted}
          aria-hidden={isOpen ? true : undefined}
          initial={false}
          animate={{ opacity: isOpen ? 0 : 1 }}
          transition={labelOut}
        >
          {t('partie.antippen')}
        </m.span>
        <m.span
          aria-hidden={isOpen ? undefined : true}
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={labelIn}
        >
          {t(RESOURCE_NAMES[resource])}
        </m.span>
      </span>
    </>
  );
}

type ResourcesStageProps = {
  readonly layout: ResourcesLayout;
  readonly isFirst: boolean;
  readonly stackBefore: number;
  readonly isWithReplacement: boolean;
  readonly handle: StageHandle;
};

// The movement of "Losen" on the starting resources (design I2-E), planned once when it starts.
function ResourcesStage({
  layout,
  isFirst,
  stackBefore,
  isWithReplacement,
  handle,
}: ResourcesStageProps): React.JSX.Element {
  const [plan] = useState(() =>
    planResources({
      kinds: isFirst ? CATAN_RESOURCES : null,
      kindBoxes: layout.kinds,
      stack: layout.stack,
      stackBefore,
      slots: layout.slots,
      isWithReplacement,
      rng: handle.rng,
    }),
  );
  return (
    <StagedCards
      plan={plan}
      className={styles.resource}
      front={(key) => {
        const resource = CATAN_RESOURCES.find((kind) => kind === key);
        return resource === undefined ? null : <ResourceFront resource={resource} />;
      }}
      handle={handle}
    />
  );
}
