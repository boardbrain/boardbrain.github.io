import { useRef, type ReactNode } from 'react';
import type { CustomGame, Group, Match, MatchId, Person } from '@/core/model';
import { BottomSheet } from '@/ui/components/BottomSheet';
import { ResultDays } from '@/ui/views/management/GroupResults';
import styles from './RecordMatchesSheet.module.css';

/**
 * The matches of a record of several matches, e.g. an eternal streak or the longest drought, as
 * a sheet from below (wish of the PO 27.11.2026): the record and its holder on top, below the
 * matches as in the results of the table, newest first; a row opens its result.
 */
export function RecordMatchesSheet({
  title,
  head,
  matchIds,
  matches,
  group,
  persons,
  customGames,
  onClose,
}: {
  readonly title: string;
  /** The value and the holder of the record. */
  readonly head: ReactNode;
  readonly matchIds: readonly MatchId[];
  readonly matches: readonly Match[];
  readonly group: Group;
  readonly persons: readonly Person[];
  readonly customGames: readonly CustomGame[];
  readonly onClose: () => void;
}): React.JSX.Element {
  const sheetRef = useRef<HTMLDivElement>(null);
  const shown = matches.filter((match) => matchIds.includes(match.id));
  return (
    <BottomSheet label={title} title={title} sheetRef={sheetRef} onClose={onClose}>
      <div className={styles.head}>{head}</div>
      <ResultDays matches={shown} group={group} persons={persons} customGames={customGames} />
    </BottomSheet>
  );
}
