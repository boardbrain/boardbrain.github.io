import { chiSquareAgainstUniform, criticalValue } from '@tests/support/chiSquare';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import { describe, expect, it } from 'vitest';
import {
  growingShares,
  HIGHLIGHT_MS,
  planHighlight,
  shuffled,
  type HighlightPlan,
  type HighlightStep,
} from './highlightPlan';

const SPOTS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;
type Spot = (typeof SPOTS)[number];
const RUNS = 6000;

function plans(
  count: number,
  make: (rng: SeededRandomSource) => HighlightPlan<Spot>,
  seed = 20261112,
): HighlightPlan<Spot>[] {
  const rng = new SeededRandomSource(seed);
  return Array.from({ length: count }, () => make(rng));
}

function countBy<T>(values: readonly T[], keys: readonly T[]): number[] {
  return keys.map((key) => values.filter((value) => value === key).length);
}

function isUniform(counts: readonly number[]): boolean {
  return chiSquareAgainstUniform(counts) < criticalValue(counts.length - 1);
}

const allSteps = (plan: HighlightPlan<Spot>): HighlightStep<Spot>[] => [
  ...plan.lead.steps,
  ...(plan.duel?.part.steps ?? []),
];

const spotOf = (step: HighlightStep<Spot>): Spot | null => ('spot' in step ? step.spot : null);

// The places still lit after `count` places went out in the lead of a tension plan.
function litAfter(plan: HighlightPlan<Spot>, count: number): string {
  const out = plan.lead.steps.flatMap((step) => (step.kind === 'out' ? [step.spot] : []));
  return plan.spots.filter((spot) => !out.slice(0, count).includes(spot)).join('');
}

describe('US-IN-02 highlighting before a piece is fixed (design D-2)', () => {
  it('AK-2: only the valid places given light up, in every kind of highlighting', () => {
    const rng = new SeededRandomSource(3);
    const valid: Spot[] = ['b', 'd', 'e'];
    for (const piece of ['building', 'road'] as const) {
      for (const isTension of [false, true]) {
        for (let run = 0; run < 200; run++) {
          const plan = planHighlight(valid, 'd', piece, isTension, rng);
          const lit = allSteps(plan).flatMap((step) => {
            const spot = spotOf(step);
            return spot === null ? [] : [spot];
          });
          expect(lit.every((spot) => valid.includes(spot))).toBe(true);
          expect(plan.hops.every((hop) => valid.includes(hop))).toBe(true);
        }
      }
    }
  });

  it('AK-2: a result missing from the places is added, so the light always lands', () => {
    const plan = planHighlight(['a', 'b'], 'c', 'building', false, new SeededRandomSource(1));

    expect(plan.spots).toEqual(['a', 'b', 'c']);
    expect(plan.hops.at(-1)).toBe('c');
  });

  it('AK-4: the running light hops 8 to 13 times over a building, slows down and lands on the result', () => {
    for (const plan of plans(300, (rng) => planHighlight(SPOTS, 'c', 'building', false, rng))) {
      expect(plan.kind).toBe('run');
      expect(plan.hops.length - 1).toBeGreaterThanOrEqual(8);
      expect(plan.hops.length - 1).toBeLessThanOrEqual(13);
      expect(plan.hops.at(-1)).toBe('c');
      // No hop stays on its place, except the landing on the place the ring is on already.
      plan.hops.slice(1, -1).forEach((hop, index) => {
        expect(hop).not.toBe(plan.hops[index]);
      });
      const starts = plan.lead.steps.flatMap((step) => (step.kind === 'hop' ? [step.at] : []));
      const gaps = starts.slice(1).map((at, index) => at - (starts[index] ?? 0));
      gaps.slice(1).forEach((gap, index) => {
        expect(gap).toBeGreaterThan(gaps[index] ?? 0);
      });
      expect(starts.at(-1)).toBeLessThanOrEqual(HIGHLIGHT_MS.runBuilding + 1e-9);
      expect(plan.lead.duration).toBe(HIGHLIGHT_MS.runBuilding + HIGHLIGHT_MS.hold);
      expect(plan.duel).toBeNull();
      expect(plan.isDark).toBe(false);
    }
  });

  it('AK-4: a road hops 3 to 5 times in 1.2 s', () => {
    for (const plan of plans(300, (rng) =>
      planHighlight(['a', 'b', 'c'], 'b', 'road', false, rng),
    )) {
      expect(plan.hops.length - 1).toBeGreaterThanOrEqual(3);
      expect(plan.hops.length - 1).toBeLessThanOrEqual(5);
      expect(plan.lead.duration).toBe(HIGHLIGHT_MS.runRoad + HIGHLIGHT_MS.hold);
    }
  });

  it('AK-4: the ring left behind fades as the next one appears; a landing on its own place adds nothing', () => {
    const all = plans(400, (rng) => planHighlight(['a', 'b', 'c'], 'a', 'road', false, rng));
    const stays = all.find((plan) => plan.hops.at(-1) === plan.hops.at(-2));
    const moves = all.find((plan) => plan.hops.at(-1) !== plan.hops.at(-2));

    expect(stays).toBeDefined();
    expect(moves).toBeDefined();
    for (const plan of [stays, moves]) {
      if (plan === undefined) {
        continue;
      }
      const shown = plan.lead.steps.filter((step) => step.kind === 'hop');
      const out = plan.lead.steps.filter((step) => step.kind === 'hop-out');
      expect(out).toHaveLength(shown.length - 1);
      expect(shown.at(-1)?.spot).toBe('a');
    }
  });

  it('AK-3: every station of the running light is the result with 1/n, whatever the result', () => {
    for (const result of ['a', 'f'] as const) {
      const all = plans(RUNS, (rng) => planHighlight(SPOTS, result, 'building', false, rng));
      // At least 8 hops before the landing: stations 0 to 7 exist in every plan.
      for (let station = 0; station < 8; station++) {
        const counts = countBy(
          all.map((plan) => plan.hops[station]),
          SPOTS,
        );
        expect(isUniform(counts), `station ${String(station)}: ${counts.join(' ')}`).toBe(true);
      }
    }
  });

  it('AK-3: the first light tells nothing, also for a road with three edges', () => {
    for (const result of ['a', 'c'] as const) {
      const all = plans(RUNS, (rng) => planHighlight(['a', 'b', 'c'], result, 'road', false, rng));
      expect(
        isUniform(
          countBy(
            all.map((plan) => plan.hops[0]),
            ['a', 'b', 'c'],
          ),
        ),
      ).toBe(true);
    }
  });

  it('AK-6: tension for a building darkens, lights all, lets all but two go out and stops for the duel', () => {
    for (const plan of plans(300, (rng) => planHighlight(SPOTS, 'b', 'building', true, rng))) {
      expect(plan.kind).toBe('tension');
      expect(plan.isDark).toBe(true);
      expect(plan.lead.steps.slice(0, 2).map((step) => step.kind)).toEqual(['dark', 'light']);
      const out = plan.lead.steps.flatMap((step) => (step.kind === 'out' ? [step.spot] : []));
      expect(out).toHaveLength(SPOTS.length - 2);
      expect(out).not.toContain('b');
      const duel = plan.duel;
      expect(duel).not.toBeNull();
      if (duel === null) {
        continue;
      }
      expect(duel.rival).not.toBe('b');
      expect(out).not.toContain(duel.rival);
      expect(plan.lead.duration).toBeCloseTo(
        HIGHLIGHT_MS.rest + HIGHLIGHT_MS.tensionBuilding * 0.55,
        6,
      );
      // The duel: the stone alternates 5 to 8 times between both, then lands on the result.
      expect(duel.turns.length - 1).toBeGreaterThanOrEqual(5);
      expect(duel.turns.length - 1).toBeLessThanOrEqual(8);
      expect(duel.turns.at(-1)).toBe('b');
      duel.turns.slice(1, -1).forEach((turn, index) => {
        expect(turn).not.toBe(duel.turns[index]);
      });
      const last = duel.part.steps.at(-1);
      expect(last?.kind).toBe('out');
      expect(last !== undefined && 'spot' in last ? last.spot : null).toBe(duel.rival);
      expect(duel.part.steps[0]?.at).toBe(HIGHLIGHT_MS.beforeDuel);
    }
  });

  it('AK-6: the stone in the duel lands only once on the same place', () => {
    const all = plans(400, (rng) => planHighlight(['a', 'b'], 'a', 'building', true, rng));
    for (const plan of all) {
      const ghosts = plan.duel?.part.steps.filter((step) => step.kind === 'ghost') ?? [];
      ghosts.slice(1).forEach((ghost, index) => {
        expect(ghost.spot).not.toBe(ghosts[index]?.spot);
      });
    }
  });

  it('AK-3: in the duel, every station is the result with 1/2 and the rival is purely random', () => {
    for (const result of ['a', 'd'] as const) {
      const all = plans(RUNS, (rng) => planHighlight(SPOTS, result, 'building', true, rng));
      const others = SPOTS.filter((spot) => spot !== result);
      expect(
        isUniform(
          countBy(
            all.map((plan) => plan.duel?.rival),
            others,
          ),
        ),
      ).toBe(true);
      for (let station = 0; station < 5; station++) {
        const hits = all.filter((plan) => plan.duel?.turns[station] === result).length;
        expect(isUniform([hits, all.length - hits]), `station ${String(station)}`).toBe(true);
      }
    }
  });

  it('AK-3: while places go out, every set still lit with the result is equally frequent', () => {
    const spots = ['a', 'b', 'c', 'd', 'e'] as const;
    for (const result of ['a', 'e'] as const) {
      const rng = new SeededRandomSource(77);
      const all = Array.from({ length: RUNS }, () =>
        planHighlight(spots, result, 'building', true, rng),
      );
      expect(new Set(all.map((plan) => litAfter(plan, 0)))).toEqual(new Set(['abcde']));
      // After k places went out, 5 − k are lit: the result and 4 − k of the 4 others.
      for (let count = 1; count <= spots.length - 2; count++) {
        const sets = all.map((plan) => litAfter(plan, count));
        const kinds = [...new Set(sets)].sort();
        expect(kinds.every((set) => set.includes(result))).toBe(true);
        expect(kinds).toHaveLength([1, 4, 6, 4][count] ?? 0);
        expect(isUniform(countBy(sets, kinds)), `after ${String(count)}`).toBe(true);
      }
    }
  });

  it('AK-7: tension for a road darkens and lets the edges go out one by one, without a duel', () => {
    for (const plan of plans(300, (rng) =>
      planHighlight(['a', 'b', 'c'], 'c', 'road', true, rng),
    )) {
      expect(plan.isDark).toBe(true);
      expect(plan.duel).toBeNull();
      const kinds = plan.lead.steps.map((step) => step.kind);
      expect(kinds).toEqual(['dark', 'light', 'out', 'out', 'mark']);
      expect(plan.lead.steps.at(-1)).toEqual({
        kind: 'mark',
        spot: 'c',
        at: HIGHLIGHT_MS.rest + HIGHLIGHT_MS.tensionRoad * 0.85,
      });
      expect(plan.lead.duration).toBeCloseTo(
        HIGHLIGHT_MS.rest + HIGHLIGHT_MS.tensionRoad * 0.85 + HIGHLIGHT_MS.hold,
        6,
      );
    }
  });

  it('AK-3: the first edge to go out is any of the others with the same probability', () => {
    const edges = ['a', 'b', 'c'] as const;
    const all = plans(RUNS, (rng) => planHighlight(edges, 'b', 'road', true, rng));
    const first = all.map((plan) => plan.lead.steps.find((step) => step.kind === 'out'));
    expect(
      isUniform(
        countBy(
          first.map((step) => (step === undefined ? null : spotOf(step))),
          ['a', 'c'],
        ),
      ),
    ).toBe(true);
  });

  it('AK-6: with a single valid place there is nothing to decide and no duel', () => {
    const plan = planHighlight(['a'], 'a', 'building', true, new SeededRandomSource(9));

    expect(plan.duel).toBeNull();
    expect(plan.lead.steps.map((step) => step.kind)).toEqual(['dark', 'light', 'mark']);
  });

  it('plans the same highlighting from the same seed', () => {
    const one = planHighlight(SPOTS, 'a', 'building', true, new SeededRandomSource(42));
    const two = planHighlight(SPOTS, 'a', 'building', true, new SeededRandomSource(42));

    expect(one).toEqual(two);
  });

  it('shares grow by their factor and add up to 1', () => {
    const shares = growingShares(4, 1.3);

    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1, 12);
    expect((shares[1] ?? 0) / (shares[0] ?? 1)).toBeCloseTo(1.3, 12);
    expect(growingShares(0, 1.3)).toEqual([]);
  });

  it('a shuffled list keeps its items', () => {
    const list = shuffled(SPOTS, new SeededRandomSource(5));

    expect([...list].sort()).toEqual([...SPOTS]);
    expect(shuffled([], new SeededRandomSource(5))).toEqual([]);
  });
});
