import { uniformInt, type RandomSource } from '@/core/random';
import type { CardBox } from './cardLayout';

// Plans of the card movements (design I2-E, reference docs/design/i2e-card-moves-final-preview.html):
// which card moves when and where, as plain data. A plan is computed once from the layout, the
// stored result and the decorative chance (Architecture 13.6, NFA-ZF-01) and played by
// `playStage` with Motion; tests check it without a browser. All times in milliseconds.

/**
 * Where a card lies during a movement: the card element has its own size and lies at the top
 * left of the card table; `x`/`y` move it, `scale` resizes it around its centre, `rotate` in
 * degrees.
 */
export type Pose = {
  readonly x: number;
  readonly y: number;
  readonly rotate: number;
  readonly scale: number;
};

/** A card of a movement: what its faces show and where it starts. */
export type StageCard = {
  readonly id: string;
  readonly w: number;
  readonly h: number;
  /**
   * The fronts the card shows over time, as keys of the scene, e.g. person ids. A card face down
   * may show another front when it turns over: the backs are alike, so who lies on a card is
   * decided only when it turns over (PO 11.11.2026, the movement reveals nothing).
   */
  readonly fronts: readonly string[];
  readonly start: Pose;
  readonly isFaceDown: boolean;
  readonly z: number;
  /** An order card lifted as the newest at the start (design I2-D, Q3). */
  readonly isRaised?: boolean;
};

/** One movement of a card or of another element of the scene. */
export type StageStep =
  | {
      readonly kind: 'move';
      readonly card: string;
      readonly at: number;
      readonly ms: number;
      readonly from: Pose;
      readonly to: Pose;
      /** Height of the arc in pixels, negative upwards; 0 is a straight line. */
      readonly lift: number;
      readonly z?: number;
    }
  | {
      readonly kind: 'flip';
      readonly card: string;
      readonly at: number;
      readonly ms: number;
      readonly toFaceDown: boolean;
      /** The front shown after turning face up, one of the card's `fronts`. */
      readonly front: string;
    }
  | {
      /** Fades a named element of the scene, e.g. the dashed line of a place. */
      readonly kind: 'fade';
      readonly target: string;
      readonly at: number;
      readonly ms: number;
      readonly from: number;
      readonly to: number;
      /** Rises from this many pixels below while fading in. */
      readonly rise?: number;
    }
  | {
      /** Lifts the front of an order card by 10 px or lets it sink (design I2-D, Q3). */
      readonly kind: 'raise';
      readonly card: string;
      readonly at: number;
      readonly ms: number;
      readonly isUp: boolean;
    };

/** A whole movement: the cards with their start and the steps in time. */
export type StagePlan = {
  readonly cards: readonly StageCard[];
  readonly steps: readonly StageStep[];
  /** When the last step ends. */
  readonly duration: number;
};

/**
 * Times of the card movements, tempo of the reference I2-D (design D-2: T2, no setting for the
 * tempo, FA-IN-06).
 */
export const STAGE_MS = {
  flipDown: 360,
  flipDownGap: 70,
  flipUp: 380,
  toStack: 380,
  mixOut: 150,
  mixBack: 150,
  afterMix: 120,
  fly: 520,
  flyLift: -30,
  spreadDelay: 120,
  spreadGap: 40,
  spread: 380,
  othersUp: 300,
  othersUpGap: 60,
  whoOut: 140,
  whoIn: 300,
  whoRise: 6,
  beforeDeal: 150,
  deal: 420,
  dealGap: 170,
  dealLift: -24,
  afterDeal: 250,
  raise: 260,
  lastDelay: 350,
  settleDelay: 250,
  collect: 380,
  collectGap: 60,
  collectLift: -16,
  placeIn: 200,
  kindsDown: 240,
  kindsToStack: 300,
  kindsGap: 35,
  putBack: 460,
  dealResource: 380,
  dealResourceLift: -18,
  labelIn: 200,
} as const;

/** How far a mixed card is pulled out beside the stack, in card widths, and turned. */
const MIX_OUT = 0.85;
const MIX_TURN = 9;
const MIXES = 3;
/** The stack rises by 2 px per card. */
const STACK_STEP = 2;

/** The pose that lays a card of size `w` × `h` onto `box`. */
export function poseOn(box: CardBox, w: number, h: number): Pose {
  const scale = box.w / w;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, rotate: 0, scale };
}

/** The end of a plan's steps. */
function endOf(steps: readonly StageStep[]): number {
  return steps.reduce((end, step) => Math.max(end, step.at + step.ms), 0);
}

// Keeps track of where every card is while the steps are planned one after another.
class Planner {
  readonly steps: StageStep[] = [];
  private readonly poses = new Map<string, Pose>();

  constructor(cards: readonly StageCard[]) {
    for (const card of cards) {
      this.poses.set(card.id, card.start);
    }
  }

  pose(card: string): Pose {
    const pose = this.poses.get(card);
    if (pose === undefined) {
      throw new Error(`no card ${card}`);
    }
    return pose;
  }

  move(card: string, at: number, ms: number, to: Partial<Pose>, lift = 0, z?: number): number {
    const from = this.pose(card);
    const target = { ...from, ...to };
    const isStill =
      target.x === from.x &&
      target.y === from.y &&
      target.rotate === from.rotate &&
      target.scale === from.scale;
    if (isStill) {
      // A card already where it should be only changes its height in the stack, at once.
      if (z !== undefined) {
        this.steps.push({ kind: 'move', card, at, ms: 0, from, to: from, lift: 0, z });
      }
      return at;
    }
    this.poses.set(card, target);
    this.steps.push({
      kind: 'move',
      card,
      at,
      ms,
      from,
      to: target,
      lift,
      ...(z === undefined ? {} : { z }),
    });
    return at + ms;
  }

  flip(card: string, at: number, ms: number, isDown: boolean, front = ''): number {
    this.steps.push({ kind: 'flip', card, at, ms, toFaceDown: isDown, front });
    return at + ms;
  }

  /**
   * Fixes the fronts the cards show when they turn face up, where they were left open while
   * planning: the movements were planned without knowing who lies on which card.
   */
  reveal(cards: readonly StageCard[], fronts: ReadonlyMap<string, string>): StagePlan {
    const steps = this.steps.map((step): StageStep => {
      const front = step.kind === 'flip' && step.front === '' ? fronts.get(step.card) : undefined;
      return step.kind === 'flip' && front !== undefined ? { ...step, front } : step;
    });
    const withFronts = cards.map((card) => {
      const front = fronts.get(card.id);
      return front === undefined
        ? card
        : { ...card, fronts: [...new Set([...card.fronts, front])] };
    });
    return { cards: withFronts, steps, duration: endOf(steps) };
  }

  fade(target: string, at: number, ms: number, from: number, to: number, rise?: number): number {
    this.steps.push({
      kind: 'fade',
      target,
      at,
      ms,
      from,
      to,
      ...(rise === undefined ? {} : { rise }),
    });
    return at + ms;
  }

  raise(card: string, at: number, isUp: boolean): number {
    this.steps.push({ kind: 'raise', card, at, ms: STAGE_MS.raise, isUp });
    return at + STAGE_MS.raise;
  }

  plan(cards: readonly StageCard[]): StagePlan {
    return { cards, steps: this.steps, duration: endOf(this.steps) };
  }
}

/**
 * The stack in the middle of the row below and three mixes, as in the reference I2-D: a card,
 * chosen at random, is pulled out to the left or right and put back on top, alternately left
 * and right. Returns the order of the stack from the bottom afterwards and when it is done.
 * Which card is pulled out is decorative chance and never depends on the result.
 */
function gatherAndMix(
  planner: Planner,
  cards: readonly string[],
  stack: (level: number) => CardBox,
  size: { readonly w: number; readonly h: number },
  start: number,
  rng: RandomSource,
  gap = 0,
): { order: string[]; end: number } {
  let end = start;
  cards.forEach((card, level) => {
    end = Math.max(
      end,
      planner.move(
        card,
        start + level * gap,
        STAGE_MS.toStack,
        poseOn(stack(level), size.w, size.h),
        0,
        10 + level,
      ),
    );
  });
  let order = [...cards];
  for (let mix = 0; mix < MIXES; mix++) {
    const card = order[uniformInt(order.length, rng)] ?? '';
    const side = mix % 2 === 1 ? 1 : -1;
    const home = planner.pose(card);
    const out = planner.move(
      card,
      end,
      STAGE_MS.mixOut,
      { x: home.x + side * size.w * MIX_OUT, rotate: side * MIX_TURN },
      0,
      10 + order.length,
    );
    order = [...order.filter((other) => other !== card), card];
    // The cards below the pulled one sink by one level each; the pulled card goes on top.
    order.forEach((other, level) => {
      const target = poseOn(stack(level), size.w, size.h);
      const now = planner.pose(other);
      if (other === card) {
        planner.move(other, out, STAGE_MS.mixBack, { ...target, rotate: 0 }, 0, 10 + level);
      } else if (now.y !== target.y) {
        planner.move(other, out, STAGE_MS.mixBack, target, 0, 10 + level);
      }
    });
    end = out + STAGE_MS.mixBack;
  }
  return { order, end };
}

/** What a draw of a person needs to plan its movement (design I2-D, page 5). */
export type DrawStageInput = {
  /** The participants in the order of the row, all of them in play (FA-LS-06). */
  readonly persons: readonly string[];
  readonly result: string;
  /** The row of all persons before drawing. */
  readonly rowBefore: readonly CardBox[];
  /** The row of the persons not drawn afterwards, in the order of `persons` without the result. */
  readonly rowAfter: readonly CardBox[];
  readonly slot: CardBox;
  readonly rng: RandomSource;
};

/** A dashed place is drawn at 55 % (design I2-D); it goes once a card lies on it. */
export const PLACE_OPACITY = 0.55;

/** Name of the dashed line of a place in a plan, by its index. */
export const placeTarget = (index: number): string => `place-${String(index)}`;
/** Names of "Wer?" and of the name of the drawn person on the development card. */
export const WHO_BEFORE = 'who-before';
export const WHO_AFTER = 'who-after';

/**
 * US-IN-01 AK-2, design I2-E: "Losen" on a draw of a person. All cards turn face down one after
 * another and gather into a stack, which is mixed three times; the card on top flies onto the
 * place in a small arc while the others spread face down into the row below. The card on the
 * place turns over, "Wer?" on the development card gives way to the name, then the others turn
 * face up. The movements are the same for every result: only the fronts the cards show when
 * they turn over depend on it.
 */
export function planDraw({
  persons,
  result,
  rowBefore,
  rowAfter,
  slot,
  rng,
}: DrawStageInput): StagePlan {
  const { w, h } = slot;
  const others = persons.filter((person) => person !== result);
  const ids = persons.map((_, index) => `card-${String(index)}`);
  // Cards are anonymous during the movement; their fronts are fixed below, once known which
  // card ends where.
  const start = (index: number): Pose => poseOn(rowBefore[index] ?? slot, w, h);
  const draft: StageCard[] = ids.map((id, index) => ({
    id,
    w,
    h,
    fronts: [persons[index] ?? ''],
    start: start(index),
    isFaceDown: false,
    z: 10 + index,
  }));
  const planner = new Planner(draft);
  let end = 0;
  ids.forEach((id, index) => {
    end = Math.max(end, planner.flip(id, index * STAGE_MS.flipDownGap, STAGE_MS.flipDown, true));
  });
  const below = rowBefore[0] ?? slot;
  const stackX = centreX(rowBefore, w);
  const stack = (level: number): CardBox => ({ x: stackX, y: below.y - level * STACK_STEP, w, h });
  const mixed = gatherAndMix(planner, ids, stack, { w, h }, end, rng);
  const fly = mixed.end + STAGE_MS.afterMix;
  const top = mixed.order[mixed.order.length - 1] ?? '';
  const rest = mixed.order.filter((id) => id !== top);
  // The card on top flies onto the place; the others spread out face down meanwhile.
  const landed = planner.move(top, fly, STAGE_MS.fly, poseOn(slot, w, h), STAGE_MS.flyLift, 50);
  let spread = 0;
  rest.forEach((id, index) => {
    const box = rowAfter[index] ?? slot;
    spread = Math.max(
      spread,
      planner.move(
        id,
        fly + STAGE_MS.spreadDelay + index * STAGE_MS.spreadGap,
        STAGE_MS.spread,
        poseOn(box, w, h),
        0,
        10 + index,
      ),
    );
  });
  planner.fade(placeTarget(0), landed, 0, PLACE_OPACITY, 0);
  const open = planner.flip(top, landed, STAGE_MS.flipUp, false);
  const whoOut = planner.fade(WHO_BEFORE, open, STAGE_MS.whoOut, 1, 0);
  const whoIn = planner.fade(WHO_AFTER, whoOut, STAGE_MS.whoIn, 0, 1, STAGE_MS.whoRise);
  const othersUp = Math.max(whoIn, spread);
  rest.forEach((id, index) => {
    planner.flip(id, othersUp + index * STAGE_MS.othersUpGap, STAGE_MS.othersUp, false);
  });
  // Fronts after turning over: the drawn person on top, the others in the order of the row.
  const finalFront = new Map<string, string>([
    [top, result],
    ...rest.map((id, index): [string, string] => [id, others[index] ?? '']),
  ]);
  return planner.reveal(draft, finalFront);
}

// The stack lies in the middle of the row below (reference I2-D: x = (width − w) / 2; the row
// is centred on the table).
function centreX(row: readonly CardBox[], w: number): number {
  const first = row[0];
  const last = row[row.length - 1];
  return first === undefined || last === undefined ? 0 : (first.x + last.x + last.w) / 2 - w / 2;
}

/** Key of the front of an order card lying on place `place`, with its band (design I2-C, Q3). */
export const orderKey = (person: string, place: number): string => `${person}@${String(place)}`;

/** What a spin of the order needs to plan its movement (design I2-D, page 6). */
export type OrderStageInput = {
  /** The participants in the order of the row below before the first deal. */
  readonly persons: readonly string[];
  /** The places drawn before, from place 1 on. */
  readonly placed: readonly string[];
  /** The person drawn for the next place. */
  readonly result: string;
  /** The person on the last place, which follows by itself (FA-LS-02); `null` otherwise. */
  readonly last: string | null;
  readonly slots: readonly CardBox[];
  /** The row of all persons below the places. */
  readonly row: readonly CardBox[];
  /**
   * `deal` for the first place: mix and deal all cards; `turn` turns the next place over;
   * `regather` collects the face-down cards first, after a repetition (E1, PO 11.11.2026).
   */
  readonly mode: 'deal' | 'turn' | 'regather';
  readonly rng: RandomSource;
};

/**
 * US-IN-01 AK-3, design I2-D/I2-E: a spin of the order. The first "Losen" mixes once, deals all
 * cards face down onto the places and turns place 1 over; every further one turns the next place
 * over, the last place follows by itself, and the card lifted before sinks. After repeating from
 * place k, the face-down cards are collected, mixed and dealt again first. The cards face down
 * show nobody: who lies on a place is decided when it turns over.
 */
export function planOrder({
  persons,
  placed,
  result,
  last,
  slots,
  row,
  mode,
  rng,
}: OrderStageInput): StagePlan {
  const first = slots[0];
  if (first === undefined) {
    return { cards: [], steps: [], duration: 0 };
  }
  const { w, h } = first;
  const k = placed.length;
  const slotPose = (place: number): Pose => poseOn(slots[place] ?? first, w, h);
  const cards: StageCard[] =
    mode === 'deal'
      ? persons.map((person, index) => ({
          id: `card-${String(index)}`,
          w,
          h,
          fronts: [person],
          start: poseOn(row[index] ?? first, w, h),
          isFaceDown: false,
          z: 10 + index,
        }))
      : slots.map((_, place) => ({
          id: `card-${String(place)}`,
          w,
          h,
          fronts: place < k ? [orderKey(placed[place] ?? '', place)] : [],
          start: slotPose(place),
          isFaceDown: place >= k,
          z: 5,
          isRaised: place === k - 1,
        }));
  const planner = new Planner(cards);
  const below = row[0] ?? first;
  const stackX = centreX(row, w);
  const stack = (level: number): CardBox => ({ x: stackX, y: below.y - level * STACK_STEP, w, h });
  let at = 0;
  // Which card lies on which place after dealing.
  const onPlace = new Map<number, string>(
    mode === 'deal' ? [] : cards.map((card, place): [number, string] => [place, card.id]),
  );
  if (mode !== 'turn') {
    let gathered: string[];
    if (mode === 'deal') {
      cards.forEach((card, index) => {
        at = Math.max(
          at,
          planner.flip(card.id, index * STAGE_MS.flipDownGap, STAGE_MS.flipDown, true),
        );
      });
      gathered = cards.map((card) => card.id);
    } else {
      // E1: the face-down cards from place k on go onto a stack below; their places show again.
      gathered = cards.slice(k).map((card) => card.id);
      gathered.forEach((id, index) => {
        const start = index * STAGE_MS.collectGap;
        planner.fade(placeTarget(k + index), start, STAGE_MS.placeIn, 0, PLACE_OPACITY);
        at = Math.max(
          at,
          planner.move(
            id,
            start,
            STAGE_MS.collect,
            poseOn(stack(index), w, h),
            STAGE_MS.collectLift,
            10 + index,
          ),
        );
      });
    }
    const mixed = gatherAndMix(planner, gathered, stack, { w, h }, at, rng, 0);
    // The stack is dealt top first, place by place.
    const dealt = [...mixed.order].reverse();
    const dealAt = mixed.end + STAGE_MS.beforeDeal;
    dealt.forEach((id, index) => {
      const place = mode === 'deal' ? index : k + index;
      onPlace.set(place, id);
      const landed = planner.move(
        id,
        dealAt + index * STAGE_MS.dealGap,
        STAGE_MS.deal,
        slotPose(place),
        STAGE_MS.dealLift,
        20 + place,
      );
      planner.fade(placeTarget(place), landed, 0, PLACE_OPACITY, 0);
      at = Math.max(at, landed);
    });
    at += STAGE_MS.afterDeal;
  }
  // The place drawn turns over and becomes the newest; the one before sinks.
  const turned = onPlace.get(k) ?? '';
  const before = onPlace.get(k - 1);
  if (before !== undefined) {
    planner.raise(before, at, false);
  }
  planner.raise(turned, at, true);
  let end = planner.flip(turned, at, STAGE_MS.flipUp, false, orderKey(result, k));
  const fronts = new Map<string, string>([[turned, orderKey(result, k)]]);
  if (last !== null) {
    // FA-LS-02: the last place follows by itself, without being lifted; then the order lies level.
    const lastCard = onPlace.get(k + 1) ?? '';
    fronts.set(lastCard, orderKey(last, k + 1));
    end = planner.flip(
      lastCard,
      end + STAGE_MS.lastDelay,
      STAGE_MS.flipUp,
      false,
      orderKey(last, k + 1),
    );
    planner.raise(turned, end + STAGE_MS.settleDelay, false);
  }
  return planner.reveal(cards, fronts);
}

/** Name of the label below a place of the starting resources ("Antippen"), by its index. */
export const labelTarget = (index: number): string => `label-${String(index)}`;

/** What the starting resources of a person need to plan their movement (design I2-D, page 8). */
export type ResourcesStageInput = {
  /** Before the first person draws, the five kinds lie face up in a row (keys of `fronts`). */
  readonly kinds: readonly string[] | null;
  readonly kindBoxes: readonly CardBox[];
  /** Card `level` of the face-down stack, from the bottom. */
  readonly stack: (level: number) => CardBox;
  /** Cards in the face-down stack before drawing, where the kinds do not lie open. */
  readonly stackBefore: number;
  readonly slots: readonly CardBox[];
  /** FA-SR-02: with replacement a card goes back onto the stack after each card dealt. */
  readonly isWithReplacement: boolean;
  readonly rng: RandomSource;
};

/** The five kinds of resources; the stack is complete with five cards. */
const KINDS = 5;
const PUT_BACK_EASE_OFFSET = 2.2;
const PUT_BACK_TURN = 16;
const PUT_BACK_RISE = -12;

/**
 * US-SR-01, design I2-D/I2-E: "Losen" on the starting resources of a person. Before the first
 * person the five kinds turn face down and gather into a stack; missing cards fly back onto it
 * from the side; the stack is mixed three times and all cards of the person go face down onto
 * the places, one after another. With replacement a card flies onto the stack after each one.
 * The person turns the cards over by hand (FA-SR-05), so nothing is revealed here.
 */
export function planResources({
  kinds,
  kindBoxes,
  stack,
  stackBefore,
  slots,
  isWithReplacement,
  rng,
}: ResourcesStageInput): StagePlan {
  const base = stack(0);
  const { w, h } = base;
  const initial = kinds === null ? stackBefore : kinds.length;
  const extra = KINDS - initial + (isWithReplacement ? slots.length : 0);
  const side = (level: number): Pose => ({
    ...poseOn(stack(level), w, h),
    x: base.x + w * PUT_BACK_EASE_OFFSET,
    y: stack(level).y + PUT_BACK_RISE,
    rotate: PUT_BACK_TURN,
  });
  const cards: StageCard[] = [
    ...Array.from({ length: initial }, (_, index): StageCard => ({
      id: `card-${String(index)}`,
      w,
      h,
      fronts: kinds === null ? [] : [kinds[index] ?? ''],
      start: poseOn(kinds === null ? stack(index) : (kindBoxes[index] ?? base), w, h),
      isFaceDown: kinds === null,
      z: 10 + index,
    })),
    ...Array.from({ length: extra }, (_, index): StageCard => ({
      id: `card-${String(initial + index)}`,
      w,
      h,
      fronts: [],
      start: side(0),
      isFaceDown: true,
      z: 10,
    })),
  ];
  const planner = new Planner(cards);
  let at = 0;
  let pile = cards.slice(0, initial).map((card) => card.id);
  if (kinds !== null) {
    pile.forEach((id, level) => {
      const start = level * STAGE_MS.kindsGap;
      planner.flip(id, start, STAGE_MS.kindsDown, true);
      at = Math.max(
        at,
        planner.move(id, start, STAGE_MS.kindsToStack, poseOn(stack(level), w, h), 0, 10 + level),
      );
    });
  }
  let spare = cards.slice(initial).map((card) => card.id);
  // A face-down card flies in from the side and lands on top of the stack, clearly visible (PO).
  const putBack = (start: number): number => {
    const [id, ...rest] = spare;
    if (id === undefined) {
      return start;
    }
    spare = rest;
    const level = pile.length;
    planner.move(id, start, 0, side(level), 0, 10 + level);
    planner.fade(id, start, 0, 0, 1);
    pile = [...pile, id];
    return planner.move(id, start, STAGE_MS.putBack, poseOn(stack(level), w, h));
  };
  while (pile.length < KINDS && spare.length > 0) {
    at = putBack(at);
  }
  const mixed = gatherAndMix(planner, pile, stack, { w, h }, at, rng);
  pile = mixed.order;
  at = mixed.end;
  slots.forEach((slot, index) => {
    const top = pile[pile.length - 1];
    if (top === undefined) {
      return;
    }
    pile = pile.slice(0, -1);
    const landed = planner.move(
      top,
      at,
      STAGE_MS.dealResource,
      poseOn(slot, w, h),
      STAGE_MS.dealResourceLift,
      40 + index,
    );
    planner.fade(placeTarget(index), landed, 0, PLACE_OPACITY, 0);
    planner.fade(labelTarget(index), landed, STAGE_MS.labelIn, 0, 1);
    at = isWithReplacement ? putBack(landed) : landed;
  });
  return planner.plan(cards);
}
