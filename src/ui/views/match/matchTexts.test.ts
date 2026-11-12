import { aCatanSetup, CATAN_TEST_PERSONS } from '@tests/support/catanGeneration';
import { defined } from '@tests/support/defined';
import { aGroup } from '@tests/support/masterDataFakes';
import { aSessionAfter, aStoredSession } from '@tests/support/sessionFakes';
import { describe, expect, it } from 'vitest';
import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import { CATAN_DEFAULT_OPTIONS, skipCatanPlacement, type CatanStep } from '@/games/catan';
import { editionName, pieceName, recapLine, repeatLines, stepTitle } from './matchTexts';
import { preparationFor, type MatchPreparation } from './preparation';

// Cities & Knights with four persons, complete: 3 draws (0–2), 3 spins (3–5), settlements and
// their roads (6–13), cities and their roads (14–21).
const KNIGHTS = aCatanSetup(4, { edition: 'cities-and-knights' });
const COMPLETE = aSessionAfter(KNIGHTS, 22);
const NAMES = new Map(
  CATAN_TEST_PERSONS.map((person, index) => [person, `Person ${String(index)}`]),
);

function stepAt(session: StoredSession, index: number): CatanStep {
  return defined(session.generation.steps[index], 'step').step;
}

function nameOf(personId: PersonId): string {
  return NAMES.get(personId) ?? '';
}

describe('Design I2-C names of steps', () => {
  it('US-SP-04 AK-1: names the edition', () => {
    expect(editionName('base')).toBe('Basisspiel');
    expect(editionName('cities-and-knights')).toBe('Städte & Ritter');
  });

  it('names settlement, city and road', () => {
    expect(pieceName(stepAt(COMPLETE, 6))).toBe('Siedlung');
    expect(pieceName(stepAt(COMPLETE, 14))).toBe('Stadt');
    expect(pieceName(stepAt(COMPLETE, 15))).toBe('Straße');
  });

  it('titles each kind of step', () => {
    const titles = [0, 4, 14, 15].map((index) => stepTitle(stepAt(COMPLETE, index), nameOf));
    const building = stepAt(COMPLETE, 14);
    const name = building.kind === 'building' ? nameOf(building.personId) : '';

    expect(titles).toEqual([
      'Landschaftsfelder',
      'Reihenfolge, Platz 2',
      `Stadt von ${name}`,
      `Straße von ${name}`,
    ]);
  });

  it('titles the starting resources of a person', () => {
    const withResources = aSessionAfter(
      aCatanSetup(4, { startingResources: { count: 2, replacement: 'with' } }),
      23,
    );
    const step = stepAt(withResources, 22);

    expect(step.kind).toBe('starting-resources');
    expect(stepTitle(step, nameOf)).toMatch(/^Startrohstoffe von Person \d$/);
  });
});

describe('US-AB-03 warning before repeating a step', () => {
  it('AK-1: a draw of a person discards nothing else', () => {
    expect(repeatLines(COMPLETE, 0)).toEqual([]);
  });

  it('AK-2, AK-5: a spin of the order draws it again from its place, discards the placement', () => {
    expect(repeatLines(COMPLETE, 3)[0]).toBe('Ganze Reihenfolge wird neu gelost');
    expect(repeatLines(COMPLETE, 5)).toEqual([
      'Plätze 3 bis 4 werden neu gelost',
      'Platzierung wird verworfen: 8 Gebäude, 8 Straßen',
    ]);
  });

  it('AK-2: a spin brings back a skipped placement', () => {
    const order = aSessionAfter(KNIGHTS, 6);
    const skipped = skipCatanPlacement(KNIGHTS, order.generation);
    if (!skipped.ok) throw new Error(skipped.error);

    expect(repeatLines({ ...order, generation: skipped.value }, 3)).toEqual([
      'Ganze Reihenfolge wird neu gelost',
      'Übersprungene Platzierung beginnt wieder',
    ]);
  });

  it('AK-2: a building names the roads and later buildings it discards', () => {
    expect(repeatLines(COMPLETE, 18)).toEqual([
      'Verworfen und neu gelost:',
      '• 2 Straßen, auch die an diesem Gebäude',
      '• 1 später platziertes Gebäude',
    ]);
    expect(repeatLines(COMPLETE, 8)).toContain('• 6 später platzierte Gebäude');
    expect(repeatLines(COMPLETE, 20)).toEqual([
      'Verworfen und neu gelost:',
      '• die Straße an diesem Gebäude',
    ]);
  });

  it('AK-1: the last road and an unknown step discard nothing else', () => {
    expect(repeatLines(COMPLETE, 21)).toEqual([]);
    expect(repeatLines(COMPLETE, 99)).toEqual([]);
  });
});

describe('Design I2-C summary of the options', () => {
  const base = (): MatchPreparation =>
    preparationFor(
      {
        groupId: aGroup().id,
        participants: CATAN_TEST_PERSONS,
        options: CATAN_DEFAULT_OPTIONS,
        colors: aStoredSession().setup.colors,
      },
      null,
    );

  it('sums up the default options', () => {
    expect(recapLine(base())).toBe(
      'Basisspiel · 3 Losschritte · Reihenfolge gelost · ohne Startrohstoffe',
    );
  });

  it('sums up one draw, an order set by hand and resources with replacement', () => {
    const preparation: MatchPreparation = {
      ...base(),
      personDraws: { landscapes: false, harbors: true, numbers: false },
      isOrderDrawn: false,
      hasStartingResources: true,
    };

    expect(recapLine(preparation)).toBe(
      'Basisspiel · 1 Losschritt · Reihenfolge selbst · 2 Startrohstoffe mit Zurücklegen',
    );
  });

  it('sums up no draws, no placement and resources without replacement', () => {
    const preparation: MatchPreparation = {
      ...base(),
      edition: 'cities-and-knights',
      personDraws: { landscapes: false, harbors: false, numbers: false },
      isOrderDrawn: false,
      orderAlternative: 'none',
      hasStartingResources: true,
      resourceCount: 3,
      replacement: 'without',
    };

    expect(recapLine(preparation)).toBe(
      'Städte & Ritter · ohne Losschritte · ohne Platzierung · 3 Startrohstoffe ohne Zurücklegen',
    );
  });
});
