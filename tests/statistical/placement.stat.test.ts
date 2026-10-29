import type { VertexId } from '@/games/catan';
import {
  drawBuilding,
  drawRoad,
  placementSchedule,
  RetryOnDeadEnd,
  validVertices,
} from '@/games/catan';
import {
  CATAN_BOARD,
  CATAN_EDITIONS,
  CATAN_STANDARD_RULES,
  catanPlacementRounds,
} from '@/games/catan';
import { CryptoRandomSource } from '@/infra/random/cryptoRandomSource';
import { describe, expect, it } from 'vitest';
import { chiSquareAgainstUniform, criticalValue } from '../support/chiSquare';
import { defined } from '../support/defined';
import { centreBlockers } from '../support/placementCases';

// NFA-ZF-02: 100,000 draws per check, chi-square against the uniform distribution, α = 0.001.
const DRAWS = 100_000;
const board = CATAN_BOARD;
const rules = CATAN_STANDARD_RULES;

const centreCorner = defined(
  [...board.vertices.values()].find((vertex) => vertex.hexes.some((h) => h.q === 0 && h.r === 0))
    ?.id,
  'a centre corner',
);

// Fixed board states: empty, one building in the centre, two buildings at the edge of the
// inland vertices, and four of the six vertices of the dead end of Requirements 6.2.4.
const STATES: readonly { name: string; occupied: readonly VertexId[] }[] = [
  { name: 'empty board', occupied: [] },
  { name: 'one building on a centre corner', occupied: [centreCorner] },
  {
    name: 'two buildings on the first and the last inland vertex',
    occupied: [
      defined(board.inlandVertices[0], 'the first inland vertex'),
      defined(board.inlandVertices.at(-1), 'the last inland vertex'),
    ],
  },
  { name: 'four vertices of the dead end', occupied: centreBlockers(board).slice(0, 4) },
];

describe('US-PL-02 Draw a building with the real random source', () => {
  it.each(STATES)('AK-3: every valid vertex is equally likely: $name', ({ occupied }) => {
    const valid = validVertices(board, rules, occupied);
    const rng = new CryptoRandomSource();
    const counts = new Map<VertexId, number>(valid.map((vertex) => [vertex, 0]));

    for (let draw = 0; draw < DRAWS; draw++) {
      const vertex = defined(drawBuilding(board, rules, occupied, rng), 'a valid vertex');
      counts.set(vertex, (counts.get(vertex) ?? 0) + 1);
    }

    expect(counts.size).toBe(valid.length);
    expect(chiSquareAgainstUniform([...counts.values()])).toBeLessThan(
      criticalValue(valid.length - 1),
    );
  });
});

describe('US-PL-03 Draw a road with the real random source', () => {
  it('AK-1: each of the three edges at a building is equally likely', () => {
    const rng = new CryptoRandomSource();
    const counts = new Map<string, number>();

    for (let draw = 0; draw < DRAWS; draw++) {
      const edge = drawRoad(board, centreCorner, rng);
      counts.set(edge, (counts.get(edge) ?? 0) + 1);
    }

    expect(counts.size).toBe(3);
    expect(chiSquareAgainstUniform([...counts.values()])).toBeLessThan(criticalValue(2));
  });
});

// 100,000 complete placements take about 5 to 6 seconds on a development PC, right at the default
// limit of 5 seconds; the measurement gets a limit of its own instead of failing by chance.
const MEASUREMENT_TIMEOUT_MS = 60_000;

describe('NFA-EW-08 Dead ends with 4 persons', () => {
  it.for(CATAN_EDITIONS)(
    'measures how often a placement is drawn again hidden (%s)',
    { timeout: MEASUREMENT_TIMEOUT_MS },
    async (edition, { annotate }) => {
      // Architecture 14.4: 100,000 complete placements; the result goes into
      // docs/test-reports/sackgassen.md.
      const planner = new RetryOnDeadEnd();
      const rng = new CryptoRandomSource();
      const total = placementSchedule(
        ['P1', 'P2', 'P3', 'P4'],
        catanPlacementRounds(edition),
      ).length;
      const attemptCounts = new Map<number, number>();

      for (let placement = 0; placement < DRAWS; placement++) {
        const { attempts, buildings } = planner.plan({ board, rules, fixed: [], total }, rng);
        expect(buildings).toHaveLength(total);
        attemptCounts.set(attempts, (attemptCounts.get(attempts) ?? 0) + 1);
      }

      const runs = [...attemptCounts].reduce((sum, [attempts, count]) => sum + attempts * count, 0);
      const retried = DRAWS - (attemptCounts.get(1) ?? 0);
      const distribution = [...attemptCounts]
        .sort(([a], [b]) => a - b)
        .map(([attempts, count]) => `${String(attempts)}: ${String(count)}`)
        .join(', ');
      await annotate(
        [
          `Dead ends, 4 persons, ${edition}, ${String(DRAWS)} placements:`,
          `  runs in total: ${String(runs)}, dead-end runs: ${String(runs - DRAWS)} ` +
            `(${((100 * (runs - DRAWS)) / runs).toFixed(2)} % of all runs)`,
          `  placements with at least one hidden redraw: ${String(retried)} ` +
            `(${((100 * retried) / DRAWS).toFixed(2)} %)`,
          `  attempts per placement: mean ${(runs / DRAWS).toFixed(4)}, ` +
            `max ${String(Math.max(...attemptCounts.keys()))}`,
          `  distribution (attempts: placements): ${distribution}`,
          '',
        ].join('\n'),
      );

      expect(total).toBe(8);
    },
  );
});
