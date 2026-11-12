import { SUPPORTED_GAMES } from '@/games/registry';
import { useCustomGames, useGroups, usePersons } from '@/infra/db/readHooks';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { DiceIcon, PeopleIcon, TableIcon } from '@/ui/components/Icons';

/**
 * One area of the management as a playing card on the start and management views (design D-3).
 */
export type AreaCard = {
  readonly key: 'personen' | 'gruppen' | 'spiele';
  readonly to: string;
  readonly title: string;
  readonly count: number;
  /** Symbol of the area; decorative. */
  readonly icon: (props: { readonly size?: number | undefined }) => React.JSX.Element;
  /** The first names of the area, for the management view. */
  readonly names: readonly string[];
};

/**
 * Persons, tables and games with their counts; `undefined` while the data is loading.
 */
export function useAreaCards(): readonly AreaCard[] | undefined {
  const { db } = useAppDependencies();
  const persons = usePersons(db);
  const groups = useGroups(db);
  const customGames = useCustomGames(db);
  if (persons === undefined || groups === undefined || customGames === undefined) {
    return undefined;
  }
  const games = [
    ...SUPPORTED_GAMES.map((game) => t(game.nameKey)),
    ...customGames.map((game) => game.name),
  ];
  return [
    {
      key: 'personen',
      to: '/verwaltung/personen',
      title: t('verwaltung.personen'),
      count: persons.length,
      icon: PeopleIcon,
      names: persons.slice(0, 3).map((person) => person.name),
    },
    {
      key: 'gruppen',
      to: '/verwaltung/gruppen',
      title: t('verwaltung.gruppen'),
      count: groups.length,
      icon: TableIcon,
      names: groups.slice(0, 2).map((group) => group.name),
    },
    {
      key: 'spiele',
      to: '/verwaltung/spiele',
      title: t('verwaltung.spiele'),
      count: games.length,
      icon: DiceIcon,
      names: games.slice(0, 3),
    },
  ];
}
