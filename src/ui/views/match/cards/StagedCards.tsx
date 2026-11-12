import { useReducedMotion } from 'motion/react';
import { useEffectEvent, useLayoutEffect, useRef, type ReactNode } from 'react';
import type { RandomSource } from '@/core/random';
import { cx } from '@/ui/components/classNames';
import { CardBack } from './CardBack';
import { playStage, type StageRun } from './playStage';
import type { StagePlan } from './stagePlan';
import { FittedFront } from './TableCard';
import styles from './Cards.module.css';

/**
 * What a scene needs to play a movement (design I2-E): the decorative chance, and where to
 * report that the movement runs and that it is over.
 */
export type StageHandle = {
  readonly rng: RandomSource;
  /** Called with the running movement, so "Animation überspringen" can complete it. */
  readonly onRun: (run: StageRun | null) => void;
  /** Called once the movement has ended or was skipped (FA-AB-07). */
  readonly onDone: () => void;
};

type StagedCardsProps = {
  readonly plan: StagePlan;
  /** Draws the front with key `front`, e.g. a person card. */
  readonly front: (front: string) => ReactNode;
  readonly className?: string | undefined;
  /** The fronts bring their own frame and shadow, e.g. order cards (as `TableCard`). */
  readonly isBareFront?: boolean;
  /** Elements of the scene the plan fades, e.g. the dashed places; they move with the cards. */
  readonly children?: ReactNode;
  readonly handle: StageHandle;
};

/**
 * The cards of a movement (design I2-E): every card with its fronts and the back R1, laid onto
 * its start and moved by `playStage` (Motion values, not React state per frame). Starting the
 * movement is an effect, as it drives an external system, the animations of the browser. Once
 * it has ended, the scene shows its resting state again.
 */
export function StagedCards({
  plan,
  front,
  className,
  isBareFront = false,
  children,
  handle,
}: StagedCardsProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  // "Bewegung reduzieren" in the system: the cards go straight to their end (Architecture 13.6).
  const isReduced = useReducedMotion() === true;
  // The plan is fixed for the life of this component; the movement starts once.
  const start = useEffectEvent((root: HTMLElement) => {
    const run = playStage(root, plan);
    if (isReduced) {
      run.complete();
    }
    return run;
  });
  const report = useEffectEvent((run: StageRun | null) => {
    handle.onRun(run);
  });
  const finish = useEffectEvent(() => {
    handle.onDone();
  });
  useLayoutEffect(() => {
    // The whole scene: the plan also fades its places and the name on the development card.
    const root = ref.current?.closest<HTMLElement>('[data-stage-root]') ?? ref.current;
    if (root === null) {
      return undefined;
    }
    const run = start(root);
    let isOver = false;
    report(run);
    run.finished.then(
      () => {
        if (!isOver) {
          isOver = true;
          report(null);
          finish();
        }
      },
      // A movement stopped because the page closed has nothing more to report.
      () => undefined,
    );
    return () => {
      isOver = true;
      run.stop();
      report(null);
    };
  }, []);
  return (
    <div ref={ref} className={styles.layer}>
      {children}
      {plan.cards.map((card) => (
        <div
          key={card.id}
          data-solid=""
          data-stage-card={card.id}
          data-stage={card.id}
          className={cx(styles.card, styles.stageCard, className)}
          style={{ width: card.w, height: card.h }}
        >
          <div data-stage-inner="" className={styles.inner}>
            {card.fronts.map((key) => (
              <div
                key={key}
                data-stage-face={key}
                className={cx(styles.front, isBareFront && styles.bareFront)}
              >
                <FittedFront w={card.w} h={card.h}>
                  {front(key)}
                </FittedFront>
              </div>
            ))}
            <div data-stage-face="back" className={styles.back}>
              <CardBack />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
