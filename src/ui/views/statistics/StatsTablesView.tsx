import type { CustomGame, Group, Match, Person, PersonId } from '@/core/model';
import { computeStatistics, leadersOf, podiumOf, rankPersons } from '@/core/stats';
import { t } from '@/i18n/t';
import { useCustomGames, useGroups, useMatchesByGroup, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { CrownIcon } from '@/ui/components/Icons';
import { Page } from '@/ui/components/Page';
import { PressableLink } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import { localToday, shortDate } from '@/ui/views/games/dates';
import { initialOf, matchCountText, namesOf, statsGameOf, winsText } from './statsView';
import styles from './StatsTablesView.module.css';

const SEAT_COINS = 4;
const SEAT_COINS_ON_STEP = 2;

type TableCard = {
  readonly group: Group;
  readonly matches: readonly Match[];
};

// The tables last played first, tables without matches at the end by name (US-ST-01 AK-7).
function cardOrder(a: TableCard, b: TableCard): number {
  const lastA = a.matches.at(-1)?.date ?? '';
  const lastB = b.matches.at(-1)?.date ?? '';
  if (lastA !== lastB) {
    return lastA < lastB ? 1 : -1;
  }
  return a.group.name.localeCompare(b.group.name, 'de');
}

/**
 * The tables behind the card "Statistik" of the card hand (US-ST-01 AK-7, design I3-D KS2, TW1):
 * each as a card with its matches, the last day played, the leader by wins and the first three
 * on a small podium; a card opens the statistics of the table.
 */
export function StatsTablesView(): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const groups = useGroups(db);
  const persons = usePersons(db);
  const customGames = useCustomGames(db);
  const byGroup = useMatchesByGroup(db);
  if (
    groups === undefined ||
    persons === undefined ||
    customGames === undefined ||
    byGroup === undefined
  ) {
    return null;
  }
  const cards = groups
    .filter((group) => !group.archived || (byGroup.get(group.id)?.length ?? 0) > 0)
    .map((group) => ({ group, matches: byGroup.get(group.id) ?? [] }))
    .toSorted(cardOrder);
  return (
    <Page title={t('statistik.titel')} subtitle={t('statistik.tischWahl')} backFallback="/">
      {cards.length === 0 ? (
        <p className={styles.hint}>{t('gruppen.leer')}</p>
      ) : (
        <ul className={styles.cards}>
          {cards.map((card) => (
            <li key={card.group.id}>
              <Card card={card} persons={persons} customGames={customGames} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

function Card({
  card,
  persons,
  customGames,
}: {
  readonly card: TableCard;
  readonly persons: readonly Person[];
  readonly customGames: readonly CustomGame[];
}): React.JSX.Element {
  const { group, matches } = card;
  const nameOf = namesOf(persons);
  const colorOf = (personId: PersonId): string => {
    const color = group.members.find((member) => member.personId === personId)?.groupColor;
    return color === undefined ? 'transparent' : `var(--color-group-${color})`;
  };
  const coin = (personId: PersonId, size: number, ring?: string): React.JSX.Element => (
    <span
      className={cx(styles.coin, ring)}
      style={{
        width: `${String(size)}px`,
        height: `${String(size)}px`,
        fontSize: `${String(Math.round(size * 0.42))}px`,
        background: colorOf(personId),
      }}
      aria-hidden="true"
    >
      {initialOf(nameOf(personId))}
    </span>
  );
  const href = `/statistik/${group.id}`;
  const last = matches.at(-1);
  if (last === undefined) {
    return (
      <PressableLink
        to={href}
        look="card"
        className={cx(styles.card, styles.none)}
        aria-label={t('statistik.tischKarteLeer', { name: group.name })}
      >
        <span className={styles.text}>
          <strong className={styles.name}>{group.name}</strong>
          <small className={styles.facts}>{t('statistik.keinePartien')}</small>
        </span>
        <span className={styles.seats}>
          {group.members.slice(0, SEAT_COINS).map((member) => (
            <span key={member.personId}>{coin(member.personId, 26)}</span>
          ))}
        </span>
      </PressableLink>
    );
  }
  const participants = group.members.map((member) => member.personId);
  const stats = computeStatistics(matches, participants, null, statsGameOf(customGames));
  // By wins alone: equal wins share the lead and the step (PO 26.11.2026).
  const leaders = leadersOf(stats);
  const steps = podiumOf(rankPersons(stats, 'wins', true), 'wins');
  const leaderWins = steps[0]?.persons[0]?.wins ?? 0;
  const [leader] = leaders;
  const leaderText =
    leader === undefined
      ? null
      : leaders.length === 1
        ? nameOf(leader)
        : t('statistik.gleichstand');
  const [best, next, third] = steps;
  const order = [next, best, third].filter((step) => step !== undefined);
  const today = localToday();
  return (
    <PressableLink
      to={href}
      look="card"
      className={styles.card}
      aria-label={
        leaderText === null
          ? t('statistik.tischKarteOhneSieg', {
              name: group.name,
              partien: matchCountText(matches.length),
            })
          : t('statistik.tischKarte', {
              name: group.name,
              partien: matchCountText(matches.length),
              wer: `${leaderText}, ${winsText(leaderWins)}`,
            })
      }
    >
      <span className={styles.text}>
        <strong className={styles.name}>{group.name}</strong>
        <small className={styles.facts}>
          {t('statistik.tischPartien', {
            partien: matchCountText(matches.length),
            datum: shortDate(last.date, today),
          })}
        </small>
        <span className={styles.leader}>
          {leaderText !== null && <CrownIcon size={14} />}
          <span className={styles.leaderText}>
            {leaderText === null
              ? t('statistik.keinSieg')
              : t('statistik.spitzenreiter', { wer: leaderText, siege: winsText(leaderWins) })}
          </span>
        </span>
      </span>
      <span className={styles.podium} aria-hidden="true">
        {order.map(({ rank, persons }) => {
          const place = rank === 1 ? 1 : rank === 2 ? 2 : 3;
          const ring = place === 1 ? styles.ring1 : place === 2 ? styles.ring2 : styles.ring3;
          const block = place === 1 ? styles.step1 : place === 2 ? styles.step2 : styles.step3;
          const single = place === 1 ? 34 : 28;
          const size = persons.length === 1 ? single : Math.round(single * 0.68);
          return (
            <span key={rank} className={styles.step}>
              <span className={styles.stepCoins}>
                {persons.slice(0, SEAT_COINS_ON_STEP).map((person) => (
                  <span key={person.personId}>{coin(person.personId, size, ring)}</span>
                ))}
              </span>
              <i className={block} />
            </span>
          );
        })}
      </span>
    </PressableLink>
  );
}
