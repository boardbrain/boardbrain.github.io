import type { Group } from '@/core/model';
import { CATAN_GAME_ID, CATAN_MODULE } from './catanModule';

/**
 * Whether a group can start a Catan match (US-AB-01 AK-1, Specification 3.4): it is active and
 * either a global group with 2 to 4 members that does not exclude Catan, or bound to Catan.
 * Every member then has a Catan colour (Specification 3.3).
 */
export function canPlayCatan(group: Group): boolean {
  const { min, max } = CATAN_MODULE.playerCount;
  const isBindingFit =
    group.binding.kind === 'global'
      ? group.binding.excludesCatan !== true
      : group.binding.gameId === CATAN_GAME_ID;
  return (
    !group.archived &&
    isBindingFit &&
    group.members.length >= min &&
    group.members.length <= max &&
    group.members.every((member) => member.catanColor !== undefined)
  );
}
