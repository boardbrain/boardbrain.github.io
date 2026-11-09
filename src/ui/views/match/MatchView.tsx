import { useState, useTransition } from 'react';
import { Navigate, useNavigate } from 'react-router';
import type { StoredSession } from '@/app/ports';
import { revealedStepIndex } from '@/core/generation';
import type { PersonId } from '@/core/model';
import { catanProgress, type CatanPhase, type CatanStep } from '@/games/catan';
import { t, type TextKey } from '@/i18n/t';
import { useCurrentSession, useGroup, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { AgainIcon, ChevronIcon, ExitDoorIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { DrawStep } from './DrawStep';
import { EndMatchDialog } from './EndMatchDialog';
import { MatchDialog } from './MatchDialog';
import { canOfferSkip, forwardAction, shownStepIndex } from './matchFlow';
import { editionName, repeatLines, stepTitle } from './matchTexts';
import { OrderStep } from './OrderStep';
import { PlacementStep } from './PlacementStep';
import { ResourcesStep } from './ResourcesStep';
import { Reveal } from './Reveal';
import { UnsupportedSession } from './UnsupportedSession';
import shared from './Match.module.css';
import styles from './MatchView.module.css';
import { cx } from '@/ui/components/classNames';

const PHASE_NAMES: Readonly<Record<CatanPhase, TextKey>> = {
  draws: 'partie.phaseLosen',
  order: 'partie.phaseReihenfolge',
  placement: 'partie.phasePlatzierung',
  resources: 'partie.phaseRohstoffe',
};

const STEP_TITLES: Readonly<Record<CatanStep['kind'], TextKey>> = {
  'person-draw': 'partie.titelLosen',
  'order-spin': 'partie.titelReihenfolge',
  building: 'partie.titelPlatzierung',
  road: 'partie.titelPlatzierung',
  'starting-resources': 'partie.titelStartrohstoffe',
};

type Dialog = 'repeat' | 'skip' | 'end' | null;

/**
 * The flow of a match `#/partie` (US-AB-02, US-LS-02, US-LS-03, US-PL-04, US-PL-05, US-SR-01,
 * design I2-C pages 5 to 8): the current step with its stored result, the progress in phases,
 * "Wiederholen" and the forward button. The match is read from the database (ADR-029) and
 * changed only through the session service; every result is stored before it is shown
 * (ADR-014).
 */
export function MatchView(): React.JSX.Element | null {
  const { db, session: sessions } = useAppDependencies();
  const current = useCurrentSession(db);
  const persons = usePersons(db);
  const group = useGroup(db, current?.status === 'active' ? current.session.groupId : null);
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [isPending, startTransition] = useTransition();

  if (current === undefined || persons === undefined) {
    return null;
  }
  if (current.status === 'none') {
    return <Navigate to="/" replace />;
  }
  if (current.status === 'unsupported') {
    return <UnsupportedSession />;
  }
  const { session } = current;
  const index = shownStepIndex(session);
  if (session.generation.state === 'running' || index === null) {
    return <Navigate to="/partie/uebersicht" replace />;
  }
  // Tables are never deleted, so a match always has one; `null` is the result of the query
  // before the match was read and only means "still loading".
  if (group === undefined || group === null) {
    return null;
  }
  const record = session.generation.steps[index];
  if (record === undefined) {
    return null;
  }
  const { step } = record;
  const nameOf = (personId: PersonId): string =>
    persons.find((person) => person.id === personId)?.name ?? '';

  const act = (work: () => Promise<boolean>): void => {
    setDialog(null);
    startTransition(async () => {
      if (await work()) {
        await navigate('/partie/uebersicht', { replace: true });
      }
    });
  };
  const forward = forwardAction(session);
  const isPlacement = step.kind === 'building' || step.kind === 'road';
  // A new key per result starts its fade-in, also after a restart (US-AB-05 AK-3).
  const revealKey = `${String(index)}:${JSON.stringify(step)}`;

  const actions = (
    <StepActions
      key={revealKey}
      forward={forward}
      isPending={isPending}
      canSkip={canOfferSkip(session)}
      onSkip={() => {
        setDialog('skip');
      }}
      onRepeat={() => {
        setDialog('repeat');
      }}
      onForward={() => {
        act(async () => {
          // Reworked with the pages without a result (I2-D, US-AB-02 AK-3).
          const revealed = revealedStepIndex(session.generation) ?? null;
          const advanced =
            forward === 'overview' && revealed !== null
              ? await sessions.confirm(revealed)
              : await sessions.draw(revealed);
          return advanced.ok && advanced.value.generation.state === 'running';
        });
      }}
    />
  );

  return (
    <main
      className={cx(
        shared.main,
        shared.fill,
        isPlacement && shared.wideMain,
        isPlacement && styles.placeMain,
      )}
    >
      <div className={shared.pageHead}>
        <div className={shared.titles}>
          <h1 className={shared.title}>{t(STEP_TITLES[step.kind])}</h1>
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
        <PhaseProgress session={session} stepIndex={index} />
      </div>
      <div className={styles.stepBody}>
        {step.kind === 'person-draw' && (
          <DrawStep key={revealKey} session={session} step={step} nameOf={nameOf} />
        )}
        {step.kind === 'order-spin' && (
          <OrderStep key={revealKey} session={session} step={step} nameOf={nameOf} />
        )}
        {isPlacement && (
          <PlacementStep
            key={revealKey}
            session={session}
            stepIndex={index}
            nameOf={nameOf}
            actions={actions}
          />
        )}
        {step.kind === 'starting-resources' && (
          <ResourcesStep key={revealKey} session={session} step={step} nameOf={nameOf} />
        )}
      </div>
      {!isPlacement && actions}

      {dialog === 'repeat' && (
        <MatchDialog
          title={t('partie.wiederholenFrage', { schritt: stepTitle(step, nameOf) })}
          lines={repeatLinesOrOnly(session, index)}
          cancelLabel={t('allgemein.abbrechen')}
          confirmLabel={t('partie.wiederholen')}
          onCancel={() => {
            setDialog(null);
          }}
          onConfirm={() => {
            act(async () => {
              await sessions.repeatStep(index);
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
  readonly stepIndex: number;
};

// F2: four phases; each is as wide as its longest possible label, fixed for the whole match.
function PhaseProgress({ session, stepIndex }: PhaseProgressProps): React.JSX.Element {
  const phases = catanProgress(session.setup, session.generation, stepIndex);
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
  readonly forward: 'draw' | 'overview';
  readonly isPending: boolean;
  readonly canSkip: boolean;
  readonly onSkip: () => void;
  readonly onRepeat: () => void;
  readonly onForward: () => void;
};

// "Wiederholen" and the forward button; extra links sit above them, so they never move.
function StepActions({
  forward,
  isPending,
  canSkip,
  onSkip,
  onRepeat,
  onForward,
}: StepActionsProps): React.JSX.Element {
  return (
    <Reveal className={styles.actionsCol}>
      {canSkip && (
        <PressableButton
          type="button"
          className={shared.linkBtn}
          disabled={isPending}
          onClick={onSkip}
        >
          {t('partie.platzierungUeberspringen')}
        </PressableButton>
      )}
      <div className={styles.actions}>
        <PressableButton
          type="button"
          className={shared.secondary}
          disabled={isPending}
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
          {forward === 'draw' ? t('partie.losen') : t('partie.zurUebersicht')}
          <ChevronIcon size={18} />
        </PressableButton>
      </div>
    </Reveal>
  );
}
