import type { Clock } from '@/app/ports';

/**
 * Clock of the device; timestamps are stored in UTC (Architecture 7.1).
 */
export const systemClock: Clock = {
  now: () => new Date().toISOString(),
};
