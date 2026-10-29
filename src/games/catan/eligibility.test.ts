import { aGroup } from '@tests/support/masterDataFakes';
import { describe, expect, it } from 'vitest';
import { toGameId, toPersonId, type GroupMember } from '@/core/model';
import { CATAN_GAME_ID } from './catanModule';
import { canPlayCatan } from './eligibility';

function member(number: number): GroupMember {
  return {
    personId: toPersonId(`00000000-0000-4000-8000-0000000000a${String(number)}`),
    groupColor: 'red',
    catanColor: 'red',
  };
}

describe('US-AB-01 AK-1 Groups that can play Catan', () => {
  it('accepts an active global group with 2 to 4 members', () => {
    expect(canPlayCatan(aGroup())).toBe(true);
    expect(canPlayCatan(aGroup({ members: [1, 2, 3, 4].map(member) }))).toBe(true);
  });

  it('accepts a group bound to Catan', () => {
    expect(canPlayCatan(aGroup({ binding: { kind: 'game', gameId: CATAN_GAME_ID } }))).toBe(true);
  });

  it('rejects archived groups, groups that exclude Catan and groups bound to another game', () => {
    expect(canPlayCatan(aGroup({ archived: true }))).toBe(false);
    expect(canPlayCatan(aGroup({ binding: { kind: 'global', excludesCatan: true } }))).toBe(false);
    const uno = toGameId('00000000-0000-4000-8000-0000000000b1');
    expect(canPlayCatan(aGroup({ binding: { kind: 'game', gameId: uno } }))).toBe(false);
  });

  it('rejects groups with more than 4 members or without Catan colours', () => {
    expect(canPlayCatan(aGroup({ members: [1, 2, 3, 4, 5].map(member) }))).toBe(false);
    expect(
      canPlayCatan(
        aGroup({
          members: [1, 2].map((number) => ({
            personId: member(number).personId,
            groupColor: 'red',
          })),
        }),
      ),
    ).toBe(false);
  });
});
