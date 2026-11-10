import { useId, useState, useTransition, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import type { PersonId } from '@/core/model';
import { CATAN_BOARD, catanSummary, type CatanStep } from '@/games/catan';
import { t } from '@/i18n/t';
import { useCurrentSession, useGroup, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { Board } from '@/ui/board/Board';
import { PieceMark } from '@/ui/board/PieceMark';
import { AgainIcon, BackIcon, ExitDoorIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { Coin } from './Coin';
import { DrawSymbol } from './DrawSymbol';
import { EndMatchDialog } from './EndMatchDialog';
import { MatchDialog } from './MatchDialog';
import { colorOf } from './matchColors';
import { orderOrSeats, stepIndexWhere } from './matchFlow';
import { DRAW_NAMES, editionName, repeatLines, stepTitle } from './matchTexts';
import { ResourceIcon } from './ResourceIcon';
import { UnsupportedSession } from './UnsupportedSession';
import shared from './Match.module.css';
import styles from './MatchOverviewView.module.css';
import { cx } from '@/ui/components/classNames';

type Tab = 'board' | 'list';

// Where the overview was opened from: the flow (after its last step, state `{ from: 'flow' }`)
// or the start. "Zurück" leads there (design I2-D, page 9).
function isFromFlow(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'from' in state && state.from === 'flow';
}

/**
 * Overview of the running match `#/partie/uebersicht` (US-AB-04 AK-1, US-AB-03 AK-6, US-AB-06
 * AK-3, design I2-C page 9, T1, G2, N1, and I2-D): tabs "Brett" and "Ergebnisse" and "Partie
 * beenden ohne Ergebnis". Tapping a row or a piece asks before repeating it; the warning names
 * what is discarded (US-AB-03 AK-2). The flow then shows the step without a result.
 */
export function MatchOverviewView(): React.JSX.Element | null {
  const { db, session: sessions } = useAppDependencies();
  const current = useCurrentSession(db);
  const persons = usePersons(db);
  const group = useGroup(db, current?.status === 'active' ? current.session.groupId : null);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('board');
  const [isAskingEnd, setAskingEnd] = useState(false);
  const [repeating, setRepeating] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const location = useLocation();

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
  if (session.generation.state !== 'running') {
    return <Navigate to="/partie" replace />;
  }
  // Tables are never deleted, so a match always has one; `null` is the result of the query
  // before the match was read and only means "still loading".
  if (group === undefined || group === null) {
    return null;
  }
  const nameOf = (personId: PersonId): string =>
    persons.find((person) => person.id === personId)?.name ?? '';
  const summary = catanSummary(session.setup, session.generation);
  const order = orderOrSeats(session);
  const hasOrder = summary.order !== null;
  const vertexOf = new Map(summary.buildings.map((building) => [building.index, building.vertex]));
  const indexOf = (matches: (step: CatanStep) => boolean): number | null =>
    stepIndexWhere(session, matches);
  const repeatStep = repeating === null ? undefined : session.generation.steps[repeating]?.step;
  const steps = session.generation.steps;
  const lastStep = steps.length - 1;

  const board = summary.placementSkipped ? (
    <div className={styles.skippedBox}>
      <strong>
        {hasOrder ? t('partie.platzierungUebersprungen') : t('partie.ohnePlatzierung')}
      </strong>
      <span className={cx(shared.muted, shared.small)}>
        {hasOrder ? t('partie.selbstSetzen') : t('partie.ohnePlatzierungText')}
      </span>
    </div>
  ) : (
    <div className={styles.ovBoard}>
      <Board
        board={CATAN_BOARD}
        label={t('partie.brett', {
          gebaeude: summary.buildings.length,
          strassen: summary.roads.length,
        })}
        buildings={summary.buildings.map((building) => ({
          key: `building-${String(building.index)}`,
          vertex: building.vertex,
          type: building.type,
          color: building.catanColor,
        }))}
        roads={summary.roads.flatMap((road) => {
          const from = vertexOf.get(road.index);
          return from === undefined
            ? []
            : [
                {
                  key: `road-${String(road.index)}`,
                  edge: road.edge,
                  from,
                  color: road.catanColor,
                },
              ];
        })}
      />
    </div>
  );

  const results = (
    <>
      {summary.personDraws.length > 0 && (
        <ResultSection title={t('partie.aufbau')}>
          <div className={styles.lines}>
            {summary.personDraws.map((line) => (
              <RepeatLine
                key={line.draw}
                index={indexOf((step) => step.kind === 'person-draw' && step.draw === line.draw)}
                onRepeat={setRepeating}
              >
                <span className={styles.drawIcon}>
                  <DrawSymbol draw={line.draw} />
                </span>
                <span className={styles.lbl}>{t(DRAW_NAMES[line.draw])}</span>
                <span className={styles.who}>
                  <Coin name={nameOf(line.personId)} color={colorOf(session, line.personId)} />
                  <strong className={styles.ellipsis}>{nameOf(line.personId)}</strong>
                </span>
              </RepeatLine>
            ))}
          </div>
        </ResultSection>
      )}
      <ResultSection title={hasOrder ? t('partie.reihenfolge') : t('partie.personenAmTisch')}>
        <div className={styles.lines}>
          {order.map((personId, place) => (
            // US-AB-03 AK-5: a spin draws the whole order again; the last place has no spin.
            <RepeatLine
              key={personId}
              index={indexOf((step) => step.kind === 'order-spin' && step.position === place)}
              onRepeat={setRepeating}
            >
              <span className={styles.lead}>
                {hasOrder && <b className={styles.place}>{place + 1}</b>}
                <Coin name={nameOf(personId)} color={colorOf(session, personId)} />
              </span>
              <span className={styles.lbl}>
                <strong>{nameOf(personId)}</strong>
              </span>
            </RepeatLine>
          ))}
        </div>
      </ResultSection>
      {summary.startingResources.length > 0 && (
        <ResultSection title={t('partie.startrohstoffe')}>
          <div className={styles.lines}>
            {summary.startingResources.map((line) => (
              <RepeatLine
                key={line.personId}
                index={indexOf(
                  (step) => step.kind === 'starting-resources' && step.personId === line.personId,
                )}
                onRepeat={setRepeating}
              >
                <span className={styles.resInline}>
                  {line.resources.map((resource, position) => (
                    <ResourceIcon
                      key={`${resource}-${String(position)}`}
                      resource={resource}
                      size={26}
                    />
                  ))}
                </span>
                <span className={styles.lbl}>
                  <strong>{nameOf(line.personId)}</strong>
                </span>
              </RepeatLine>
            ))}
          </div>
        </ResultSection>
      )}
      <ResultSection title={t('partie.gebaeudeUndStrassen')}>
        <div className={styles.lines}>
          {summary.placementSkipped ? (
            <div className={styles.line}>
              <span className={cx(styles.lbl, shared.muted)}>{t('partie.uebersprungen')}</span>
            </div>
          ) : (
            order.map((personId) => (
              <div key={personId} className={styles.line}>
                <Coin name={nameOf(personId)} color={colorOf(session, personId)} />
                <span className={styles.lbl}>
                  <strong>{nameOf(personId)}</strong>
                </span>
                <span className={styles.pieceBtns}>
                  {summary.buildings
                    .filter((building) => building.personId === personId)
                    .flatMap((building) => {
                      const buildingAt = indexOf(
                        (step) => step.kind === 'building' && step.index === building.index,
                      );
                      const roadAt = indexOf(
                        (step) => step.kind === 'road' && step.index === building.index,
                      );
                      const buildingStep =
                        buildingAt === null ? undefined : steps[buildingAt]?.step;
                      const roadStep = roadAt === null ? undefined : steps[roadAt]?.step;
                      return [
                        <PieceButton
                          key={`b-${building.vertex}`}
                          index={buildingAt}
                          label={
                            buildingStep === undefined
                              ? ''
                              : t('partie.stueckWiederholen', {
                                  stueck: stepTitle(buildingStep, nameOf),
                                })
                          }
                          onRepeat={setRepeating}
                        >
                          <PieceMark
                            kind={building.type}
                            color={building.catanColor}
                            size={16}
                            box="fit"
                          />
                        </PieceButton>,
                        <PieceButton
                          key={`r-${building.vertex}`}
                          index={roadAt}
                          label={
                            roadStep === undefined
                              ? ''
                              : t('partie.stueckWiederholen', {
                                  stueck: stepTitle(roadStep, nameOf),
                                })
                          }
                          onRepeat={setRepeating}
                        >
                          <PieceMark kind="road" color={building.catanColor} size={16} box="fit" />
                        </PieceButton>,
                      ];
                    })}
                </span>
              </div>
            ))
          )}
        </div>
      </ResultSection>
    </>
  );

  return (
    <main
      className={cx(
        shared.main,
        tab === 'board' && shared.fill,
        tab === 'board' && styles.boardTab,
      )}
    >
      <div className={shared.pageHead}>
        <PressableButton
          type="button"
          className={shared.iconBtn}
          aria-label={t('allgemein.zurueck')}
          onClick={() =>
            void (isFromFlow(location.state)
              ? navigate(`/partie?schritt=${String(lastStep)}`, { replace: true })
              : navigate('/'))
          }
        >
          <BackIcon />
        </PressableButton>
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('partie.laufendePartie')}</h1>
          <div className={shared.sub}>
            {t('partie.uebersichtUnterzeile', {
              tisch: group.name,
              version: editionName(session.setup.options.edition),
              modus: t('partie.standard'),
            })}
          </div>
        </div>
      </div>
      <div className={styles.tabs} role="tablist">
        <PressableButton
          type="button"
          role="tab"
          aria-selected={tab === 'board'}
          onClick={() => {
            setTab('board');
          }}
        >
          {t('partie.reiterBrett')}
        </PressableButton>
        <PressableButton
          type="button"
          role="tab"
          aria-selected={tab === 'list'}
          onClick={() => {
            setTab('list');
          }}
        >
          {t('partie.reiterErgebnisse')}
        </PressableButton>
      </div>
      {tab === 'board' ? (
        <>
          {board}
          {!summary.placementSkipped && (
            <div className={styles.ovNames}>
              {order.map((personId, place) => (
                <span key={personId} className={styles.ovName}>
                  <b className={styles.place}>{place + 1}</b>
                  <Coin
                    name={nameOf(personId)}
                    color={colorOf(session, personId)}
                    className={styles.smallCoin}
                  />
                  <span className={styles.nm}>{nameOf(personId)}</span>
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        results
      )}
      <div className={styles.ovEnd}>
        <PressableButton
          type="button"
          className={shared.pill}
          onClick={() => {
            setAskingEnd(true);
          }}
        >
          <ExitDoorIcon size={14} />
          {t('partie.beenden')}
        </PressableButton>
      </div>
      {repeating !== null && repeatStep !== undefined && (
        <MatchDialog
          title={t('partie.wiederholenFrage', { schritt: stepTitle(repeatStep, nameOf) })}
          lines={repeatLinesOrOnly(session, repeating)}
          cancelLabel={t('allgemein.abbrechen')}
          confirmLabel={t('partie.wiederholen')}
          onCancel={() => {
            setRepeating(null);
          }}
          onConfirm={() => {
            const index = repeating;
            setRepeating(null);
            startTransition(async () => {
              await sessions.repeatStep(index);
              await navigate('/partie', { replace: true });
            });
          }}
        />
      )}
      {isAskingEnd && (
        <EndMatchDialog
          onCancel={() => {
            setAskingEnd(false);
          }}
          onEnd={() => {
            setAskingEnd(false);
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

function repeatLinesOrOnly(session: Parameters<typeof repeatLines>[0], index: number): string[] {
  const lines = repeatLines(session, index);
  return lines.length > 0 ? lines : [t('partie.nurDieserSchritt')];
}

type RepeatLineProps = {
  /** The step of the row; `null` for a row without a step of its own, e.g. the last place. */
  readonly index: number | null;
  readonly onRepeat: (index: number) => void;
  readonly children: ReactNode;
};

// A row of the results: tapping it asks before repeating its step (US-AB-03 AK-6).
function RepeatLine({ index, onRepeat, children }: RepeatLineProps): React.JSX.Element {
  if (index === null) {
    return <div className={styles.line}>{children}</div>;
  }
  return (
    <PressableButton
      type="button"
      className={styles.line}
      onClick={() => {
        onRepeat(index);
      }}
    >
      {children}
      <span className={styles.again}>
        <AgainIcon size={18} />
      </span>
    </PressableButton>
  );
}

type PieceButtonProps = {
  readonly index: number | null;
  readonly label: string;
  readonly onRepeat: (index: number) => void;
  readonly children: ReactNode;
};

// A piece of the placement (G2): tapping it asks before repeating it.
function PieceButton({ index, label, onRepeat, children }: PieceButtonProps): React.JSX.Element {
  if (index === null) {
    return <span className={styles.pieceBtn}>{children}</span>;
  }
  return (
    <PressableButton
      type="button"
      className={styles.pieceBtn}
      aria-label={label}
      onClick={() => {
        onRepeat(index);
      }}
    >
      {children}
      <span className={styles.pbAgain}>
        <AgainIcon size={11} />
      </span>
    </PressableButton>
  );
}

// A section of the results, named by its heading.
function ResultSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): React.JSX.Element {
  const id = useId();
  return (
    <section className={shared.section} aria-labelledby={id}>
      <h2 id={id} className={shared.sectionTitle}>
        {title}
      </h2>
      {children}
    </section>
  );
}
