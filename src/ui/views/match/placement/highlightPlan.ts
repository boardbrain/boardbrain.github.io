import { uniformInt, type RandomSource } from '@/core/random';

// Plans of the highlighting before a piece is fixed (US-IN-02, design D-2, reference
// docs/design/d2-staging-final-preview.html): which place lights up or goes out when, as plain
// data. A plan is computed once from the valid places, the stored result and the decorative chance
// (Architecture 13.6, NFA-ZF-01) and played by `playHighlight`; tests check it without a browser.
// All times in milliseconds.
//
// E-39, US-IN-02 AK-3: everything before the landing arises without knowing the result. The
// running light walks over all places at random, the duel starts at either of its two places and
// takes a random number of turns; what goes out, and who meets the result in the duel, is equally
// likely for every other place. So every place still lit is equally likely the result, and only
// the landing shows it.

/**
 * Times of the highlighting (design D-2). As in `STAGE_MS`, they are numbers in one place rather
 * than style tokens: Motion needs them as numbers, and the plans are tested without CSS
 * (Architecture 13.6).
 */
export const HIGHLIGHT_MS = {
  /** Running light A2: all hops of a building, of a road. */
  runBuilding: 2000,
  runRoad: 1200,
  /** The ring left behind fades. */
  hopOut: 140,
  /** Rest on the result before the piece is set. */
  hold: 320,
  /** Tension mode L2: about 5 s for a building, 2.9 s for a road (3.5 s and 2 s, × 1.45). */
  tensionBuilding: 5075,
  tensionRoad: 2900,
  /** The board darkens, the lights come up, then rest before the first goes out. */
  darkIn: 300,
  lightIn: 260,
  rest: 420,
  /** A dot goes out; an edge goes out. */
  dotOut: 220,
  glowOut: 260,
  /** The hint "Zwei übrig" goes after "Duell", then the duel starts. */
  beforeDuel: 200,
  /** A stone in the duel lands with a short drop. */
  ghostDrop: 120,
  /** The piece is set (F2), its ring runs outwards (F4), the mark fades, the board brightens. */
  settle: 560,
  settleRing: 760,
  markOut: 520,
  darkOut: 420,
} as const;

/** Running light: the hops are 1.3 times as long as the one before. */
const RUN_GROWTH = 1.3;
/** Running light: 8 to 13 hops for a building, 3 to 5 for a road, before the landing. */
const RUN_HOPS = { building: [8, 13], road: [3, 5] } as const;
/** Tension mode: the gaps between places going out grow by 1.22. */
const OUT_GROWTH = 1.22;
/** Tension mode: going out takes 55 % of the time before a duel, 85 % for a road. */
const OUT_SHARE = { duel: 0.55, road: 0.85 } as const;
/** Duel: 5 to 8 turns before the landing, 40 % of the time; the gaps grow by 1.32. */
const DUEL_TURNS = [5, 8] as const;
const DUEL_SHARE = 0.4;
const DUEL_GROWTH = 1.32;

/** One moment of a highlighting. */
export type HighlightStep<T extends string> =
  /** The ring of hop `hop` appears on `spot` (A2); a later step lets it fade. */
  | { readonly kind: 'hop'; readonly hop: number; readonly spot: T; readonly at: number }
  /** The ring of hop `hop` fades out (A2). */
  | { readonly kind: 'hop-out'; readonly hop: number; readonly at: number }
  /** The board darkens (tension mode). */
  | { readonly kind: 'dark'; readonly at: number }
  /** Every place lights up: a dot at a vertex, a weak glow along an edge (tension mode). */
  | { readonly kind: 'light'; readonly at: number }
  /** The light of `spot` goes out (tension mode). */
  | { readonly kind: 'out'; readonly spot: T; readonly at: number }
  /** The remaining edge becomes the full mark (tension mode, road). */
  | { readonly kind: 'mark'; readonly spot: T; readonly at: number }
  /** The stone of the duel lands on `spot` as station `turn`; the one before goes. */
  | { readonly kind: 'ghost'; readonly turn: number; readonly spot: T; readonly at: number };

/** A part of a highlighting played without a stop. */
export type HighlightPart<T extends string> = {
  readonly steps: readonly HighlightStep<T>[];
  /** When the part is over, with the rest at the end. */
  readonly duration: number;
};

/**
 * A whole highlighting. `lead` runs from "Losen" on; with a `duel` it stops at two places left
 * ("Zwei übrig") until "Duell" is tapped, then `duel.part` runs.
 */
export type HighlightPlan<T extends string> = {
  readonly kind: 'run' | 'tension';
  /** The places that take part: all valid places, in the order of the board. */
  readonly spots: readonly T[];
  readonly result: T;
  /** The places of the running light in hop order, the landing last. */
  readonly hops: readonly T[];
  readonly lead: HighlightPart<T>;
  readonly duel: {
    readonly rival: T;
    /** The stations of the stone in the duel, the landing last. */
    readonly turns: readonly T[];
    readonly part: HighlightPart<T>;
  } | null;
  /** The board is dark until the piece is set (tension mode). */
  readonly isDark: boolean;
};

/** Weights `growth^k` for `count` gaps, adding up to 1. */
export function growingShares(count: number, growth: number): number[] {
  const weights = Array.from({ length: count }, (_, k) => growth ** k);
  const sum = weights.reduce((total, weight) => total + weight, 0);
  return sum === 0 ? [] : weights.map((weight) => weight / sum);
}

/** The moments after `start` that are `share` × `total` apart, one per share. */
function cumulative(start: number, total: number, shares: readonly number[]): number[] {
  let at = start;
  return shares.map((share) => {
    at += share * total;
    return at;
  });
}

/** A random order of `items` (Fisher–Yates with the decorative chance). */
export function shuffled<T>(items: readonly T[], rng: RandomSource): T[] {
  const out = [...items];
  for (let index = out.length - 1; index > 0; index--) {
    const other = uniformInt(index + 1, rng);
    const kept = out[index];
    const moved = out[other];
    if (kept !== undefined && moved !== undefined) {
      out[index] = moved;
      out[other] = kept;
    }
  }
  return out;
}

const between = ([low, high]: readonly [number, number], rng: RandomSource): number =>
  low + uniformInt(high - low + 1, rng);

/**
 * A walk over `spots` that knows nothing of the result: a random start, every further station
 * one of the others at random. With a single place it stays there.
 */
function randomWalk<T>(spots: readonly T[], length: number, rng: RandomSource): T[] {
  const walk: T[] = [];
  for (let station = 0; station < length; station++) {
    const last = walk.at(-1);
    const choices = last === undefined ? spots : spots.filter((spot) => spot !== last);
    const next = choices.length === 0 ? last : choices[uniformInt(choices.length, rng)];
    if (next !== undefined) {
      walk.push(next);
    }
  }
  return walk;
}

/**
 * Standard A2 (US-IN-02 AK-4): a ring in the person's colour hops over all valid places, slows
 * down and lands on the result; on the place it stands on already, it simply stays. Then it rests.
 */
function planRun<T extends string>(
  spots: readonly T[],
  result: T,
  isRoad: boolean,
  rng: RandomSource,
): HighlightPlan<T> {
  const hops = [
    ...randomWalk(spots, between(isRoad ? RUN_HOPS.road : RUN_HOPS.building, rng), rng),
    result,
  ];
  const total = isRoad ? HIGHLIGHT_MS.runRoad : HIGHLIGHT_MS.runBuilding;
  const times = [0, ...cumulative(0, total, growingShares(hops.length - 1, RUN_GROWTH))];
  const steps: HighlightStep<T>[] = [];
  let shown = 0;
  hops.forEach((spot, hop) => {
    const at = times[hop] ?? total;
    if (hop === 0) {
      steps.push({ kind: 'hop', hop, spot, at });
    } else if (spot !== hops[hop - 1]) {
      steps.push({ kind: 'hop-out', hop: shown, at }, { kind: 'hop', hop, spot, at });
      shown = hop;
    }
  });
  return {
    kind: 'run',
    spots,
    result,
    hops,
    lead: { steps, duration: total + HIGHLIGHT_MS.hold },
    duel: null,
    isDark: false,
  };
}

/**
 * Tension mode for a building (US-IN-02 AK-6, D2 with E4): the board darkens, every valid vertex
 * lights up, and all but the result and a rival chosen purely at random go out in random order.
 * The lead stops at two; the duel lets the stone itself hop between both, from a random one of
 * them for a random number of turns, and land on the result.
 */
function planTensionBuilding<T extends string>(
  spots: readonly T[],
  result: T,
  rng: RandomSource,
): HighlightPlan<T> {
  const total = HIGHLIGHT_MS.tensionBuilding;
  const others = shuffled(
    spots.filter((spot) => spot !== result),
    rng,
  );
  const rival = others.length === 0 ? undefined : others[uniformInt(others.length, rng)];
  const goingOut = others.filter((spot) => spot !== rival);
  const outShare = rival === undefined ? OUT_SHARE.road : OUT_SHARE.duel;
  const outAt = cumulative(
    HIGHLIGHT_MS.rest,
    total * outShare,
    growingShares(goingOut.length, OUT_GROWTH),
  );
  const leadSteps: HighlightStep<T>[] = [
    { kind: 'dark', at: 0 },
    { kind: 'light', at: 0 },
    ...goingOut.map((spot, index) => ({ kind: 'out' as const, spot, at: outAt[index] ?? 0 })),
  ];
  const leadEnd = HIGHLIGHT_MS.rest + total * outShare;
  if (rival === undefined) {
    // A single place: nothing to decide, it simply is the result.
    return {
      kind: 'tension',
      spots,
      result,
      hops: [],
      lead: {
        steps: [...leadSteps, { kind: 'mark', spot: result, at: leadEnd }],
        duration: leadEnd + HIGHLIGHT_MS.hold,
      },
      duel: null,
      isDark: true,
    };
  }
  const first = uniformInt(2, rng) === 0 ? rival : result;
  const second = first === rival ? result : rival;
  const turns = [
    ...Array.from({ length: between(DUEL_TURNS, rng) }, (_, turn) =>
      turn % 2 === 0 ? first : second,
    ),
    result,
  ];
  const duelMs = total * DUEL_SHARE;
  const turnAt = [
    HIGHLIGHT_MS.beforeDuel,
    ...cumulative(HIGHLIGHT_MS.beforeDuel, duelMs, growingShares(turns.length, DUEL_GROWTH)),
  ];
  const duelSteps: HighlightStep<T>[] = [];
  turns.forEach((spot, turn) => {
    // PO 11.11.2026: landing on the place it stands on already is no second touchdown.
    if (turn === 0 || spot !== turns[turn - 1]) {
      duelSteps.push({ kind: 'ghost', turn, spot, at: turnAt[turn] ?? 0 });
    }
  });
  const landing = turnAt[turns.length - 1] ?? 0;
  duelSteps.push({ kind: 'out', spot: rival, at: landing });
  return {
    kind: 'tension',
    spots,
    result,
    hops: [],
    lead: { steps: leadSteps, duration: leadEnd },
    duel: {
      rival,
      turns,
      part: { steps: duelSteps, duration: landing + HIGHLIGHT_MS.hold },
    },
    isDark: true,
  };
}

/**
 * Tension mode for a road (US-IN-02 AK-7, R1): the board darkens, every free edge at the building
 * glows weakly, and one after another goes out in random order without a stop; the last one
 * becomes the full mark.
 */
function planTensionRoad<T extends string>(
  spots: readonly T[],
  result: T,
  rng: RandomSource,
): HighlightPlan<T> {
  const total = HIGHLIGHT_MS.tensionRoad * OUT_SHARE.road;
  const goingOut = shuffled(
    spots.filter((spot) => spot !== result),
    rng,
  );
  // One more share for the wait before the last edge becomes the mark.
  const shares = growingShares(goingOut.length + 1, OUT_GROWTH);
  const outAt = cumulative(HIGHLIGHT_MS.rest, total, shares);
  const end = HIGHLIGHT_MS.rest + total;
  return {
    kind: 'tension',
    spots,
    result,
    hops: [],
    lead: {
      steps: [
        { kind: 'dark', at: 0 },
        { kind: 'light', at: 0 },
        ...goingOut.map((spot, index) => ({ kind: 'out' as const, spot, at: outAt[index] ?? 0 })),
        { kind: 'mark', spot: result, at: end },
      ],
      duration: end + HIGHLIGHT_MS.hold,
    },
    duel: null,
    isDark: true,
  };
}

/**
 * Plans the highlighting of a piece drawn on `result` among the valid places `spots` (US-IN-02,
 * design D-2): the running light A2, or with `isTension` the tension mode (FA-IN-08). The result
 * is stored before (ADR-014); the plan only leads to it. The result is added to the places if
 * they lack it, so the plan always lands.
 */
export function planHighlight<T extends string>(
  spots: readonly T[],
  result: T,
  piece: 'building' | 'road',
  isTension: boolean,
  rng: RandomSource,
): HighlightPlan<T> {
  const all = spots.includes(result) ? spots : [...spots, result];
  if (!isTension) {
    return planRun(all, result, piece === 'road', rng);
  }
  return piece === 'road'
    ? planTensionRoad(all, result, rng)
    : planTensionBuilding(all, result, rng);
}
