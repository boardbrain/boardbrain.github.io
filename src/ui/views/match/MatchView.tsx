import { useRef, useState, useTransition } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import type { StoredSession } from '@/app/ports';
import { revealedStepIndex } from '@/core/generation';
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
import { AgainIcon, BackIcon, ChevronIcon, ExitDoorIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { DrawScene } from './cards/DrawScene';
import { OrderScene } from './cards/OrderScene';
import { ResourcesScene } from './cards/ResourcesScene';
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
  isKeptView,
  lookBackTarget,
  shownRange,
  sessionUpTo,
  type FlowPage,
  type ForwardAction,
} from './matchFlow';
import { editionName, repeatLines, stepTitle } from './matchTexts';
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
  const { db, session: sessions } = useAppDependencies();
  const current = useCurrentSession(db);
  const persons = usePersons(db);
  const group = useGroup(db, current?.status === 'active' ? current.session.groupId : null);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const location = useLocation();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [isPending, startTransition] = useTransition();
  const noteRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const session = current?.status === 'active' ? current.session : null;
  const page = session === null ? null : pageAt(session, lookBackOf(search.get('schritt')));
  const pageKey = page === null ? '' : JSON.stringify(page);
  const isNoteFloating = useLookBackFits(noteRef, bodyRef, pageKey);

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
  const isKept = isKeptView(session, page);

  const go = (target: FlowPage | null): void => {
    void navigate(pathOf(target, session), { replace: true });
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
        const drawn = await sessions.draw(revealed ?? null);
        return drawn.ok && drawn.value.generation.state === 'running';
      }
      if (revealed === undefined) {
        return false;
      }
      const confirmed = await sessions.confirm(revealed);
      return confirmed.ok && confirmed.value.generation.state === 'running';
    });
  };

  const isPlacement = slot.kind === 'building' || slot.kind === 'road';
  const actions = (
    <StepActions
      forward={forward}
      isPending={isPending}
      canRepeat={page.kind === 'step' && !(isKept && shownEnd !== page.index)}
      onRepeat={() => {
        setDialog('repeat');
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
      className={cx(
        shared.main,
        shared.fill,
        isPlacement && shared.wideMain,
        // In portrait as wide as the placement, so its band does not move (PO 09.11.2026).
        isResources && styles.resourcesMain,
        isPlacement && styles.placeMain,
      )}
      // The page and what the forward button does; end-to-end tests wait for it to change.
      data-page={`${page.kind === 'step' ? `step-${String(page.index)}` : `next-${String(page.at)}`}:${forward}`}
    >
      <div className={shared.pageHead}>
        {back === null ? (
          // Keeps the title in its place on the first step (PO 09.11.2026).
          <span className={shared.iconSpace} aria-hidden="true" />
        ) : (
          <PressableButton
            type="button"
            className={shared.iconBtn}
            aria-label={t('allgemein.zurueck')}
            onClick={() => {
              go(back);
            }}
          >
            <BackIcon />
          </PressableButton>
        )}
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
          />
        )}
        {slot.kind === 'order-spin' && <OrderScene session={shown} nameOf={nameOf} />}
        {isPlacement && (
          <PlacementStep
            session={shown}
            newest={!isKept && (step?.kind === 'building' || step?.kind === 'road') ? step : null}
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
          />
        )}
        {slot.kind === 'starting-resources' && (
          <ResourcesScene
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
          />
        )}
      </div>
      {!isPlacement && !isResources && actions}

      {dialog === 'repeat' && step !== undefined && page.kind === 'step' && (
        <MatchDialog
          title={t('partie.wiederholenFrage', { schritt: stepTitle(step, nameOf) })}
          lines={repeatLinesOrOnly(session, page.index)}
          cancelLabel={t('allgemein.abbrechen')}
          confirmLabel={t('partie.wiederholen')}
          onCancel={() => {
            setDialog(null);
          }}
          onConfirm={() => {
            act(async () => {
              await sessions.repeatStep(page.index);
              return false;
            });
          }}
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
  const stepIndex = page.kind === 'step' ? page.index : page.at - 1;
  const phases = catanProgress(session.setup, session.generation, stepIndex).map((phase) =>
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
  canRepeat,
  onRepeat,
  onForward,
}: StepActionsProps): React.JSX.Element {
  return (
    // The buttons stay in place from page to page, without fading in again (PO 10.11.2026: they
    // twitched with every "Losen").
    <div className={styles.actionsCol}>
      <div className={styles.actions}>
        <PressableButton
          type="button"
          className={shared.secondary}
          disabled={isPending || !canRepeat}
          onClick={onRepeat}
        >
          <AgainIcon size={18} />
          {t('partie.wiederholen')}
        </PressableButton>
        <PressableButton
          type="button"
          className={cx(shared.primary, styles.forward)}
          disabled={isPending}
          onClick={onForward}
        >
          {t(FORWARD_LABELS[forward])}
          <ChevronIcon size={18} />
        </PressableButton>
      </div>
    </div>
  );
}
