import { AnimatePresence, m } from 'motion/react';
import type { ReactNode, Ref } from 'react';
import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import {
  CATAN_BOARD,
  catanPlacementRounds,
  catanPlacementSpots,
  catanSummary,
  type CatanBuildingStep,
  type CatanRoadStep,
  type CatanSlot,
} from '@/games/catan';
import { t } from '@/i18n/t';
import { Board, type PieceMarking } from '@/ui/board/Board';
import { PieceMark } from '@/ui/board/PieceMark';
import type { PieceKind } from '@/ui/board/pieces';
import { CheckIcon } from '@/ui/components/Icons';
import { matchBoardPieces } from './boardPieces';
import { Coin } from './Coin';
import { colorOf } from './matchColors';
import { orderOrSeats } from './matchFlow';
import { pieceName } from './matchTexts';
import {
  HighlightLayer,
  SettleTop,
  SettleUnder,
  settlePlace,
  type HighlightHandle,
  type HighlightPiece,
  type SettleLook,
} from './placement/PlacementHighlight';
import { TurnBand } from './TurnBand';
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
  /** Tapping a piece asks before repeating its step (US-AB-03 AK-8). */
  readonly onRepeatPiece?: ((stepIndex: number) => void) | undefined;
  /** The pieces marked while a question about one is open (design I2-H). */
  readonly marked?: PieceMarking | null | undefined;
  /** The area of the board, for the question about a piece. */
  readonly boardRef?: Ref<HTMLDivElement> | undefined;
  /**
   * The piece drawn and stored but not shown yet: its highlighting plays on the board, which
   * does not show it (US-IN-02, design D-2). `null` otherwise.
   */
  readonly highlight?: {
    readonly step: CatanBuildingStep | CatanRoadStep;
    readonly handle: HighlightHandle;
  } | null;
  /** How the newest piece is set right after its highlighting; `null` shows it at rest. */
  readonly settle?: SettleLook | null;
  /** A short hint on top of the board, e.g. "Zwei übrig" (design D-2); `key` restarts it. */
  readonly hint?: {
    readonly key: string;
    readonly text: string;
    /** Shown for 1.5 s only, then `onEnd` is called. */
    readonly isBrief: boolean;
    readonly onEnd?: () => void;
  } | null;
};

// "Spannung an" stays 1.5 s: in within 15 %, out from 75 % (design D-2).
const BRIEF_HINT = { duration: 1.5, times: [0, 0.15, 0.75, 1] };
const HINT_FADE = { duration: 0.2 } as const;
const HINT_RISE = 6;

// The piece of a step and the places it could have been drawn on (US-IN-02 AK-2).
function highlightPiece(
  session: StoredSession,
  step: CatanBuildingStep | CatanRoadStep,
): HighlightPiece | null {
  const spots = catanPlacementSpots(
    session.generation.steps.map((record) => record.step),
    step,
  );
  if (spots === null) {
    return null;
  }
  if (step.kind === 'building') {
    return spots.kind === 'building'
      ? { kind: 'building', type: step.type, result: step.result, spots: spots.vertices }
      : null;
  }
  return spots.kind === 'road'
    ? { kind: 'road', building: spots.building, result: step.result, spots: spots.edges }
    : null;
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
  onRepeatPiece,
  marked,
  boardRef,
  highlight = null,
  settle = null,
  hint = null,
}: PlacementStepProps): React.JSX.Element {
  const summary = catanSummary(session.setup, session.generation);
  const pieces = matchBoardPieces(session, nameOf);
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
  const layers = boardLayers(session, pieces, highlight, newest, settle);

  return (
    <div className={styles.placement}>
      <div className={styles.boardArea} data-board="">
        <Board
          board={CATAN_BOARD}
          label={t('partie.brett', {
            gebaeude: summary.buildings.length,
            strassen: summary.roads.length,
          })}
          buildings={pieces.buildings}
          roads={pieces.roads}
          overlay={layers.overlay}
          lifted={layers.lifted}
          top={layers.top}
          ref={boardRef}
          marked={marked}
          onPieceTap={
            onRepeatPiece === undefined
              ? undefined
              : (key) => {
                  const index = pieces.stepOf.get(key);
                  if (index !== undefined) {
                    onRepeatPiece(index);
                  }
                }
          }
        />
        {skip !== undefined && skip !== false && <div className={styles.skipOver}>{skip}</div>}
        <AnimatePresence>
          {hint !== null && (
            <m.div
              key={hint.key}
              className={styles.boardHint}
              role="status"
              initial={{ opacity: 0, y: HINT_RISE }}
              animate={
                hint.isBrief
                  ? { opacity: [0, 1, 1, 0], y: [HINT_RISE, 0, 0, 0] }
                  : { opacity: 1, y: 0 }
              }
              exit={{ opacity: 0 }}
              transition={hint.isBrief ? BRIEF_HINT : HINT_FADE}
              onAnimationComplete={() => {
                if (hint.isBrief) {
                  hint.onEnd?.();
                }
              }}
            >
              {hint.text}
            </m.div>
          )}
        </AnimatePresence>
      </div>
      {/* The band stays in its place and changes its content only (PO 10.11.2026); the name stays
          at the bottom, the line above it is never empty (design I2-E, J1 and D1). */}
      {atTurn === null ? (
        <TurnBand
          icon={<CheckIcon size={20} />}
          name={t('partie.platzierungFertig')}
          color={null}
          order={coins}
          currentId={null}
          note={t('partie.alleGesetzt')}
        />
      ) : (
        <TurnBand
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
          note={newest === null ? t('partie.jetzt') : t('partie.alsNaechstes')}
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

type BoardLayers = {
  readonly overlay: ReactNode;
  readonly lifted: readonly string[];
  readonly top: ReactNode;
};

// What the board draws over its pieces (design D-2): while a piece is highlighted, the
// highlighting, with the building of a road on top of it; right after, the piece being set.
function boardLayers(
  session: StoredSession,
  pieces: ReturnType<typeof matchBoardPieces>,
  highlight: PlacementStepProps['highlight'],
  newest: PlacementStepProps['newest'],
  settle: SettleLook | null,
): BoardLayers {
  if (highlight !== undefined && highlight !== null) {
    const { step, handle } = highlight;
    const piece = highlightPiece(session, step);
    if (piece === null) {
      return { overlay: null, lifted: [], top: null };
    }
    return {
      overlay: (
        <HighlightLayer
          key={`${step.kind}:${step.result}`}
          board={CATAN_BOARD}
          piece={piece}
          color={colorOf(session, step.personId)}
          handle={handle}
        />
      ),
      lifted: step.kind === 'road' ? [`building-${String(step.index)}`] : [],
      top: null,
    };
  }
  if (settle === null || newest === null) {
    return { overlay: null, lifted: [], top: null };
  }
  const key = `${newest.kind}-${String(newest.index)}`;
  const building = pieces.buildings.find((candidate) => candidate.key === key);
  const road = pieces.roads.find((candidate) => candidate.key === key);
  const place =
    building !== undefined
      ? settlePlace(CATAN_BOARD, { kind: 'building', vertex: building.vertex })
      : road === undefined
        ? null
        : settlePlace(CATAN_BOARD, { kind: 'road', edge: road.edge, from: road.from });
  const color = building?.color ?? road?.color;
  if (place === null || color === undefined) {
    return { overlay: null, lifted: [], top: null };
  }
  return {
    overlay: (
      <SettleUnder key={key} board={CATAN_BOARD} place={place} color={color} look={settle} />
    ),
    lifted: newest.kind === 'road' ? [key, `building-${String(newest.index)}`] : [key],
    top: <SettleTop key={key} place={place} color={color} pieceKeys={[key]} />,
  };
}
