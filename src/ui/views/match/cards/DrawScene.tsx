import { useRef, useState } from 'react';
import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import type { CatanPersonDraw } from '@/games/catan';
import { t } from '@/i18n/t';
import { HarborsDrawArt, LandscapesDrawArt, NumbersDrawArt } from '@/ui/art/DrawArt';
import { useElementSize } from '@/ui/components/useElementSize';
import { Coin } from '../Coin';
import { DevCard } from '../DevCard';
import { colorOf } from '../matchColors';
import { DRAW_NAMES } from '../matchTexts';
import { drawLayout, TASK_CARD_WIDTH, type DrawLayout } from './cardLayout';
import { StagedCards, type StageHandle } from './StagedCards';
import { placeTarget, planDraw, WHO_AFTER, WHO_BEFORE } from './stagePlan';
import { PersonFront, Place, TableCard } from './TableCard';
import { tableSize } from './tableSize';
import shared from '../MatchView.module.css';
import styles from './Cards.module.css';

function DrawArt({ draw }: { readonly draw: CatanPersonDraw }): React.JSX.Element {
  switch (draw) {
    case 'landscapes':
      return <LandscapesDrawArt />;
    case 'harbors':
      return <HarborsDrawArt />;
    case 'numbers':
      return <NumbersDrawArt />;
  }
}

type DrawSceneProps = {
  readonly session: StoredSession;
  readonly draw: CatanPersonDraw;
  /** The drawn person, `null` before drawing (US-AB-02 AK-3). */
  readonly result: PersonId | null;
  readonly nameOf: (personId: PersonId) => string;
  /**
   * Set while the draw just made is still to be shown with its movement (design I2-E,
   * FA-AB-07); `null` shows the result at rest.
   */
  readonly stage?: StageHandle | null;
};

/**
 * Page 5, a draw of a person with cards (US-LS-02, US-IN-01, design I2-D): the development card
 * of the flow, beside it the place of the drawn person, below the person cards face up. Before
 * drawing the card says "Wer?" and the place is empty; afterwards the card of the drawn person
 * lies on it and the development card names the person (US-LS-02 AK-2).
 */
export function DrawScene({
  session,
  draw,
  result,
  nameOf,
  stage = null,
}: DrawSceneProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const measured = useElementSize(ref);
  const { width, height } = tableSize(measured);
  const isStaging = stage !== null && result !== null;
  const layout = drawLayout(width, height);
  // FA-LS-06: with replacement everyone is in again; the drawn card lies on its place.
  const below = session.setup.participants.filter((personId) => personId !== result);
  const row = layout.row(below.length);
  const resultName = result === null ? '' : nameOf(result);
  const who = (personId: PersonId | null): React.JSX.Element =>
    personId === null ? (
      <span className={shared.who}>
        <span className={styles.unknownCoin} aria-hidden="true">
          {t('partie.fragezeichen')}
        </span>
        <strong className={shared.whoName}>{t('partie.wer')}</strong>
      </span>
    ) : (
      <span className={shared.who}>
        <Coin
          name={nameOf(personId)}
          color={colorOf(session, personId)}
          className={shared.whoCoin}
        />
        <strong className={shared.whoName}>{nameOf(personId)}</strong>
      </span>
    );
  return (
    <div ref={ref} className={styles.table} data-stage-root="">
      <div
        data-solid=""
        className={styles.task}
        style={{
          left: layout.task.x,
          top: layout.task.y,
          transform: `scale(${String(layout.task.width / TASK_CARD_WIDTH)})`,
        }}
      >
        <DevCard
          title={t(DRAW_NAMES[draw])}
          art={<DrawArt draw={draw} />}
          className={styles.taskCard}
          isResult
        >
          {isStaging ? (
            // During the movement both lie on top of each other; the plan fades from one to the other.
            <span className={styles.whoStack}>
              <span data-stage={WHO_BEFORE}>{who(null)}</span>
              <span data-stage={WHO_AFTER}>{who(result)}</span>
            </span>
          ) : (
            who(result)
          )}
          <span className={shared.task}>{t('partie.legtSieAus')}</span>
        </DevCard>
      </div>
      <Place
        box={layout.slot}
        label={t('partie.fragezeichen')}
        isFilled={result !== null && !isStaging}
        stageName={placeTarget(0)}
      />
      {isStaging && measured !== null && (
        <DrawStage
          layout={layout}
          persons={session.setup.participants}
          result={result}
          front={(personId) => (
            <PersonFront name={nameOf(personId)} color={colorOf(session, personId)} />
          )}
          handle={stage}
        />
      )}
      {result !== null && !isStaging && (
        <TableCard
          box={layout.slot}
          z={5}
          front={<PersonFront name={resultName} color={colorOf(session, result)} />}
        />
      )}
      {!isStaging &&
        below.map((personId, index) => {
          const box = row[index];
          return (
            box !== undefined && (
              <TableCard
                key={personId}
                box={box}
                z={10 + index}
                front={<PersonFront name={nameOf(personId)} color={colorOf(session, personId)} />}
              />
            )
          );
        })}
    </div>
  );
}

type DrawStageProps = {
  readonly layout: DrawLayout;
  readonly persons: readonly PersonId[];
  readonly result: PersonId;
  readonly front: (personId: PersonId) => React.ReactNode;
  readonly handle: StageHandle;
};

// The movement of "Losen" (US-IN-01 AK-2, design I2-E), planned once when it starts.
function DrawStage({ layout, persons, result, front, handle }: DrawStageProps): React.JSX.Element {
  const [plan] = useState(() =>
    planDraw({
      persons,
      result,
      rowBefore: layout.row(persons.length),
      rowAfter: layout.row(persons.length - 1),
      slot: layout.slot,
      rng: handle.rng,
    }),
  );
  return (
    <StagedCards
      plan={plan}
      front={(key) => {
        const personId = persons.find((person) => person === key);
        return personId === undefined ? null : front(personId);
      }}
      handle={handle}
    />
  );
}
