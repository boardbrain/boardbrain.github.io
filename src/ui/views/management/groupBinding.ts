import type { CustomGame, Group } from '@/core/model';
import { findSupportedGame } from '@/games/registry';
import { t } from '@/i18n/t';

function gameName(group: Group, customGames: readonly CustomGame[]): string | null {
  if (group.binding.kind === 'global') {
    return null;
  }
  const { gameId } = group.binding;
  const supported = findSupportedGame(gameId);
  if (supported !== undefined) {
    return t(supported.nameKey);
  }
  return customGames.find((game) => game.id === gameId)?.name ?? '';
}

function globalLabel(group: Group): string {
  return group.binding.kind === 'global' && group.binding.excludesCatan === true
    ? t('gruppen.bindungOhneCatan')
    : t('gruppen.bindungGlobal');
}

/**
 * Short form of what a group plays, e.g. "Alle Spiele ohne Catan" or the bound game "Uno"
 * (room, rows of a person's tables).
 */
export function bindingLabel(group: Group, customGames: readonly CustomGame[]): string {
  return gameName(group, customGames) ?? globalLabel(group);
}

/**
 * Long form for the table page, e.g. "Nur Uno" for a group bound to one game (US-VW-05 AK-3).
 */
export function bindingLongLabel(group: Group, customGames: readonly CustomGame[]): string {
  const game = gameName(group, customGames);
  return game === null ? globalLabel(group) : t('gruppen.bindungNur', { spiel: game });
}
