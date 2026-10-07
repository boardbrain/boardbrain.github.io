import { describe, expect, it } from 'vitest';
import { t } from './t';

describe('NFA-I18N-01 Texte aus der Sprachdatei', () => {
  it('liefert den Text zu einem Schlüssel', () => {
    expect(t('diagnose.titel')).toBe('Diagnose');
  });

  it('setzt Platzhalter ein', () => {
    expect(t('diagnose.version', { version: '0.1.0' })).toBe('Version 0.1.0');
  });

  it('lässt einen Platzhalter ohne Wert sichtbar stehen', () => {
    expect(t('diagnose.version')).toBe('Version {version}');
  });
});
