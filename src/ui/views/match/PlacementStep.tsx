import type { ReactNode } from 'react';
import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import { CATAN_BOARD, catanPlacementRounds, catanSummary, type CatanSlot } from '@/games/catan';
import { t } from '@/i18n/t';
import { Board } from '@/ui/board/Board';
import { PieceMark } from '@/ui/board/PieceMark';
import type { PieceKind } from '@/ui/board/pieces';
import { CheckIcon } from '@/ui/components/Icons';
import { Coin } from './Coin';
import { colorOf } from './matchColors';
import { orderOrSeats } from './matchFlow';
import { pieceName } from './matchTexts';
import { DoneBand, TurnBand } from './TurnBand';
import styles from './MatchView.module.css';
import { cx } from '@/ui/components/classNames';

type PlacementStepProps = {
  /** The match as shown: in the look back only up to the step shown. */
  readonly session: StoredSession;
  /** The piece just drawn, `null` on the empty board before drawing (US-AB-02 AK-3). */
  readonly newest: { readonly kind: 'building' | 'road'; readonly index: number } | null;
  /**
   * The piece the band names: the one waiting to be drawn, or after a drawn piece the next one
   * (N1); `null` once the placement is finished.
   */
  readonly announced: CatanSlot | null;
  readonly nameOf: (personId: PersonId) => string;
  /** "Platzierung überspringen" on the empty board, over its lower edge; it takes no room. */
  readonly skip?: ReactNode;
  /** "Wiederholen" and the forward button, placed with the layout of the board. */
  readonly actions: ReactNode;
};

// A new piece in the band fades in.
function pieceKey(slot: CatanSlot & { readonly kind: 'building' | 'road' }): string {
  return `${slot.kind}-${String(slot.index)}`;
}

function pieceKind(slot: CatanSlot): PieceKind {
  if (slot.kind === 'road') {
    return 'road';
  }
  return slot.kind === 'building' && slot.type === 'city' ? 'city' : 'settlement';
}

/**
 * The placement on the board (US-PL-02, US-PL-03, US-PL-04, design I2-C page 7 and I2-D): the
 * board H1 with the pieces G1 and R1. Below it the band (P9): before drawing the piece waiting,
 * after a drawn piece "Als Nächstes" and the next one, after the last "Platzierung fertig" (N1).
 * In landscape the order as a list with everyone's pieces (W2).
 */
export function PlacementStep({
  session,
  newest,
  announced,
  nameOf,
  skip,
  actions,
}: PlacementStepProps): React.JSX.Element {
  const summary = catanSummary(session.setup, session.generation);
  const vertexOf = new Map(summary.buildings.map((building) => [building.index, building.vertex]));
  const order = orderOrSeats(session);
  const rounds = catanPlacementRounds(session.setup.options.edition);
  const coins = order.map((personId) => ({
    personId,
    name: nameOf(personId),
    color: colorOf(session, personId),
  }));
  const atTurn =
    announced !== null && (announced.kind === 'building' || announced.kind === 'road')
      ? announced
      : null;

  return (
    <div className={styles.placement}>
      <div className={styles.boardArea} data-board="">
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
          newestKey={newest === null ? undefined : `${newest.kind}-${String(newest.index)}`}
        />
        {skip !== undefined && skip !== false && <div className={styles.skipOver}>{skip}</div>}
      </div>
      {atTurn === null ? (
        <DoneBand
          text={t('partie.platzierungFertig')}
          icon={<CheckIcon size={20} />}
          order={coins}
        />
      ) : (
        <TurnBand
          key={pieceKey(atTurn)}
          icon={
            <PieceMark
              kind={pieceKind(atTurn)}
              color={colorOf(session, atTurn.personId)}
              size={20}
            />
          }
          name={nameOf(atTurn.personId)}
          what={t('partie.stueck', { stueck: pieceName(atTurn) })}
          color={colorOf(session, atTurn.personId)}
          order={coins}
          currentId={atTurn.personId}
          note={newest === null ? undefined : t('partie.alsNaechstes')}
          isReveal={newest !== null}
        />
      )}
      <div className={styles.wOrder}>
        <h2 className={styles.wOrderTitle}>{t('partie.reihenfolge')}</h2>
        {order.map((personId, place) => {
          const own = summary.buildings.filter((building) => building.personId === personId);
          const personColor = colorOf(session, personId);
          const isAtTurn = personId === atTurn?.personId;
          return (
            <div
              key={personId}
              className={cx(styles.wRow, isAtTurn && styles.wRowNow)}
              style={
                isAtTurn
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
