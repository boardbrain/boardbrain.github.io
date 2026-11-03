import { useState, useTransition } from 'react';
import { Navigate, useNavigate } from 'react-router';
import type { PersonId } from '@/core/model';
import { CATAN_BOARD, catanSummary } from '@/games/catan';
import { t } from '@/i18n/t';
import { useCurrentSession, useGroup, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { Board } from '@/ui/board/Board';
import { PieceMark } from '@/ui/board/PieceMark';
import { BackIcon, ExitDoorIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { Coin } from './Coin';
import { DrawSymbol } from './DrawSymbol';
import { EndMatchDialog } from './EndMatchDialog';
import { colorOf } from './matchColors';
import { orderOrSeats } from './matchFlow';
import { DRAW_NAMES, editionName } from './matchTexts';
import { ResourceIcon } from './ResourceIcon';
import { UnsupportedSession } from './UnsupportedSession';
import shared from './Match.module.css';
import styles from './MatchOverviewView.module.css';
import { cx } from '@/ui/components/classNames';

type Tab = 'board' | 'list';

/**
 * Overview of the running match `#/partie/uebersicht` (US-AB-04 AK-1, US-AB-06 AK-3, design
 * I2-C page 9, T1, G2, N1): tabs "Brett" and "Ergebnisse" and "Partie beenden ohne Ergebnis".
 * In I2-C it only shows; repeating from here and the look back come with I2-D.
 */
export function MatchOverviewView(): React.JSX.Element | null {
  const { db, session: sessions } = useAppDependencies();
  const current = useCurrentSession(db);
  const persons = usePersons(db);
  const group = useGroup(db, current?.status === 'active' ? current.session.groupId : null);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('board');
  const [isAskingEnd, setAskingEnd] = useState(false);
  const [, startTransition] = useTransition();

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
        <section className={shared.section}>
          <h2 className={shared.sectionTitle}>{t('partie.aufbau')}</h2>
          <div className={styles.lines}>
            {summary.personDraws.map((line) => (
              <div key={line.draw} className={styles.line}>
                <span className={styles.drawIcon}>
                  <DrawSymbol draw={line.draw} />
                </span>
                <span className={styles.lbl}>{t(DRAW_NAMES[line.draw])}</span>
                <span className={styles.who}>
                  <Coin name={nameOf(line.personId)} color={colorOf(session, line.personId)} />
                  <strong className={styles.ellipsis}>{nameOf(line.personId)}</strong>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className={shared.section}>
        <h2 className={shared.sectionTitle}>
          {hasOrder ? t('partie.reihenfolge') : t('partie.personenAmTisch')}
        </h2>
        <div className={styles.lines}>
          {order.map((personId, place) => (
            <div key={personId} className={styles.line}>
              <span className={styles.lead}>
                {hasOrder && <b className={styles.place}>{place + 1}</b>}
                <Coin name={nameOf(personId)} color={colorOf(session, personId)} />
              </span>
              <span className={styles.lbl}>
                <strong>{nameOf(personId)}</strong>
              </span>
            </div>
          ))}
        </div>
      </section>
      {summary.startingResources.length > 0 && (
        <section className={shared.section}>
          <h2 className={shared.sectionTitle}>{t('partie.startrohstoffe')}</h2>
          <div className={styles.lines}>
            {summary.startingResources.map((line) => (
              <div key={line.personId} className={styles.line}>
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
              </div>
            ))}
          </div>
        </section>
      )}
      <section className={shared.section}>
        <h2 className={shared.sectionTitle}>{t('partie.gebaeudeUndStrassen')}</h2>
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
                    .flatMap((building) => [
                      <span key={`b-${building.vertex}`} className={styles.pieceBtn}>
                        <PieceMark
                          kind={building.type}
                          color={building.catanColor}
                          size={16}
                          box="fit"
                        />
                      </span>,
                      <span key={`r-${building.vertex}`} className={styles.pieceBtn}>
                        <PieceMark kind="road" color={building.catanColor} size={16} box="fit" />
                      </span>,
                    ])}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );

  return (
    <main
      className={cx(
        shared.main,
        shared.wideMain,
        tab === 'board' && shared.fill,
        tab === 'board' && styles.boardTab,
      )}
    >
      <div className={shared.pageHead}>
        <PressableButton
          type="button"
          className={shared.iconBtn}
          aria-label={t('allgemein.zurueck')}
          onClick={() => void navigate('/')}
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
