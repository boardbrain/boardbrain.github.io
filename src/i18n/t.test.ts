import { describe, expect, it } from 'vitest';
import { t } from './t';

describe('NFA-I18N-01 texts from the language file', () => {
  it('returns the text for a key', () => {
    expect(t('diagnose.titel')).toBe('Diagnose');
  });

  it('fills in placeholders', () => {
    expect(t('diagnose.version', { version: '0.1.0' })).toBe('Version 0.1.0');
  });

  it('leaves a placeholder without a value visible', () => {
    expect(t('diagnose.version')).toBe('Version {version}');
  });
});
