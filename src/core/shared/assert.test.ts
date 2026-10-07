import { describe, expect, it } from 'vitest';
import { assert, InvariantError } from './assert';

describe('Architektur 4.6 assert', () => {
  it('lässt eine erfüllte Invariante passieren', () => {
    expect(() => {
      assert(true, 'immer erfüllt');
    }).not.toThrow();
  });

  it('wirft InvariantError mit Beschreibung, wenn die Invariante verletzt ist', () => {
    expect(() => {
      assert(false, 'Gruppe hat höchstens 12 Mitglieder');
    }).toThrow(new InvariantError('Invariante verletzt: Gruppe hat höchstens 12 Mitglieder'));
  });

  it('InvariantError ist ein Error mit eigenem Namen', () => {
    const error = new InvariantError('x');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('InvariantError');
  });
});
