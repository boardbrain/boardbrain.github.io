import type { ReactNode } from 'react';
import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import { CATAN_BOARD, catanPlacementRounds, catanSummary } from '@/games/catan';
import { t } from '@/i18n/t';
import { Board } from '@/ui/board/Board';
import { PieceMark } from '@/ui/board/PieceMark';
import type { PieceKind } from '@/ui/board/pieces';
import { Coin } from './Coin';
import { colorOf } from './matchColors';
import { orderOrSeats } from './matchFlow';
import { pieceName } from './matchTexts';
import { TurnBand } from './TurnBand';
import styles from './MatchView.module.css';
import { cx } from '@/ui/components/classNames';

type PlacementStepProps = {
  readonly session: StoredSession;
  readonly stepIndex: number;
  readonly nameOf: (personId: PersonId) => string;
  /** "Wiederholen" and the forward button, placed with the layout of the board. */
  readonly actions: ReactNode;
};

/**
 * A building or a road on the board (US-PL-02, US-PL-03, US-PL-04, design I2-C page 7): the
 * board H1 with the pieces G1 and R1, the new piece without a mark of its own. Below it the
 * band of the person at turn (P9); in landscape the order as a list with everyone's pieces
 * (W2).
 */
export function PlacementStep({
  session,
  stepIndex,
  nameOf,
  actions,
}: PlacementStepProps): React.JSX.Element | null {
  const record = session.generation.steps[stepIndex];
  if (record === undefined || (record.step.kind !== 'building' && record.step.kind !== 'road')) {
    return null;
  }
  const { step } = record;
  const summary = catanSummary(session.setup, session.generation);
  const vertexOf = new Map(summary.buildings.map((building) => [building.index, building.vertex]));
  const isCity =
    summary.buildings.find((building) => building.index === step.index)?.type === 'city';
  const color = colorOf(session, step.personId);
  const order = orderOrSeats(session);
  const kind: PieceKind = step.kind === 'road' ? 'road' : isCity ? 'city' : 'settlement';
  const rounds = catanPlacementRounds(session.setup.options.edition);

  return (
    <div className={styles.placement}>
      <div className={styles.boardArea}>
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
          newestKey={`${step.kind === 'road' ? 'road' : 'building'}-${String(step.index)}`}
        />
      </div>
      <TurnBand
        icon={<PieceMark kind={kind} color={color} size={20} />}
        name={nameOf(step.personId)}
        what={t('partie.stueck', { stueck: pieceName(step) })}
        color={color}
        order={order.map((personId) => ({
          personId,
          name: nameOf(personId),
          color: colorOf(session, personId),
        }))}
        currentId={step.personId}
      />
      <div className={styles.wOrder}>
        <h2 className={styles.wOrderTitle}>{t('partie.reihenfolge')}</h2>
        {order.map((personId, place) => {
          const own = summary.buildings.filter((building) => building.personId === personId);
          const personColor = colorOf(session, personId);
          return (
            <div
              key={personId}
              className={cx(styles.wRow, personId === step.personId && styles.wRowNow)}
              style={
                personId === step.personId
                  ? {
                      borderColor: `var(--color-catan-${personColor})`,
                      boxShadow: `inset 4px 0 0 var(--color-catan-${personColor}), 0 6px 14px var(--color-shadow)`,
                    }
                  : undefined
              }
            >
              <span className={styles.pNum}>{place + 1}</span>
              <Coin name={nameOf(personId)} color={personColor} />
              <span className={styles.wName}>{nameOf(personId)}</span>
              <span className={styles.wSlots}>
                {rounds.flatMap((type, round) => {
                  const got = own[round];
                  const hasRoad =
                    got !== undefined && summary.roads.some((road) => road.index === got.index);
                  return [
                    <PieceMark
                      key={`b${String(round)}`}
                      kind={got?.type ?? type}
                      color={personColor}
                      size={20}
                      box="fit"
                      className={got === undefined ? styles.faded : undefined}
                    />,
                    <PieceMark
                      key={`r${String(round)}`}
                      kind="road"
                      color={personColor}
                      size={20}
                      box="fit"
                      className={hasRoad ? undefined : styles.faded}
                    />,
                  ];
                })}
              </span>
            </div>
          );
        })}
      </div>
      {actions}
    </div>
  );
}
