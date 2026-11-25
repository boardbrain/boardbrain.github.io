import type { ScoreTarget } from '@/core/model';
import { t } from '@/i18n/t';

/**
 * The target as the head and the corner of the block show it: `100P` or `15R` (design I3-C2 ZY5).
 */
export function targetText(target: ScoreTarget): string {
  return target.kind === 'points'
    ? t('notizblock.zielPunkte', { wert: target.value })
    : t('notizblock.zielRunden', { wert: target.value });
}

/**
 * How many rounds, e.g. `5 Runden` or `1 Runde`.
 */
export function roundsText(count: number): string {
  return count === 1 ? t('notizblock.eineRunde') : t('notizblock.rundenInfo', { anzahl: count });
}
