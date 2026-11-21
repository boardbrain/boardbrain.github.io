import { describe, expect, it } from 'vitest';
import { durationFields, readDuration } from './duration';

describe('US-ER-01 AK-7 the duration in hours and minutes', () => {
  it('splits a duration into the two fields', () => {
    expect(durationFields(83)).toEqual({ hours: '1', minutes: '23' });
    expect(durationFields(45)).toEqual({ hours: '0', minutes: '45' });
    expect(durationFields(120)).toEqual({ hours: '2', minutes: '0' });
    expect(durationFields(undefined)).toEqual({ hours: '', minutes: '' });
  });

  it('reads hours and minutes; an empty field counts as 0', () => {
    expect(readDuration({ hours: '1', minutes: '30' }).minutes).toBe(90);
    expect(readDuration({ hours: '2', minutes: '' }).minutes).toBe(120);
    expect(readDuration({ hours: '', minutes: '45' }).minutes).toBe(45);
    expect(readDuration({ hours: ' 1 ', minutes: '05' }).minutes).toBe(65);
  });

  it('both empty is no duration, which is allowed', () => {
    expect(readDuration({ hours: '', minutes: ' ' })).toEqual({
      minutes: undefined,
      isHoursBad: false,
      isMinutesBad: false,
    });
  });

  it('marks the wrong field: minutes from 0 to 59, whole numbers only', () => {
    expect(readDuration({ hours: '1', minutes: '60' })).toEqual({
      minutes: undefined,
      isHoursBad: false,
      isMinutesBad: true,
    });
    expect(readDuration({ hours: '1,5', minutes: '' })).toEqual({
      minutes: undefined,
      isHoursBad: true,
      isMinutesBad: false,
    });
    expect(readDuration({ hours: '-1', minutes: '30' }).isHoursBad).toBe(true);
  });

  it('needs at least 1 minute', () => {
    expect(readDuration({ hours: '0', minutes: '0' })).toEqual({
      minutes: undefined,
      isHoursBad: true,
      isMinutesBad: true,
    });
    expect(readDuration({ hours: '', minutes: '0' })).toEqual({
      minutes: undefined,
      isHoursBad: false,
      isMinutesBad: true,
    });
    expect(readDuration({ hours: '0', minutes: '1' }).minutes).toBe(1);
  });
});
