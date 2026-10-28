import { assert } from '@/core/shared';
import { addHex, hexesWithin, hexKey, type HexCoord } from './hexCoord';

declare const boardIdBrand: unique symbol;

type BoardId<B extends string> = string & { readonly [boardIdBrand]: B };

/**
 * Identifier of a vertex, derived from the three hexes that meet there. The same on every
 * device, so stored placements stay valid (Architecture 5.2).
 */
export type VertexId = BoardId<'VertexId'>;

/**
 * Identifier of an edge, derived from its two vertices.
 */
export type EdgeId = BoardId<'EdgeId'>;

/**
 * A hex of the board. `content` is reserved for terrain and number token and stays empty in
 * version 1 (FA-PL-08, NFA-EW-03).
 */
export type Hex = {
  readonly coord: HexCoord;
  readonly content: null;
};

/**
 * A vertex where three hexes meet (Architecture 5.2).
 */
export type Vertex = {
  readonly id: VertexId;
  /** The three hexes that meet here; hexes outside the board count as water. */
  readonly hexes: readonly [HexCoord, HexCoord, HexCoord];
  /** How many of the three hexes lie on the board; 3 means inland vertex (Requirements 6.1). */
  readonly landHexCount: number;
  readonly neighbours: readonly VertexId[];
  readonly edges: readonly EdgeId[];
};

/**
 * An edge between two neighbouring vertices, the place of a road.
 */
export type Edge = {
  readonly id: EdgeId;
  readonly vertices: readonly [VertexId, VertexId];
  /** The two hexes on either side of the edge. */
  readonly hexes: readonly [HexCoord, HexCoord];
  /** 1 for an edge along the coast, 2 for an edge between two land hexes. */
  readonly landHexCount: number;
};

/**
 * Board geometry computed from a list of hex coordinates (Architecture 5.2, NFA-EW-05).
 */
export type Board = {
  /** Row by row from top to bottom, within a row from left to right. */
  readonly hexes: readonly Hex[];
  readonly vertices: ReadonlyMap<VertexId, Vertex>;
  readonly edges: ReadonlyMap<EdgeId, Edge>;
  /** Vertices with three land hexes, the only places for buildings in mode "Standard". */
  readonly inlandVertices: readonly VertexId[];
  /** Every coastline as a closed loop of vertices in order; the standard board has one. */
  readonly coastlines: readonly (readonly VertexId[])[];
};

const E: HexCoord = { q: 1, r: 0 };
const NE: HexCoord = { q: 1, r: -1 };
const NW: HexCoord = { q: 0, r: -1 };
const W: HexCoord = { q: -1, r: 0 };
const SW: HexCoord = { q: -1, r: 1 };
const SE: HexCoord = { q: 0, r: 1 };

// The six sides of a hex clockwise from the upper right. A side lies between the corners
// (hex, a, b) and (hex, b, c); across it lies the neighbour b. The first corner of side 0 is
// the top tip.
const SIDES: readonly (readonly [HexCoord, HexCoord, HexCoord])[] = [
  [NW, NE, E],
  [NE, E, SE],
  [E, SE, SW],
  [SE, SW, W],
  [SW, W, NW],
  [W, NW, NE],
];

function isVertexId(value: string): value is VertexId {
  return value.startsWith('v:');
}

function isEdgeId(value: string): value is EdgeId {
  return value.startsWith('e:');
}

function vertexIdOf(hexes: readonly HexCoord[]): VertexId {
  const id = `v:${hexes.map(hexKey).sort().join('|')}`;
  assert(isVertexId(id), 'vertex ids start with v:');
  return id;
}

function edgeIdOf(a: VertexId, b: VertexId): EdgeId {
  const id = `e:${[a, b].sort().join('/')}`;
  assert(isEdgeId(id), 'edge ids start with e:');
  return id;
}

type VertexDraft = {
  readonly hexes: readonly [HexCoord, HexCoord, HexCoord];
  readonly neighbours: Set<VertexId>;
  readonly edges: EdgeId[];
};

// Walks along the coast edges; every coast vertex has exactly two of them.
function traceCoastlines(edges: ReadonlyMap<EdgeId, Edge>): VertexId[][] {
  const along = new Map<VertexId, VertexId[]>();
  for (const edge of edges.values()) {
    if (edge.landHexCount !== 1) {
      continue;
    }
    const [a, b] = edge.vertices;
    along.set(a, [...(along.get(a) ?? []), b]);
    along.set(b, [...(along.get(b) ?? []), a]);
  }
  const visited = new Set<VertexId>();
  const loops: VertexId[][] = [];
  for (const start of along.keys()) {
    if (visited.has(start)) {
      continue;
    }
    const loop: VertexId[] = [];
    let previous: VertexId | undefined;
    let current: VertexId | undefined = start;
    while (current !== undefined && !visited.has(current)) {
      visited.add(current);
      loop.push(current);
      const next: VertexId | undefined = (along.get(current) ?? []).find(
        (candidate) => candidate !== previous && !visited.has(candidate),
      );
      previous = current;
      current = next;
    }
    loops.push(loop);
  }
  assert(
    [...along.values()].every((neighbours) => neighbours.length === 2),
    'every coast vertex lies on exactly two coast edges',
  );
  return loops;
}

/**
 * Computes hexes, vertices, edges, neighbourhoods, inland vertices and coastlines for any
 * set of hexes (Architecture 5.2, NFA-EW-05).
 * @throws {InvariantError} if a hex occurs twice.
 */
export function createBoard(coords: readonly HexCoord[]): Board {
  const land = new Set(coords.map(hexKey));
  assert(land.size === coords.length, 'every hex occurs only once');
  const isLand = (coord: HexCoord): boolean => land.has(hexKey(coord));
  const countLand = (hexes: readonly HexCoord[]): number => hexes.filter(isLand).length;

  const drafts = new Map<VertexId, VertexDraft>();
  const edges = new Map<EdgeId, Edge>();
  const addVertex = (hexes: readonly [HexCoord, HexCoord, HexCoord]): [VertexId, VertexDraft] => {
    const id = vertexIdOf(hexes);
    const draft = drafts.get(id) ?? { hexes, neighbours: new Set<VertexId>(), edges: [] };
    drafts.set(id, draft);
    return [id, draft];
  };

  for (const hex of coords) {
    for (const [a, b, c] of SIDES) {
      const [from, fromDraft] = addVertex([hex, addHex(hex, a), addHex(hex, b)]);
      const [to, toDraft] = addVertex([hex, addHex(hex, b), addHex(hex, c)]);
      const id = edgeIdOf(from, to);
      if (edges.has(id)) {
        continue;
      }
      const hexes: readonly [HexCoord, HexCoord] = [hex, addHex(hex, b)];
      edges.set(id, { id, vertices: [from, to], hexes, landHexCount: countLand(hexes) });
      fromDraft.neighbours.add(to);
      fromDraft.edges.push(id);
      toDraft.neighbours.add(from);
      toDraft.edges.push(id);
    }
  }

  const vertices = new Map<VertexId, Vertex>(
    [...drafts].map(([id, draft]) => [
      id,
      {
        id,
        hexes: draft.hexes,
        landHexCount: countLand(draft.hexes),
        neighbours: [...draft.neighbours],
        edges: draft.edges,
      },
    ]),
  );
  return {
    hexes: coords.map((coord) => ({ coord, content: null })),
    vertices,
    edges,
    inlandVertices: [...vertices.values()]
      .filter((vertex) => vertex.landHexCount === 3)
      .map((vertex) => vertex.id),
    coastlines: traceCoastlines(edges),
  };
}

/**
 * Radius of the standard board: all hexes at most two steps from the centre, rows 3, 4, 5,
 * 4, 3 (FA-PL-07).
 */
export const STANDARD_BOARD_RADIUS = 2;

/**
 * The standard board with 19 hexes, 54 vertices, 72 edges and 24 inland vertices
 * (Requirements 6.1, FA-PL-07).
 */
export const STANDARD_BOARD: Board = createBoard(hexesWithin(STANDARD_BOARD_RADIUS));
