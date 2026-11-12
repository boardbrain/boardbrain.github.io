import { animate, type AnimationSequence } from 'motion/react';
import type { StageRun } from '../cards/playStage';
import {
  HIGHLIGHT_MS,
  type HighlightPart,
  type HighlightPlan,
  type HighlightStep,
} from './highlightPlan';

/**
 * A highlighting playing (design D-2). Besides completing it, it continues after the stop at two
 * places left ("Duell", US-IN-02 AK-6).
 */
export type HighlightRun = StageRun & {
  /** Starts the duel after the stop; does nothing at any other time. */
  readonly duel: () => void;
};

/** Names of the elements of a highlighting in `data-hl`, shared with `HighlightLayer`. */
export const HL = {
  dark: 'dark',
  hop: (hop: number): string => `hop-${String(hop)}`,
  light: (spot: string): string => `light-${spot}`,
  mark: (spot: string): string => `mark-${spot}`,
  ghost: (turn: number): string => `ghost-${String(turn)}`,
} as const;

const seconds = (ms: number): number => ms / 1000;
// A switch at one moment, with its start value given (see playStage).
const SWITCH = 0.001;
// The stone of the duel lands from 2.5 units above (design D-2, E4).
const GHOST_DROP = -2.5;
// A dot comes up from and goes out to 30 % of its size.
const DOT_SMALL = 0.3;

function element(root: Element, name: string): SVGElement | null {
  return root.querySelector<SVGElement>(`[data-hl="${name}"]`);
}

function segmentsOf(
  root: Element,
  step: HighlightStep<string>,
  plan: HighlightPlan<string>,
  isRoad: boolean,
): AnimationSequence {
  const at = seconds(step.at);
  const fade = (name: string, from: number, to: number, ms: number): AnimationSequence => {
    const target = element(root, name);
    return target === null
      ? []
      : [[target, { opacity: [from, to] }, { at, duration: Math.max(SWITCH, seconds(ms)) }]];
  };
  // A dot grows while it comes up and shrinks while it goes out; an edge only fades.
  const dot = (spot: string, isOn: boolean, ms: number): AnimationSequence => {
    const target = element(root, HL.light(spot));
    if (target === null) {
      return [];
    }
    const keyframes = isRoad
      ? { opacity: isOn ? [0, 1] : [1, 0] }
      : {
          opacity: isOn ? [0, 1] : [1, 0],
          scale: isOn ? [DOT_SMALL, 1] : [1, DOT_SMALL],
        };
    return [[target, keyframes, { at, duration: seconds(ms), ease: 'easeOut' }]];
  };
  switch (step.kind) {
    case 'hop':
      return fade(HL.hop(step.hop), 0, 1, 0);
    case 'hop-out':
      return fade(HL.hop(step.hop), 1, 0, HIGHLIGHT_MS.hopOut);
    case 'dark':
      return fade(HL.dark, 0, 1, HIGHLIGHT_MS.darkIn);
    case 'light':
      return plan.spots.flatMap((spot) => dot(spot, true, HIGHLIGHT_MS.lightIn));
    case 'out':
      return dot(step.spot, false, isRoad ? HIGHLIGHT_MS.glowOut : HIGHLIGHT_MS.dotOut);
    case 'mark':
      return [...fade(HL.light(step.spot), 1, 0, 0), ...fade(HL.mark(step.spot), 0, 1, 0)];
    case 'ghost': {
      const target = element(root, HL.ghost(step.turn));
      if (target === null) {
        return [];
      }
      const before = plan.duel?.part.steps
        .filter((other) => other.kind === 'ghost' && other.at < step.at)
        .at(-1);
      return [
        ...(before?.kind === 'ghost' ? fade(HL.ghost(before.turn), 1, 0, 0) : []),
        [target, { opacity: [0, 1] }, { at, duration: SWITCH }],
        [
          target,
          { y: [GHOST_DROP, 0] },
          { at, duration: seconds(HIGHLIGHT_MS.ghostDrop), ease: 'easeOut' },
        ],
      ];
    }
  }
}

function play(
  root: Element,
  part: HighlightPart<string>,
  plan: HighlightPlan<string>,
  isRoad: boolean,
): ReturnType<typeof animate> {
  const sequence = part.steps.flatMap((step) => segmentsOf(root, step, plan, isRoad));
  // The part lasts as long as planned, also where it ends with a rest.
  sequence.push([() => undefined, { at: seconds(part.duration), duration: 0 }]);
  return animate(sequence);
}

/**
 * Plays `plan` on the elements below `root` (`data-hl`, see `HighlightLayer`) with Motion
 * (Architecture 13.6): the lead, then, with a duel, `onStop` and the duel after `duel()`. Every
 * element starts hidden. Completing it at any time ends the whole highlighting at once
 * (US-IN-04).
 */
export function playHighlight(
  root: Element,
  plan: HighlightPlan<string>,
  isRoad: boolean,
  onStop: () => void,
): HighlightRun {
  for (const target of root.querySelectorAll<SVGElement>('[data-hl]')) {
    target.style.opacity = '0';
  }
  let isOver = false;
  let isWaiting = false;
  let finish: () => void = () => undefined;
  const finished = new Promise<void>((resolve) => {
    finish = () => {
      if (!isOver) {
        isOver = true;
        resolve();
      }
    };
  });
  let current = play(root, plan.lead, plan, isRoad);
  const duel = plan.duel;
  // A part stopped because the page closed has nothing more to report.
  const ignore = (): void => undefined;
  current.finished.then(() => {
    if (isOver) {
      return;
    }
    if (duel === null) {
      finish();
    } else {
      isWaiting = true;
      onStop();
    }
  }, ignore);
  return {
    finished,
    duel: () => {
      if (!isWaiting || isOver || duel === null) {
        return;
      }
      isWaiting = false;
      current = play(root, duel.part, plan, isRoad);
      current.finished.then(finish, ignore);
    },
    complete: () => {
      if (!isOver) {
        current.complete();
        finish();
      }
    },
    stop: () => {
      isOver = true;
      current.stop();
    },
  };
}
