import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { drawPerson } from './drawPerson';

const FC_SEED = 20261007;

describe('US-LS-01 Draw a person', () => {
  it('AK-1: maps the drawn word onto the person at that position', () => {
    // The exact proof of 1/n per person is in core/random/uniform.test.ts (NFA-ZF-02); the
    // chi-square test is in tests/statistical/drawPerson.stat.test.ts.
    const persons = ['Anna', 'Ben', 'Clara'];
    const rng = new ScriptedRandomSource([0, 1, 2, 3, 4, 5]);

    const drawn = Array.from({ length: 6 }, () => drawPerson(persons, rng));

    expect(drawn).toEqual(['Anna', 'Ben', 'Clara', 'Anna', 'Ben', 'Clara']);
  });

  it('AK-1: reaches every person of the set', () => {
    const persons = ['Anna', 'Ben', 'Clara', 'David', 'Eva'];
    const rng = new SeededRandomSource(1);
    const seen = new Set<string>();

    for (let draw = 0; draw < 200; draw++) {
      seen.add(drawPerson(persons, rng));
    }

    expect(seen).toEqual(new Set(persons));
  });

  it('AK-2: works with any set of persons, without anything from Catan (property)', () => {
    const anyPerson = fc.oneof(
      fc.string(),
      fc.integer(),
      fc.record({ id: fc.uuid(), name: fc.string() }),
    );
    fc.assert(
      fc.property(
        fc.array(anyPerson, { minLength: 1, maxLength: 20 }),
        fc.integer(),
        (persons, seed) => persons.includes(drawPerson(persons, new SeededRandomSource(seed))),
      ),
      { seed: FC_SEED },
    );
  });

  it('AK-2: draws from a single person', () => {
    const persons = [{ id: 'p1', name: 'Anna' }];

    expect(drawPerson(persons, new ScriptedRandomSource([42]))).toBe(persons[0]);
  });

  it('AK-2: throws a RangeError for an empty set', () => {
    expect(() => drawPerson([], new ScriptedRandomSource([0]))).toThrow(RangeError);
  });

  it('AK-3: can draw the same person several times in a row', () => {
    const persons = ['Anna', 'Ben', 'Clara', 'David'];
    const rng = new ScriptedRandomSource([1, 5, 9]);

    const drawn = [drawPerson(persons, rng), drawPerson(persons, rng), drawPerson(persons, rng)];

    expect(drawn).toEqual(['Ben', 'Ben', 'Ben']);
  });

  it('AK-3: does not change the set, so later draws see all persons again', () => {
    const persons = Object.freeze(['Anna', 'Ben', 'Clara']);

    drawPerson(persons, new ScriptedRandomSource([2]));

    expect(persons).toEqual(['Anna', 'Ben', 'Clara']);
  });

  it('AK-3: uses exactly one word per draw when nothing is rejected', () => {
    const rng = new ScriptedRandomSource([0, 1]);

    drawPerson(['Anna', 'Ben'], rng);

    expect(rng.consumed).toBe(1);
  });
});
