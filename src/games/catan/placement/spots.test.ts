import { aCatanSetup, runCatanGeneration } from '@tests/support/catanGeneration';
import { defined } from '@tests/support/defined';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import { describe, expect, it } from 'vitest';
import { CATAN_BOARD } from '../board/board';
import type { CatanBuildingStep, CatanRoadStep, CatanStep } from '../generation/steps';
import { catanPlacementSpots } from './spots';

function placedSteps(seed: number, edition: 'base' | 'cities-and-knights'): CatanStep[] {
  const generation = runCatanGeneration(aCatanSetup(4, { edition }), new SeededRandomSource(seed));
  return generation.steps.map((record) => record.step);
}

const isPiece = (step: CatanStep): step is CatanBuildingStep | CatanRoadStep =>
  step.kind === 'building' || step.kind === 'road';
const isBuilding = (step: CatanStep): step is CatanBuildingStep => step.kind === 'building';

describe('US-IN-02 valid places for the highlighting', () => {
  it('AK-2: a building may only light up on free inland vertices with no building next to them', () => {
    for (const seed of [1, 2, 3]) {
      const steps = placedSteps(seed, 'base');
      for (const step of steps.filter((candidate) => candidate.kind === 'building')) {
        const earlier = steps.flatMap((other) =>
          other.kind === 'building' && other.index < step.index ? [other.result] : [],
        );
        const spots = catanPlacementSpots(steps, step);

        expect(spots?.kind).toBe('building');
        const vertices = spots?.kind === 'building' ? spots.vertices : [];
        expect(vertices.length).toBeGreaterThan(0);
        for (const vertex of vertices) {
          const node = defined(CATAN_BOARD.vertices.get(vertex), 'a vertex of the board');
          expect(node.landHexCount).toBe(3);
          expect(earlier).not.toContain(vertex);
          expect(node.neighbours.some((neighbour) => earlier.includes(neighbour))).toBe(false);
        }
      }
    }
  });

  it('AK-2: the drawn place is always one of them, also in Cities & Knights', () => {
    for (const edition of ['base', 'cities-and-knights'] as const) {
      const steps = placedSteps(7, edition);
      const pieces = steps.filter(isPiece);
      expect(pieces.length).toBeGreaterThan(0);
      for (const piece of pieces) {
        const spots = catanPlacementSpots(steps, piece);
        const all = spots === null ? [] : spots.kind === 'building' ? spots.vertices : spots.edges;
        expect(all).toContain(piece.result);
      }
    }
  });

  it('AK-2: the first building may light up on all 24 inland vertices', () => {
    const steps = placedSteps(4, 'base');
    const first = defined(
      steps.filter(isBuilding).find((step) => step.index === 0),
      'the first building',
    );
    const spots = catanPlacementSpots(steps, first);

    expect(spots?.kind === 'building' ? spots.vertices : []).toHaveLength(24);
  });

  it('AK-2: a road may only light up on the edges at its own building', () => {
    const steps = placedSteps(5, 'base');
    for (const road of steps.filter((step) => step.kind === 'road')) {
      const building = defined(
        steps.filter(isBuilding).find((step) => step.index === road.index),
        'the building of the road',
      );
      const vertex = defined(CATAN_BOARD.vertices.get(building.result), 'its vertex');
      const spots = catanPlacementSpots(steps, road);

      expect(spots).toEqual({ kind: 'road', building: vertex.id, edges: vertex.edges });
    }
  });

  it('gives no places for a road whose building is missing', () => {
    const steps = placedSteps(6, 'base');
    const road = defined(
      steps.find((step) => step.kind === 'road'),
      'a road',
    );
    const withoutBuildings = steps.filter((step) => step.kind !== 'building');

    expect(catanPlacementSpots(withoutBuildings, road)).toBeNull();
  });
});
