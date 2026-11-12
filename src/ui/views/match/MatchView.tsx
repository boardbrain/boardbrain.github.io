import { animate, m, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef, useState, useTransition } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import type { StoredSession } from '@/app/ports';
import { revealedStepIndex, unstagedStepIndex } from '@/core/generation';
import type { PersonId } from '@/core/model';
import {
  catanOpenedResources,
  catanProgress,
  type CatanPhase,
  type CatanSlot,
} from '@/games/catan';
import { t, type TextKey } from '@/i18n/t';
import { useCurrentSession, useGroup, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { cx } from '@/ui/components/classNames';
import { AgainIcon, BackIcon, ChevronIcon, ExitDoorIcon, SkipIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { pieceMarking } from './boardPieces';
import { DrawScene } from './cards/DrawScene';
import { playGlide, snapshotGlide, type GlideSnapshot } from './cards/glide';
import type { StageRun } from './cards/playStage';
import type { StageHandle } from './cards/StagedCards';
import { OrderScene } from './cards/OrderScene';
import { ResourcesScene, type ResourcesLeave } from './cards/ResourcesScene';
import { EndMatchDialog } from './EndMatchDialog';
import { LookBackNote, useLookBackFits } from './LookBackNote';
import { MatchDialog } from './MatchDialog';
import {
  canOfferSkip,
  followingSlot,
  forwardAction,
  isLookBack,
  isSameView,
  nextPage,
  pageAt,
  previousPage,
  progressIndex,
  lookBackTarget,
  shownRange,
  sessionUpTo,
  type FlowPage,
  type ForwardAction,
} from './matchFlow';
import { editionName, repeatLines, stepTitle } from './matchTexts';
import { PieceSpot } from './PieceSpot';
import { PlacementStep } from './PlacementStep';
import { UnsupportedSession } from './UnsupportedSession';
import shared from './Match.module.css';
import styles from './MatchView.module.css';

const PHASE_NAMES: Readonly<Record<CatanPhase, TextKey>> = {
  draws: 'partie.phaseLosen',
  order: 'partie.phaseReihenfolge',
  placement: 'partie.phasePlatzierung',
  resources: 'partie.phaseRohstoffe',
};

const PHASE_OF: Readonly<Record<CatanSlot['kind'], CatanPhase>> = {
  'person-draw': 'draws',
  'order-spin': 'order',
  building: 'placement',
  road: 'placement',
  'starting-resources': 'resources',
};

const STEP_TITLES: Readonly<Record<CatanSlot['kind'], TextKey>> = {
  'person-draw': 'partie.titelLosen',
  'order-spin': 'partie.titelReihenfolge',
  building: 'partie.titelPlatzierung',
  road: 'partie.titelPlatzierung',
  'starting-resources': 'partie.titelStartrohstoffe',
};

const FORWARD_LABELS: Readonly<Record<ForwardAction, TextKey>> = {
  draw: 'partie.losen',
  next: 'partie.weiter',
  overview: 'partie.zurUebersicht',
  browse: 'partie.blaettern',
  'turn-all': 'partie.alleUmdrehen',
};

type Dialog = 'repeat' | 'skip' | 'end' | null;

// "Wiederholen" takes the place of "Überspringen" when a movement ends; for this long after it a
// tap on the button does nothing.
const REPEAT_AFTER_MOVEMENT_MS = 500;
const SHOWN_MOVEMENT_MS = 300;

// Pieces discarded by a repetition rise by 9 px and fade (design I2-E).
const PIECE_RISE = -9;
const PIECE_LEAVE_SECONDS = 0.3;
// A movement before storing is decoration: it never holds up storing for longer than planned.
const MOVEMENT_SLACK_SECONDS = 0.2;

async function atMost(movement: Promise<unknown>, seconds: number): Promise<void> {
  await Promise.race([
    movement,
    new Promise((resolve) => {
      setTimeout(resolve, (seconds + MOVEMENT_SLACK_SECONDS) * 1000);
    }),
  ]);
}

// The steps shown with a movement of cards (design I2-E).
function hasMovement(step: CatanSlot): boolean {
  return (
    step.kind === 'person-draw' || step.kind === 'order-spin' || step.kind === 'starting-resources'
  );
}

// The address of a page: the current page has none, a look back names its step (US-AB-04 AK-3).
function pathOf(page: FlowPage | null, session: StoredSession): string {
  if (page === null) {
    return '/partie/uebersicht';
  }
  const current = pageAt(session, null);
  return page.kind === 'pending' || (current?.kind === 'step' && current.index === page.index)
    ? '/partie'
    : `/partie?schritt=${String(page.index)}`;
}

function isFromStart(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'from' in state && state.from === 'start';
}

// The step number in the address, `null` without one.
function lookBackOf(value: string | null): number | null {
  return value !== null && /^\d+$/.test(value) ? Number(value) : null;
}

/**
 * The flow of a match `#/partie` (US-AB-02, US-AB-03, US-AB-04, US-LS-02, US-LS-03, US-PL-04,
 * US-PL-05, US-SR-01, design I2-C pages 5 to 8 and I2-D): a step without a result before
 * "Losen" (E-35), a drawn step with its stored result, earlier steps in the look back
 * (`#/partie?schritt=N`), the progress in phases, "Wiederholen" and the forward button. The
 * match is read from the database (ADR-029) and changed only through the session service; every
 * result is stored before it is shown (ADR-014).
 */
export function MatchView(): React.JSX.Element | null {
  const { db, session: sessions, rng } = useAppDependencies();
  const current = useCurrentSession(db);
  const persons = usePersons(db);
  const group = useGroup(db, current?.status === 'active' ? current.session.groupId : null);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const location = useLocation();
  const [dialog, setDialog] = useState<Dialog>(null);
  // The step a question about repeating is about (US-AB-03 AK-1, AK-8).
  const [repeatAt, setRepeatAt] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const noteRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // The movement playing, so "Animation überspringen" can complete it (US-IN-04).
  const runRef = useRef<StageRun | null>(null);
  // When the last movement started and ended: a tap meant for "Überspringen" that comes just as
  // the movement ends by itself, or a second tap on it, must not open "Wiederholen" (design I2-E).
  // A movement that jumps to its end at once ("Bewegung reduzieren") showed no "Überspringen".
  const movementStartRef = useRef(-Infinity);
  const movementEndRef = useRef(-Infinity);
  // The cards of the starting resources leave before the next person's page (design I2-E, W3).
  const leaveRef = useRef<ResourcesLeave>(null);
  // "Losen" was tapped on a page without a result: after a repetition of the order its face-down
  // cards are collected first (design I2-E, E1).
  const [isDrawnFromPending, setDrawnFromPending] = useState(false);
  // "Alle umdrehen" turns the cards over one after another (design I2-D).
  const [isTurningAll, setTurningAll] = useState(false);

  const session = current?.status === 'active' ? current.session : null;
  const page = session === null ? null : pageAt(session, lookBackOf(search.get('schritt')));
  // Only once the page is shown (its table is read as well), so the note measures what the page
  // shows (PO 10.11.2026: back from the overview the note stayed over the starting resources).
  const pageKey =
    page === null || group === undefined || group === null ? '' : JSON.stringify(page);
  const isNoteFloating = useLookBackFits(noteRef, bodyRef, pageKey);
  // Design I2-E: after "Wiederholen" in the flow the cards glide from where they lay before. The
  // snapshot is taken before storing; the glide plays once the stored match is shown.
  const glideRef = useRef<{ readonly before: GlideSnapshot; readonly from: unknown } | null>(null);
  const isReduced = useReducedMotion() === true;
  useLayoutEffect(() => {
    const glide = glideRef.current;
    if (glide !== null && glide.from !== session && bodyRef.current !== null) {
      glideRef.current = null;
      playGlide(bodyRef.current, glide.before);
    }
  }, [session]);

  if (current === undefined || persons === undefined) {
    return null;
  }
  if (current.status === 'none') {
    return <Navigate to="/" replace />;
  }
  if (session === null) {
    return <UnsupportedSession />;
  }
  if (page === null) {
    // The overview leads back to where it came from: the start, or else this flow.
    return (
      <Navigate
        to="/partie/uebersicht"
        replace
        state={{ from: isFromStart(location.state) ? 'start' : 'flow' }}
      />
    );
  }
  // Tables are never deleted, so a match always has one; `null` is the result of the query
  // before the match was read and only means "still loading".
  if (group === undefined || group === null) {
    return null;
  }
  const step = page.kind === 'step' ? session.generation.steps[page.index]?.step : undefined;
  const slot: CatanSlot | undefined = page.kind === 'pending' ? page.slot : step;
  if (slot === undefined) {
    return null;
  }
  const nameOf = (personId: PersonId): string =>
    persons.find((person) => person.id === personId)?.name ?? '';
  const revealed = revealedStepIndex(session.generation);
  const forward = forwardAction(session, page);
  const back = previousPage(session, page);
  // A look back shows the match as it was right after its step; a kept view after a repetition
  // shows all its steps (shownRange).
  const shownEnd = page.kind === 'step' ? shownRange(session, page.index).end : null;
  const shown = shownEnd === null ? session : sessionUpTo(session, shownEnd);
  // Only the step just drawn is new; a look back or a kept view shows its whole view as it is.
  const isDrawnNow = page.kind === 'step' && page.index === revealed;
  // FA-AB-07, design I2-E: the step drawn last plays its movement until it is staged, also again
  // after a restart; meanwhile only "Animation überspringen" and "Partie beenden" can be used.
  const unstaged = unstagedStepIndex(session.generation);
  const stagedIndex =
    page.kind === 'step' && page.index === unstaged && step !== undefined && hasMovement(step)
      ? unstaged
      : null;
  const isStaging = stagedIndex !== null;
  const markStaged = (): void => {
    const now = performance.now();
    if (now - movementStartRef.current > SHOWN_MOVEMENT_MS) {
      movementEndRef.current = now;
    }
    if (stagedIndex !== null) {
      startTransition(async () => {
        await sessions.markStaged(stagedIndex);
      });
    }
  };
  const stage: StageHandle | null = isStaging
    ? {
        rng,
        onRun: (run) => {
          if (run !== null && runRef.current === null) {
            movementStartRef.current = performance.now();
          }
          runRef.current = run;
        },
        onDone: markStaged,
      }
    : null;
  const skipMovement = (): void => {
    // US-IN-04 AK-2: the movement jumps to its end; the step still has to be confirmed.
    if (runRef.current === null) {
      markStaged();
    } else {
      runRef.current.complete();
    }
  };

  // The overview reached from here leads back into the flow (PO 10.11.2026: after "Blättern" to
  // the overview, its back button led to the start).
  const go = (target: FlowPage | null): void => {
    void navigate(pathOf(target, session), { replace: true, state: { from: 'flow' } });
  };
  const act = (work: () => Promise<boolean>): void => {
    setDialog(null);
    startTransition(async () => {
      const isRunning = await work();
      await navigate(isRunning ? '/partie/uebersicht' : '/partie', {
        replace: true,
        state: { from: 'flow' },
      });
    });
  };
  const onForward = (): void => {
    if (forward === 'browse') {
      go(nextPage(session, page));
      return;
    }
    act(async () => {
      setTurningAll(forward === 'turn-all');
      if (forward === 'turn-all') {
        if (step?.kind === 'starting-resources') {
          await sessions.openResources(
            step.personId,
            step.result.map((_, index) => index),
          );
        }
        return false;
      }
      if (forward === 'draw') {
        setDrawnFromPending(page.kind === 'pending');
        const drawn = await sessions.draw(revealed ?? null);
        if (!drawn.ok) {
          return false;
        }
        // A step without a movement of its own counts as shown at once (FA-AB-07).
        const index = unstagedStepIndex(drawn.value.generation);
        const record = index === undefined ? undefined : drawn.value.generation.steps[index];
        if (index !== undefined && record !== undefined && !hasMovement(record.step)) {
          await sessions.markStaged(index);
        }
        return drawn.value.generation.state === 'running';
      }
      if (revealed === undefined) {
        return false;
      }
      if (forward === 'next' && step?.kind === 'starting-resources' && isDrawnNow) {
        await leaveRef.current?.leave();
      }
      const confirmed = await sessions.confirm(revealed);
      return confirmed.ok && confirmed.value.generation.state === 'running';
    });
  };

  // Design I2-E: before a repetition is stored, the cards of starting resources turn face down and
  // the pieces discarded on the board rise and fade (0.3 s); then the page glides into the state
  // before drawing. From the overview a new page opens instead, without movement.
  const repeatSoftly = async (index: number): Promise<void> => {
    const body = bodyRef.current;
    if (body === null || isReduced) {
      return;
    }
    const marking = pieceMarking(session, index);
    if (marking !== null) {
      // Only the pieces on the board: the dialog shows them a second time and closes meanwhile,
      // and a movement of a piece taken away would never end (PO 12.11.2026: everything stayed
      // locked after repeating a building).
      const pieces = [marking.main, ...marking.others].flatMap((key) => [
        ...body.querySelectorAll<SVGElement>(`[data-piece="${key}"]`),
      ]);
      await atMost(
        pieces.length === 0
          ? Promise.resolve()
          : animate(
              pieces,
              { opacity: [1, 0], y: [0, PIECE_RISE] },
              { duration: PIECE_LEAVE_SECONDS, ease: 'easeIn' },
            ).finished,
        PIECE_LEAVE_SECONDS,
      );
    }
    if (session.generation.steps[index]?.step.kind === 'starting-resources') {
      await leaveRef.current?.turnBack();
    }
    glideRef.current = { before: snapshotGlide(body), from: session };
  };

  const askRepeat = (index: number): void => {
    if (!isPending) {
      setRepeatAt(index);
      setDialog('repeat');
    }
  };
  const repeatStep = repeatAt === null ? undefined : session.generation.steps[repeatAt]?.step;
  const isPlacement = slot.kind === 'building' || slot.kind === 'road';
  // US-AB-03 AK-8: while the question is open, the piece and those discarded with it are marked.
  const marked =
    dialog === 'repeat' && repeatAt !== null && isPlacement
      ? pieceMarking(session, repeatAt)
      : null;
  const actions = (
    <StepActions
      forward={forward}
      isPending={isPending || isStaging}
      onSkip={isStaging ? skipMovement : null}
      canRepeat={page.kind === 'step'}
      onRepeat={() => {
        if (performance.now() - movementEndRef.current < REPEAT_AFTER_MOVEMENT_MS) {
          return;
        }
        // A whole view repeats its last step, the step just drawn itself (decision A of the PO,
        // I2-H); every other piece can be tapped on the board.
        if (page.kind === 'step') {
          askRepeat(isDrawnNow || shownEnd === null ? page.index : shownEnd);
        }
      }}
      onForward={onForward}
    />
  );
  // On the empty board; it lies over the board, so the board does not move when it goes.
  const skip = canOfferSkip(session, page) && (
    <PressableButton
      type="button"
      className={shared.linkBtn}
      disabled={isPending}
      onClick={() => {
        setDialog('skip');
      }}
    >
      {t('partie.platzierungUeberspringen')}
    </PressableButton>
  );
  // Placement and starting resources bring the buttons below their band.
  const isResources = slot.kind === 'starting-resources';
  const following = shownEnd === null ? null : followingSlot(session, shownEnd);

  return (
    <main
      className={cx(shared.main, shared.fill, isPlacement && styles.placeMain)}
      // The page and what the forward button does; end-to-end tests wait for it to change.
      data-page={`${page.kind === 'step' ? `step-${String(page.index)}` : `next-${String(page.at)}`}:${forward}`}
    >
      <div className={shared.pageHead}>
        {/* On the first step greyed out like "Wiederholen", so the title keeps its place
            (PO 10.11.2026). */}
        <PressableButton
          type="button"
          className={shared.iconBtn}
          aria-label={t('allgemein.zurueck')}
          disabled={back === null || isStaging}
          {...greyedOut(back === null || isStaging, GREY)}
          onClick={() => {
            if (back !== null) {
              go(back);
            }
          }}
        >
          <BackIcon />
        </PressableButton>
        <div className={shared.titles}>
          <h1 className={shared.title}>{t(STEP_TITLES[slot.kind])}</h1>
          <div className={shared.sub}>
            {t('partie.unterzeile', {
              tisch: group.name,
              version: editionName(session.setup.options.edition),
            })}
          </div>
        </div>
        <PressableButton
          type="button"
          className={shared.iconBtn}
          aria-label={t('partie.beenden')}
          title={t('partie.beenden')}
          onClick={() => {
            setDialog('end');
          }}
        >
          <ExitDoorIcon size={20} />
        </PressableButton>
      </div>
      <div className={styles.progWrap}>
        <PhaseProgress session={session} page={page} />
        {isLookBack(session, page) && (
          <LookBackNote
            ref={noteRef}
            isInFlow={!isNoteFloating}
            label={
              lookBackTarget(session, page) === 'overview'
                ? t('partie.zurUebersicht')
                : t('partie.zumAktuellenSchritt')
            }
            onCurrent={() => {
              if (lookBackTarget(session, page) === 'current' || revealed === undefined) {
                go(pageAt(session, null));
                return;
              }
              // Nothing left to draw: confirming the repeated step ends the generation again.
              act(async () => {
                const confirmed = await sessions.confirm(revealed);
                return confirmed.ok && confirmed.value.generation.state === 'running';
              });
            }}
          />
        )}
      </div>
      <div ref={bodyRef} className={styles.stepBody}>
        {slot.kind === 'person-draw' && (
          <DrawScene
            session={shown}
            draw={slot.draw}
            result={step?.kind === 'person-draw' ? step.result : null}
            nameOf={nameOf}
            stage={stage}
          />
        )}
        {slot.kind === 'order-spin' && (
          <OrderScene
            session={shown}
            nameOf={nameOf}
            stage={stage}
            isAfterRepeat={isDrawnFromPending}
          />
        )}
        {isPlacement && (
          <PlacementStep
            session={shown}
            newest={
              isDrawnNow && (step?.kind === 'building' || step?.kind === 'road') ? step : null
            }
            announced={
              page.kind === 'pending'
                ? page.slot
                : following !== null && isSameView(slot.kind, following.kind)
                  ? following
                  : null
            }
            nameOf={nameOf}
            skip={skip}
            actions={actions}
            onRepeatPiece={askRepeat}
            marked={marked}
            boardRef={boardRef}
          />
        )}
        {slot.kind === 'starting-resources' && (
          <ResourcesScene
            // Each person's page starts afresh, also after the cards of the one before left.
            key={slot.personId}
            session={shown}
            personId={slot.personId}
            result={step?.kind === 'starting-resources' ? step.result : null}
            opened={
              step?.kind === 'starting-resources'
                ? catanOpenedResources(session.generation, step.personId)
                : []
            }
            onTurn={
              step?.kind === 'starting-resources' && page.kind === 'step' && page.index === revealed
                ? (index) => {
                    startTransition(async () => {
                      await sessions.openResources(step.personId, [index]);
                    });
                  }
                : undefined
            }
            nameOf={nameOf}
            actions={actions}
            stage={stage}
            isTurningAll={isTurningAll}
            leaveRef={leaveRef}
          />
        )}
      </div>
      {!isPlacement && !isResources && actions}

      {dialog === 'repeat' && repeatAt !== null && repeatStep !== undefined && (
        <MatchDialog
          title={t('partie.wiederholenFrage', { schritt: stepTitle(repeatStep, nameOf) })}
          lines={repeatLinesOrOnly(session, repeatAt)}
          cancelLabel={t('allgemein.abbrechen')}
          confirmLabel={t('partie.wiederholen')}
          onCancel={() => {
            setDialog(null);
          }}
          onConfirm={() => {
            act(async () => {
              await repeatSoftly(repeatAt);
              await sessions.repeatStep(repeatAt);
              return false;
            });
          }}
          focus={
            marked === null
              ? null
              : {
                  target: boardRef,
                  spot: <PieceSpot session={shown} nameOf={nameOf} marked={marked} />,
                }
          }
        />
      )}
      {dialog === 'skip' && (
        <MatchDialog
          title={t('partie.ueberspringenFrage')}
          lines={[
            session.setup.options.startingResources === null
              ? t('partie.ueberspringenFertig')
              : t('partie.ueberspringenRohstoffe'),
          ]}
          cancelLabel={t('allgemein.abbrechen')}
          confirmLabel={t('partie.ueberspringen')}
          onCancel={() => {
            setDialog(null);
          }}
          onConfirm={() => {
            act(async () => {
              const skipped = await sessions.skipPlacement();
              return skipped.ok && skipped.value.generation.state === 'running';
            });
          }}
        />
      )}
      {dialog === 'end' && (
        <EndMatchDialog
          onCancel={() => {
            setDialog(null);
          }}
          onEnd={() => {
            setDialog(null);
            startTransition(async () => {
              await sessions.endWithoutResult();
              await navigate('/', { replace: true });
            });
          }}
        />
      )}
    </main>
  );
}

function repeatLinesOrOnly(session: StoredSession, index: number): string[] {
  const lines = repeatLines(session, index);
  return lines.length > 0 ? lines : [t('partie.nurDieserSchritt')];
}

type PhaseProgressProps = {
  readonly session: StoredSession;
  readonly page: FlowPage;
};

// F2: four phases; each is as wide as its longest possible label, fixed for the whole match. On a
// page without a result, its phase is the current one with the steps before it.
function PhaseProgress({ session, page }: PhaseProgressProps): React.JSX.Element {
  const phases = catanProgress(session.setup, session.generation, progressIndex(session, page)).map(
    (phase) =>
      page.kind === 'pending'
        ? { ...phase, isCurrent: phase.phase === PHASE_OF[page.slot.kind] }
        : phase,
  );
  return (
    <div className={styles.phases} role="list" aria-label={t('partie.fortschritt')}>
      {phases.map(({ phase, total, done, isCurrent, isOff }) => {
        const name = t(PHASE_NAMES[phase]);
        const longest = t('partie.phaseStand', { phase: name, erledigt: total, gesamt: total });
        return (
          <div
            key={phase}
            role="listitem"
            className={cx(styles.phase, isCurrent && styles.phaseNow, isOff && styles.phaseOff)}
            style={{ flex: `${String(longest.length)} 1 0` }}
          >
            <div className={styles.segBar}>
              <span style={{ width: total > 0 ? `${String((100 * done) / total)}%` : '0' }} />
            </div>
            <span>
              {isCurrent
                ? t('partie.phaseStand', { phase: name, erledigt: done, gesamt: total })
                : name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type StepActionsProps = {
  readonly forward: ForwardAction;
  readonly isPending: boolean;
  /**
   * Set while a movement plays: "Wiederholen" gives way to "Überspringen" at the same place and
   * size (US-IN-04, design I2-E U1); `null` otherwise.
   */
  readonly onSkip: (() => void) | null;
  /** Without a result there is nothing to repeat (E-35); the button stays, but disabled. */
  readonly canRepeat: boolean;
  readonly onRepeat: () => void;
  readonly onForward: () => void;
};

// "Wiederholen" and the forward button. "Wiederholen" is always there, so the forward button
// keeps its width when a result appears (PO 09.11.2026).
function StepActions({
  forward,
  isPending,
  onSkip,
  canRepeat,
  onRepeat,
  onForward,
}: StepActionsProps): React.JSX.Element {
  const isRepeatOff = onSkip === null && (isPending || !canRepeat);
  return (
    // The buttons stay in place from page to page, without fading in again (PO 10.11.2026: they
    // twitched with every "Losen").
    <div className={styles.actionsCol}>
      <div className={styles.actions}>
        {/* Both labels lie in the same room, so the button keeps its size (PO 11.11.2026). */}
        <PressableButton
          type="button"
          className={cx(shared.secondary, styles.swapBtn)}
          disabled={isRepeatOff}
          {...greyedOut(isRepeatOff, GREY)}
          aria-label={onSkip === null ? undefined : t('partie.animationUeberspringen')}
          onClick={onSkip ?? onRepeat}
        >
          <SwapLabel isShown={onSkip === null}>
            <AgainIcon size={18} />
            {t('partie.wiederholen')}
          </SwapLabel>
          <SwapLabel isShown={onSkip !== null}>
            <SkipIcon size={18} />
            {t('partie.ueberspringen')}
          </SwapLabel>
        </PressableButton>
        <PressableButton
          type="button"
          className={cx(shared.primary, styles.forward)}
          disabled={isPending}
          {...greyedOut(isPending, GREY_PRIMARY)}
          onClick={onForward}
        >
          <ForwardLabel text={t(FORWARD_LABELS[forward])} />
          <ChevronIcon size={18} />
        </PressableButton>
      </div>
    </div>
  );
}

// Design I2-E A2: a label crossfades in 0.18 s; the old one stays a little longer and the new one
// comes a little sooner, so the button never looks empty (PO 11.11.2026).
const LABEL_IN = { duration: 0.18, ease: [0.1, 0.5, 0.5, 1] } as const;
const LABEL_OUT = { duration: 0.18, ease: [0.5, 0, 0.9, 0.5] } as const;

// Design I2-E: a button turns grey and back softly, in the 0.22 s of its release (PO 11.11.2026);
// the opacities are those of the style sheets.
const GREY = 0.5;
const GREY_PRIMARY = 0.45;

function greyedOut(isOff: boolean, grey: number): { initial: false; animate: { opacity: number } } {
  return { initial: false, animate: { opacity: isOff ? grey : 1 } };
}

type ForwardLabelProps = {
  readonly text: string;
};

// The label of the forward button: a new one crossfades with the old one (A2).
function ForwardLabel({ text }: ForwardLabelProps): React.JSX.Element {
  const [shown, setShown] = useState(text);
  const [old, setOld] = useState<string | null>(null);
  if (text !== shown) {
    setShown(text);
    setOld(shown);
  }
  return (
    <span className={styles.swapBtn}>
      <m.span
        key={text}
        className={styles.swapLabel}
        initial={old === null ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={LABEL_IN}
      >
        {text}
      </m.span>
      {old !== null && (
        <m.span
          key={`old-${old}`}
          className={styles.swapLabel}
          aria-hidden="true"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={LABEL_OUT}
          onAnimationComplete={() => {
            setOld(null);
          }}
        >
          {old}
        </m.span>
      )}
    </span>
  );
}

type SwapLabelProps = {
  readonly isShown: boolean;
  readonly children: React.ReactNode;
};

// One of the labels of a button that changes its label; both take the same room.
function SwapLabel({ isShown, children }: SwapLabelProps): React.JSX.Element {
  return (
    <m.span
      className={styles.swapLabel}
      aria-hidden={isShown ? undefined : true}
      initial={false}
      animate={{ opacity: isShown ? 1 : 0 }}
      transition={isShown ? LABEL_IN : LABEL_OUT}
    >
      {children}
    </m.span>
  );
}
