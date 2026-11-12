import { animate, type AnimationSequence } from 'motion/react';
import type { Pose, StagePlan, StageStep } from './stagePlan';

/** A movement playing: "Animation überspringen" completes it at once (US-IN-04 AK-2). */
export type StageRun = {
  readonly complete: () => void;
  readonly stop: () => void;
  readonly finished: Promise<unknown>;
};

// Curves of the reference I2-D: flights and moves ease out, turning over eases in and out.
const MOVE_EASE = [0.3, 0.7, 0.2, 1] as const;
const RAISE_PX = -10;

const seconds = (ms: number): number => ms / 1000;

// A switch at one moment. Motion joins two settings of the same value in a sequence into one
// change over the whole time between them; with its start value given, a switch stays a switch.
const SWITCH = 0.001;

// What each card shows and how high it lies, followed while the segments are built in time order.
type Tracked = { face: Map<string, string>; z: Map<string, number> };

function find(root: HTMLElement, selector: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(selector);
}

const cardOf = (root: HTMLElement, id: string): HTMLElement | null =>
  find(root, `[data-stage-card="${id}"]`);

// Every movement is one `transform` with the start value given: the browser then plays it on its
// own (Web Animations), smooth also while the page is busy, and nothing is read from the page
// before it starts (PO 12.11.2026: dealing lagged on the phone).
const poseTransform = (pose: Pose): string =>
  `translate(${String(pose.x)}px, ${String(pose.y)}px) rotate(${String(pose.rotate)}deg) scale(${String(pose.scale)})`;
const turnTransform = (degrees: number): string => `rotateY(${String(degrees)}deg)`;
const liftTransform = (y: number): string => `translateY(${String(y)}px)`;

// The keyframes of a move; with a lift the card passes the middle `lift` pixels higher.
function moveKeyframes(step: Extract<StageStep, { kind: 'move' }>): { transform: string[] } {
  const { from, to, lift } = step;
  if (lift === 0) {
    return { transform: [poseTransform(from), poseTransform(to)] };
  }
  const mid = (a: number, b: number): number => (a + b) / 2;
  const middle = {
    x: mid(from.x, to.x),
    y: mid(from.y, to.y) + lift,
    rotate: mid(from.rotate, to.rotate),
    scale: mid(from.scale, to.scale),
  };
  return { transform: [poseTransform(from), poseTransform(middle), poseTransform(to)] };
}

function segmentsOf(root: HTMLElement, step: StageStep, tracked: Tracked): AnimationSequence {
  const at = seconds(step.at);
  switch (step.kind) {
    case 'move': {
      const card = cardOf(root, step.card);
      if (card === null) {
        return [];
      }
      // A card that only changes its height in the stack does not move; a move without time is a
      // jump, e.g. a card put back that appears beside the stack.
      const isStill =
        step.from.x === step.to.x &&
        step.from.y === step.to.y &&
        step.from.rotate === step.to.rotate &&
        step.from.scale === step.to.scale;
      const segments: AnimationSequence = isStill
        ? []
        : [
            [
              card,
              moveKeyframes(step),
              { at, duration: Math.max(SWITCH, seconds(step.ms)), ease: [...MOVE_EASE] },
            ],
          ];
      const z = tracked.z.get(step.card);
      if (step.z !== undefined && z !== step.z) {
        segments.push([card, { zIndex: [z ?? step.z, step.z] }, { at, duration: SWITCH }]);
        tracked.z.set(step.card, step.z);
      }
      return segments;
    }
    case 'flip': {
      const card = cardOf(root, step.card);
      const inner = card === null ? null : find(card, '[data-stage-inner]');
      if (card === null || inner === null) {
        return [];
      }
      const half = seconds(step.at + step.ms / 2);
      // The face turned away is hidden from the middle of the turn on: WebKit does not hide it by
      // backface-visibility alone (Architecture 13.6, I2-D).
      const before = tracked.face.get(step.card);
      const after = step.toFaceDown ? 'back' : step.front;
      tracked.face.set(step.card, after);
      const faces: AnimationSequence = [
        ...card.querySelectorAll<HTMLElement>('[data-stage-face]'),
      ].flatMap((face): AnimationSequence => {
        const name = face.dataset.stageFace;
        const from = name === before ? 1 : 0;
        const to = name === after ? 1 : 0;
        return from === to ? [] : [[face, { opacity: [from, to] }, { at: half, duration: SWITCH }]];
      });
      return [
        [
          inner,
          {
            transform: step.toFaceDown
              ? [turnTransform(0), turnTransform(180)]
              : [turnTransform(180), turnTransform(360)],
          },
          { at, duration: seconds(step.ms), ease: 'easeInOut' },
        ],
        ...faces,
      ];
    }
    case 'fade': {
      const target = find(root, `[data-stage="${step.target}"]`);
      if (target === null) {
        return [];
      }
      const keyframes =
        step.rise === undefined
          ? { opacity: [step.from, step.to] }
          : {
              opacity: [step.from, step.to],
              transform: [liftTransform(step.rise), liftTransform(0)],
            };
      return [
        [target, keyframes, { at, duration: Math.max(SWITCH, seconds(step.ms)), ease: 'easeOut' }],
      ];
    }
    case 'raise': {
      const card = cardOf(root, step.card);
      const face = card === null ? null : find(card, '[data-stage-raise]');
      if (face === null) {
        return [];
      }
      const options = { at, duration: seconds(step.ms), ease: 'easeOut' } as const;
      const ring = find(face, '[data-stage-now]');
      const segments: AnimationSequence = [
        [
          face,
          {
            transform: step.isUp
              ? [liftTransform(0), liftTransform(RAISE_PX)]
              : [liftTransform(RAISE_PX), liftTransform(0)],
          },
          options,
        ],
      ];
      if (ring !== null) {
        segments.push([ring, { opacity: step.isUp ? [0, 1] : [1, 0] }, options]);
      }
      return segments;
    }
  }
}

/**
 * Lays the cards of `plan` onto their start and plays its steps with Motion (Architecture 13.6):
 * as Motion values, never as React state per frame. Elements are found below `root` by their
 * `data-stage-*` attributes.
 */
export function playStage(root: HTMLElement, plan: StagePlan): StageRun {
  for (const card of plan.cards) {
    const element = cardOf(root, card.id);
    const inner = element === null ? null : find(element, '[data-stage-inner]');
    if (element === null || inner === null) {
      continue;
    }
    // The start is set as it is, without reading the page; the movement starts from it.
    element.style.transform = poseTransform(card.start);
    element.style.zIndex = String(card.z);
    inner.style.transform = turnTransform(card.isFaceDown ? 180 : 0);
    // The newest order card lies lifted with its golden frame (design I2-D, Q3).
    for (const face of element.querySelectorAll<HTMLElement>('[data-stage-raise]')) {
      face.style.transform = liftTransform(card.isRaised === true ? RAISE_PX : 0);
      const ring = find(face, '[data-stage-now]');
      if (ring !== null) {
        ring.style.opacity = card.isRaised === true ? '1' : '0';
      }
    }
    for (const face of element.querySelectorAll<HTMLElement>('[data-stage-face]')) {
      const name = face.dataset.stageFace;
      const isShown = card.isFaceDown ? name === 'back' : name === card.fronts[0];
      face.style.opacity = isShown ? '1' : '0';
    }
  }
  // Faded elements start as their first fade begins, e.g. the name on the development card hidden.
  const started = new Set<string>();
  for (const step of [...plan.steps].sort((a, b) => a.at - b.at)) {
    const target = step.kind === 'fade' ? find(root, `[data-stage="${step.target}"]`) : null;
    if (step.kind === 'fade' && target !== null && !started.has(step.target)) {
      started.add(step.target);
      target.style.opacity = String(step.from);
      if (step.rise !== undefined) {
        target.style.transform = liftTransform(step.rise);
      }
    }
  }
  const tracked: Tracked = {
    face: new Map(
      plan.cards.map((card) => [card.id, card.isFaceDown ? 'back' : (card.fronts[0] ?? '')]),
    ),
    z: new Map(plan.cards.map((card) => [card.id, card.z])),
  };
  const sequence = [...plan.steps]
    .sort((a, b) => a.at - b.at)
    .flatMap((step) => segmentsOf(root, step, tracked));
  // The whole movement lasts as long as the plan, also where it ends with a pause.
  sequence.push([() => undefined, { at: seconds(plan.duration), duration: 0 }]);
  return animate(sequence);
}
