import { animate, cubicBezier, useReducedMotion, type AnimationSequence } from 'motion/react';
import { useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import type { CatanColorKey } from '@/core/model';
import type { RandomSource } from '@/core/random';
import type { Board, BoardPoint, CatanBuildingType, EdgeId, VertexId } from '@/games/catan';
import { edgeInSvg, layoutBoard, vertexInSvg } from '@/ui/board/boardLayout';
import { buildingPath } from '@/ui/board/pieces';
import pieceStyles from '@/ui/board/Pieces.module.css';
import { HIGHLIGHT_MS, planHighlight, type HighlightPlan } from './highlightPlan';
import { HL, playHighlight, type HighlightRun } from './playHighlight';
import styles from './PlacementHighlight.module.css';

/** The piece drawn and the places it could have been drawn on (US-IN-02 AK-2). */
export type HighlightPiece =
  | {
      readonly kind: 'building';
      readonly type: CatanBuildingType;
      readonly result: VertexId;
      readonly spots: readonly VertexId[];
    }
  | {
      readonly kind: 'road';
      readonly building: VertexId;
      readonly result: EdgeId;
      readonly spots: readonly EdgeId[];
    };

/** How the piece is set after its highlighting (design D-2). */
export type SettleLook = {
  /** The board was dark and brightens again (tension mode). */
  readonly isDark: boolean;
  /** The mark on the result fades; after a duel the stone stood there instead. */
  readonly hasMark: boolean;
};

/**
 * What the highlighting needs from the flow (design D-2): the decorative chance, the mode, and
 * where to report that it runs, stops at two places left and is over.
 */
export type HighlightHandle = {
  readonly rng: RandomSource;
  /** The tension mode (FA-IN-08) as it was when the highlighting began. */
  readonly isTension: boolean;
  readonly onRun: (run: HighlightRun | null) => void;
  /** Two places are left; "Duell" continues (US-IN-02 AK-6). */
  readonly onStop: () => void;
  /** Called once the highlighting has ended or was skipped (FA-AB-07). */
  readonly onDone: (look: SettleLook) => void;
};

// A place on the board: a vertex, or an edge from the building outwards.
type Place =
  | { readonly kind: 'vertex'; readonly at: BoardPoint }
  | { readonly kind: 'edge'; readonly from: BoardPoint; readonly to: BoardPoint };

function placesOf(board: Board, piece: HighlightPiece): Map<string, Place> {
  if (piece.kind === 'building') {
    return new Map(
      [...piece.spots, piece.result].map((vertex) => [
        vertex,
        { kind: 'vertex', at: vertexInSvg(board, vertex) },
      ]),
    );
  }
  return new Map(
    [...piece.spots, piece.result].map((edge) => [
      edge,
      { kind: 'edge', ...edgeInSvg(board, edge, piece.building) },
    ]),
  );
}

const along = (place: { from: BoardPoint; to: BoardPoint }, share: number): BoardPoint => ({
  x: place.from.x + (place.to.x - place.from.x) * share,
  y: place.from.y + (place.to.y - place.from.y) * share,
});

/** The centre of a place: the vertex, or 60 % along the edge (design D-2). */
function centreOf(place: Place): BoardPoint {
  return place.kind === 'vertex' ? place.at : along(place, 0.6);
}

const fillOf = (color: CatanColorKey): string => `var(--color-catan-${color})`;

type MarkProps = {
  readonly place: Place;
  readonly color: CatanColorKey;
  /** The weak glow of an edge in the tension mode (35 % instead of 60 %). */
  readonly isWeak?: boolean;
  readonly name?: string;
};

// The shape of the mark M1 from I2-H in the person's colour: a ring around a vertex, a wide glow
// from 30 % to 90 % along an edge.
function Mark({ place, color, isWeak = false, name }: MarkProps): React.JSX.Element {
  if (place.kind === 'vertex') {
    return (
      <circle
        cx={place.at.x}
        cy={place.at.y}
        r={5.6}
        className={styles.ring}
        fill={fillOf(color)}
        stroke={fillOf(color)}
        data-hl={name}
        data-settle={name === undefined ? 'mark' : undefined}
      />
    );
  }
  const a = along(place, 0.3);
  const b = along(place, 0.9);
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      className={isWeak ? styles.glowWeak : styles.glow}
      stroke={fillOf(color)}
      data-hl={name}
      data-settle={name === undefined ? 'mark' : undefined}
    />
  );
}

type DotProps = {
  readonly at: BoardPoint;
  readonly color: CatanColorKey;
  readonly name: string;
};

// A dot of the tension mode: a glow, the core in the person's colour and a bright centre.
function Dot({ at, color, name }: DotProps): React.JSX.Element {
  return (
    <g data-hl={name} className={styles.dot}>
      <circle cx={at.x} cy={at.y} r={4.41} className={styles.dotGlow} fill={fillOf(color)} />
      <circle cx={at.x} cy={at.y} r={2.1} fill={fillOf(color)} />
      <circle cx={at.x} cy={at.y} r={0.945} className={styles.dotCore} />
    </g>
  );
}

type DarkProps = {
  readonly board: Board;
  readonly name?: string;
};

// The board in its own shape, darker (tension mode): sea, tiles and pieces below it.
function Dark({ board, name }: DarkProps): React.JSX.Element {
  return (
    <polygon
      points={layoutBoard(board).sea}
      className={styles.dark}
      data-hl={name}
      data-settle={name === undefined ? 'dark' : undefined}
    />
  );
}

type HighlightLayerProps = {
  readonly board: Board;
  readonly piece: HighlightPiece;
  readonly color: CatanColorKey;
  readonly handle: HighlightHandle;
};

/**
 * The highlighting before a piece is fixed (US-IN-02, design D-2), drawn over the pieces of the
 * board: the running light, or in the tension mode the dark board, the lights going out and the
 * stone of the duel. Its plan is fixed for the life of this component and played once by
 * `playHighlight`; starting it is an effect, as it drives the animations of the browser.
 */
export function HighlightLayer({
  board,
  piece,
  color,
  handle,
}: HighlightLayerProps): React.JSX.Element {
  const ref = useRef<SVGGElement>(null);
  // "Bewegung reduzieren" in the system: the highlighting goes straight to its end.
  const isReduced = useReducedMotion() === true;
  const [plan] = useState<HighlightPlan<string>>(() =>
    piece.kind === 'building'
      ? planHighlight(piece.spots, piece.result, 'building', handle.isTension, handle.rng)
      : planHighlight(piece.spots, piece.result, 'road', handle.isTension, handle.rng),
  );
  const places = placesOf(board, piece);
  const isRoad = piece.kind === 'road';
  const stop = useEffectEvent(() => {
    handle.onStop();
  });
  const start = useEffectEvent((root: SVGGElement) => {
    const run = playHighlight(root, plan, isRoad, stop);
    if (isReduced) {
      run.complete();
    }
    return run;
  });
  const report = useEffectEvent((run: HighlightRun | null) => {
    handle.onRun(run);
  });
  const finish = useEffectEvent(() => {
    handle.onDone({ isDark: plan.isDark, hasMark: plan.duel === null });
  });
  useLayoutEffect(() => {
    const root = ref.current;
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
      () => undefined,
    );
    return () => {
      isOver = true;
      run.stop();
      report(null);
    };
  }, []);

  const placeOf = (spot: string): Place | undefined => places.get(spot);
  const result = placeOf(plan.result);
  return (
    <g ref={ref} data-testid="highlight" data-highlight={plan.kind}>
      {plan.isDark && <Dark board={board} name={HL.dark} />}
      {plan.kind === 'tension' &&
        plan.spots.map((spot) => {
          const place = placeOf(spot);
          if (place === undefined) {
            return null;
          }
          return place.kind === 'vertex' ? (
            <Dot key={spot} at={place.at} color={color} name={HL.light(spot)} />
          ) : (
            <Mark key={spot} place={place} color={color} isWeak name={HL.light(spot)} />
          );
        })}
      {plan.kind === 'tension' && result !== undefined && (
        <Mark place={result} color={color} name={HL.mark(plan.result)} />
      )}
      {plan.hops.map((spot, hop) => {
        const place = placeOf(spot);
        return place === undefined ? null : (
          // The hops repeat places: each hop has its own ring, so it fades on its own.
          <Mark key={HL.hop(hop)} place={place} color={color} name={HL.hop(hop)} />
        );
      })}
      {piece.kind === 'building' &&
        plan.duel?.turns.map((spot, turn) => {
          const place = placeOf(spot);
          return place?.kind === 'vertex' ? (
            <path
              // Each station of the duel has its own stone, so it comes and goes on its own.
              key={HL.ghost(turn)}
              d={buildingPath(piece.type, place.at)}
              className={pieceStyles.building}
              fill={fillOf(color)}
              data-hl={HL.ghost(turn)}
            />
          ) : null;
        })}
    </g>
  );
}

// F2: the piece falls from 9 units above at 125 % size, is down at 55 % of the time, bounces 1.3
// units at 75 %; one curve for the whole fall, as in the reference.
const FALL = {
  times: [0, 0.55, 0.75, 1],
  opacity: [0, 1, 1, 1],
  y: [-9, 0, -1.3, 0],
  scale: [1.25, 1, 1, 1],
} as const;
const FALL_EASE = cubicBezier(0.4, 0, 0.6, 1);
const FALL_STEPS = 24;
const RING_EASE = [0.2, 0.6, 0.3, 1] as const;
const ringEase = cubicBezier(...RING_EASE);
const RING_RADIUS = 6;

// The value of keyframes `values` at `times` for the progress `at`.
function valueAt(values: readonly number[], at: number): number {
  const times = FALL.times;
  for (let index = 1; index < times.length; index++) {
    const end = times[index] ?? 1;
    if (at <= end) {
      const begin = times[index - 1] ?? 0;
      const from = values[index - 1] ?? 0;
      const to = values[index] ?? 0;
      return from + (to - from) * ((at - begin) / (end - begin || 1));
    }
  }
  return values.at(-1) ?? 0;
}

/** The keyframes of the fall, sampled along its curve and played linearly. */
export function fallKeyframes(): {
  readonly opacity: number[];
  readonly y: number[];
  readonly scale: number[];
  readonly times: number[];
} {
  const times = Array.from({ length: FALL_STEPS + 1 }, (_, index) => index / FALL_STEPS);
  const way = times.map((time) => FALL_EASE(time));
  return {
    opacity: way.map((at) => valueAt(FALL.opacity, at)),
    y: way.map((at) => valueAt(FALL.y, at)),
    scale: way.map((at) => valueAt(FALL.scale, at)),
    times,
  };
}

type SettleProps = {
  /** The piece being set, e.g. `building-3`: `SettleTop` plays only what `SettleUnder` draws for it. */
  readonly pieceKey: string;
  readonly board: Board;
  readonly place: Place;
  readonly color: CatanColorKey;
  readonly look: SettleLook;
};

/** The place a piece was set on, for `SettleUnder` and `SettleTop`. */
export function settlePlace(
  board: Board,
  piece:
    | { readonly kind: 'building'; readonly vertex: VertexId }
    | {
        readonly kind: 'road';
        readonly edge: EdgeId;
        readonly from: VertexId;
      },
): Place {
  return piece.kind === 'building'
    ? { kind: 'vertex', at: vertexInSvg(board, piece.vertex) }
    : { kind: 'edge', ...edgeInSvg(board, piece.edge, piece.from) };
}

/**
 * Below the piece being set (design D-2): the dark of the tension mode and the mark on the
 * result, both fading. `SettleTop` plays them.
 */
export function SettleUnder({
  pieceKey,
  board,
  place,
  color,
  look,
}: SettleProps): React.JSX.Element {
  return (
    <g data-settle-for={pieceKey}>
      {look.isDark && <Dark board={board} />}
      {look.hasMark && <Mark place={place} color={color} />}
    </g>
  );
}

type SettleTopProps = Omit<SettleProps, 'board' | 'look'>;

/**
 * Sets a piece after its highlighting (US-IN-02 AK-4, design D-2, F2 and F4): it falls from above,
 * a ring runs outwards, the mark fades and a dark board brightens. Over everything on the board;
 * starting it is an effect, as it drives the animations of the browser.
 */
export function SettleTop({ pieceKey, place, color }: SettleTopProps): React.JSX.Element {
  const ref = useRef<SVGCircleElement>(null);
  const play = useEffectEvent((ring: SVGCircleElement) => {
    const svg = ring.ownerSVGElement;
    if (svg === null) {
      return null;
    }
    // The piece that falls, found on the board by its key.
    const pieces = [...svg.querySelectorAll<SVGElement>(`[data-piece="${pieceKey}"]`)];
    const fall = fallKeyframes();
    const sequence: AnimationSequence = [
      [
        ring,
        { opacity: [1, 0] },
        { duration: HIGHLIGHT_MS.settleRing / 1000, ease: [...RING_EASE], at: 0 },
      ],
      // The ring grows by its radius, not by scaling: its line stays thin (PO 12.11.2026: scaled,
      // it became a wide band that darkened the board). WebKit does not animate the radius as a
      // style, so it is set as the attribute on every frame.
      [
        (progress: number) => {
          const radius = RING_RADIUS * (0.4 + 2.2 * ringEase(progress));
          ring.setAttribute('r', radius.toFixed(3));
        },
        { duration: HIGHLIGHT_MS.settleRing / 1000, ease: 'linear', at: 0 },
      ],
    ];
    for (const piece of pieces) {
      piece.style.transformBox = 'fill-box';
      piece.style.transformOrigin = 'center';
      sequence.push([
        piece,
        { opacity: fall.opacity, y: fall.y, scale: fall.scale },
        { duration: HIGHLIGHT_MS.settle / 1000, ease: 'linear', times: fall.times, at: 0 },
      ]);
    }
    for (const under of svg.querySelectorAll<SVGElement>(
      `[data-settle-for="${pieceKey}"] [data-settle]`,
    )) {
      const ms = under.dataset.settle === 'dark' ? HIGHLIGHT_MS.darkOut : HIGHLIGHT_MS.markOut;
      sequence.push([under, { opacity: [1, 0] }, { duration: ms / 1000, ease: 'easeOut', at: 0 }]);
    }
    return animate(sequence);
  });
  useLayoutEffect(() => {
    const ring = ref.current;
    const run = ring === null ? null : play(ring);
    return () => {
      run?.complete();
    };
  }, []);
  const centre = centreOf(place);
  return (
    <circle
      ref={ref}
      cx={centre.x}
      cy={centre.y}
      r={RING_RADIUS}
      className={styles.settleRing}
      stroke={fillOf(color)}
      data-testid="settle-ring"
    />
  );
}
