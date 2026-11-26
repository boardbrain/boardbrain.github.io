import { m } from 'motion/react';
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { CustomGame, GameId, Group, Person, PersonId } from '@/core/model';
import {
  computeStatistics,
  rankingCriteria,
  rankPersons,
  selectMatches,
  type GroupStatistics as Statistics,
  type MatchRecord,
  type PersonStatistics,
  type RankedPerson,
  type RankingCriterion,
  type RunRecord,
  type StatsPeriod,
  type StatsSelection,
} from '@/core/stats';
import { t } from '@/i18n/t';
import { useMatchesOfGroup } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import {
  BoltIcon,
  CactusIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronIcon,
  ClockIcon,
  CrownIcon,
  FlameIcon,
  MedalIcon,
  PlusIcon,
} from '@/ui/components/Icons';
import { PressableButton, PressableLink } from '@/ui/components/Pressable';
import { Unfold } from '@/ui/components/Unfold';
import { cx } from '@/ui/components/classNames';
import { GameSymbol } from '@/ui/views/games/GameSymbol';
import { localToday } from '@/ui/views/games/dates';
import { gameNameOf, resultHref } from '@/ui/views/management/GroupResults';
import { durationText } from '@/ui/views/management/resultList';
import { PeriodSheet } from './PeriodSheet';
import { CountUp, GrowBar, SlidingSegments, useGlide } from './StatsMotion';
import {
  averageText,
  criterionText,
  editionText,
  fullDate,
  initialOf,
  matchCountText,
  metricOf,
  namesOf,
  percentText,
  periodLabel,
  readStatsParams,
  runText,
  shareOf,
  statsGameOf,
  winsText,
  writeStatsParams,
} from './statsView';
import styles from './GroupStatistics.module.css';

const RISE = { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as const;
const RISE_STEP = 0.04;
const STEP_HEIGHT = { 1: 96, 2: 66, 3: 44 } as const;
const SMALL_SEGMENT_SHARE = 0.14;
const MAX_PLACE_COLOUR = 4;

type Names = (personId: PersonId) => string;

type GroupStatisticsProps = {
  readonly group: Group;
  readonly persons: readonly Person[];
  readonly customGames: readonly CustomGame[];
};

/**
 * The tab "Statistik" of a table (US-ST-01 to US-ST-03, US-ST-05, US-ST-06, design I3-D RA, EH3):
 * the filter bar, a podium of the first three by the chosen criterion, the current series as its
 * own card, the ranking to unfold, records, places and matches per game. The filter stands in the
 * address, so the back key from a record returns to the same view; everything updates itself on
 * every change of a result (US-ER-05 AK-3).
 */
export function GroupStatistics({
  group,
  persons,
  customGames,
}: GroupStatisticsProps): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const matches = useMatchesOfGroup(db, group.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const [openPerson, setOpenPerson] = useState<PersonId | null>(null);
  const [isPeriodOpen, setPeriodOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { request, criterion: requested } = readStatsParams(searchParams);
  useGlide(rootRef, searchParams.toString());

  if (matches === undefined) {
    return null;
  }
  const today = localToday();
  const selection = selectMatches(matches, request, today);
  const participants = group.members.map((member) => member.personId);
  const stats = computeStatistics(
    selection.matches,
    participants,
    selection.gameId,
    statsGameOf(customGames),
  );
  const criteria = rankingCriteria(stats);
  const criterion = criteria.includes(requested) ? requested : 'wins';
  const ranking = rankPersons(stats, criterion);
  const nameOf = namesOf(persons);
  const colorOf = (personId: PersonId): string => {
    const color = group.members.find((member) => member.personId === personId)?.groupColor;
    return color === undefined ? 'transparent' : `var(--color-group-${color})`;
  };
  const update = (change: Parameters<typeof writeStatsParams>[1]): void => {
    setOpenPerson(null);
    setSearchParams(writeStatsParams(searchParams, change), { replace: true });
  };
  const coin = (
    personId: PersonId,
    size: number,
    rank?: number,
    hasCrown = false,
  ): React.JSX.Element => (
    <Coin
      name={nameOf(personId)}
      color={colorOf(personId)}
      size={size}
      rank={rank}
      hasCrown={hasCrown}
    />
  );

  if (matches.length === 0) {
    return (
      <div className={styles.empty}>
        <EmptyArt />
        <strong>{t('statistik.leer')}</strong>
        <span className={styles.muted}>{t('statistik.leerText')}</span>
        {!group.archived && (
          <PressableLink to={`/verwaltung/gruppen/${group.id}/ergebnis`} className={styles.pill}>
            <PlusIcon size={15} />
            {t('ergebnisse.eintragen')}
          </PressableLink>
        )}
      </div>
    );
  }

  const singleGame = selection.gameId;
  return (
    <div ref={rootRef} className={styles.stats}>
      <FilterBar
        selection={selection}
        period={request.period}
        customGames={customGames}
        onGame={(gameId) => {
          update({ gameId });
        }}
        onEdition={(edition) => {
          update({ edition });
        }}
        onPeriod={() => {
          setPeriodOpen(true);
        }}
      />
      {selection.matches.length === 0 ? (
        <div className={styles.empty}>
          <EmptyArt />
          <strong>{t('statistik.keineImZeitraum')}</strong>
          <span className={styles.muted}>{t('statistik.andererZeitraum')}</span>
          <PressableButton
            type="button"
            className={styles.pill}
            onClick={() => {
              setPeriodOpen(true);
            }}
          >
            <CalendarIcon size={15} />
            {t('statistik.zeitraumAendern')}
          </PressableButton>
        </div>
      ) : (
        <>
          <Rise order={0}>
            <section
              className={styles.hero}
              aria-label={t('statistik.podest', {
                kriterium: criterionText(criterion, singleGame),
              })}
            >
              <span className={styles.glow} aria-hidden="true" />
              <SlidingSegments
                label={t('statistik.kriterium')}
                options={criteria.map((key) => ({ key, label: criterionText(key, singleGame) }))}
                selected={criterion}
                onSelect={(key) => {
                  update({ criterion: key });
                }}
                className={styles.criteria}
              />
              <Podium
                ranking={ranking}
                criterion={criterion}
                gameId={singleGame}
                nameOf={nameOf}
                coin={coin}
              />
              <Overview stats={stats} />
            </section>
          </Rise>
          {stats.currentStreak !== null && (
            <Rise order={1} className={styles.streakPart}>
              <PressableButton
                type="button"
                className={styles.streak}
                aria-label={t('statistik.serieKarte', {
                  name: nameOf(stats.currentStreak.personId),
                  anzahl: stats.currentStreak.length,
                })}
                onClick={() => {
                  setOpenPerson(stats.currentStreak?.personId ?? null);
                }}
              >
                <span className={styles.streakIcon}>
                  <FlameIcon size={18} />
                </span>
                {coin(stats.currentStreak.personId, 30)}
                <span className={styles.streakText}>
                  <strong>{nameOf(stats.currentStreak.personId)}</strong>
                  <small>{t('statistik.aktuelleSerie')}</small>
                </span>
                <span className={styles.streakValue}>
                  <CountUp value={stats.currentStreak.length} format={wholeNumber} />
                  <small>{t('statistik.einheit.inFolge')}</small>
                </span>
              </PressableButton>
            </Rise>
          )}
          <Rise order={2}>
            <Ranking
              stats={stats}
              ranking={ranking}
              criterion={criterion}
              gameId={singleGame}
              customGames={customGames}
              openPerson={openPerson}
              onToggle={(personId) => {
                setOpenPerson(openPerson === personId ? null : personId);
              }}
              nameOf={nameOf}
              coin={coin}
            />
          </Rise>
          <Rise order={3}>
            <Records stats={stats} groupId={group.id} nameOf={nameOf} coin={coin} />
          </Rise>
          <Rise order={4}>
            <Places stats={stats} ranking={ranking} nameOf={nameOf} coin={coin} />
          </Rise>
          {singleGame === null && selection.games.length > 1 && (
            <Rise order={5}>
              <Games
                selection={selection}
                customGames={customGames}
                onGame={(gameId) => {
                  update({ gameId });
                }}
              />
            </Rise>
          )}
        </>
      )}
      {isPeriodOpen && (
        <PeriodSheet
          matches={matches}
          period={request.period}
          years={selection.years}
          today={today}
          onChoose={(period: StatsPeriod) => {
            setPeriodOpen(false);
            update({ period });
          }}
          onClose={() => {
            setPeriodOpen(false);
          }}
        />
      )}
    </div>
  );
}

function wholeNumber(value: number): string {
  return String(Math.round(value));
}

// The parts rise gently one after another when the tab opens (design I3-D).
function Rise({
  order,
  className,
  children,
}: {
  readonly order: number;
  readonly className?: string | undefined;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <m.div
      className={cx(styles.part, className)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...RISE, delay: order * RISE_STEP }}
    >
      {children}
    </m.div>
  );
}

function EmptyArt(): React.JSX.Element {
  return (
    <span className={styles.emptyArt} aria-hidden="true">
      <i className={styles.emptyBar1} />
      <i className={styles.emptyBar2} />
      <i className={styles.emptyBar3} />
    </span>
  );
}

/**
 * A person as a coin in the table colour; on the podium and in the ranking with a ring in gold,
 * silver or bronze, the leader with a crown (design I3-D).
 */
function Coin({
  name,
  color,
  size,
  rank,
  hasCrown,
}: {
  readonly name: string;
  readonly color: string;
  readonly size: number;
  readonly rank?: number | undefined;
  readonly hasCrown: boolean;
}): React.JSX.Element {
  const ring =
    rank === 1 ? styles.ring1 : rank === 2 ? styles.ring2 : rank === 3 ? styles.ring3 : undefined;
  return (
    <span
      className={cx(styles.coin, ring)}
      style={{
        width: `${String(size)}px`,
        height: `${String(size)}px`,
        fontSize: `${String(Math.round(size * 0.42))}px`,
        background: color,
      }}
      aria-hidden="true"
    >
      {hasCrown && (
        <span className={styles.crown}>
          <CrownIcon size={Math.round(size * 0.42)} />
        </span>
      )}
      {initialOf(name)}
    </span>
  );
}

type CoinOf = (
  personId: PersonId,
  size: number,
  rank?: number,
  hasCrown?: boolean,
) => React.JSX.Element;

function FilterBar({
  selection,
  period,
  customGames,
  onGame,
  onEdition,
  onPeriod,
}: {
  readonly selection: StatsSelection;
  readonly period: StatsPeriod;
  readonly customGames: readonly CustomGame[];
  readonly onGame: (gameId: GameId | null) => void;
  readonly onEdition: (edition: string | null) => void;
  readonly onPeriod: () => void;
}): React.JSX.Element {
  const total = selection.games.reduce((sum, game) => sum + game.matchCount, 0);
  const label = periodLabel(period);
  return (
    <div className={styles.filterBar}>
      <div className={styles.filterRow}>
        {selection.canChooseGame ? (
          <SlidingSegments
            label={t('statistik.spiel')}
            options={[
              { key: 'all', label: t('statistik.alle'), note: String(total) },
              ...selection.games.map((game) => ({
                key: game.gameId,
                label: gameNameOf(game.gameId, customGames),
                note: String(game.matchCount),
              })),
            ]}
            selected={selection.gameId ?? 'all'}
            onSelect={(key) => {
              onGame(
                key === 'all'
                  ? null
                  : (selection.games.find((game) => game.gameId === key)?.gameId ?? null),
              );
            }}
            className={styles.games}
          />
        ) : (
          <>
            {/* Only one game played: it stands where the choice would be, as the chosen one. */}
            {selection.gameId !== null && (
              <SlidingSegments
                label={t('statistik.spiel')}
                options={[
                  {
                    key: selection.gameId,
                    label: gameNameOf(selection.gameId, customGames),
                    note: String(total),
                  },
                ]}
                selected={selection.gameId}
                onSelect={() => undefined}
              />
            )}
            <span className={styles.grow} />
          </>
        )}
        <PressableButton
          type="button"
          className={cx(styles.pill, period.kind !== 'all' && styles.pillOn)}
          aria-label={t('statistik.zeitraumWaehlen', { zeitraum: label })}
          onClick={onPeriod}
        >
          <CalendarIcon size={15} />
          <span className={styles.pillText}>{label}</span>
          <ChevronDownIcon size={14} />
        </PressableButton>
      </div>
      {selection.editions.length > 1 && (
        <SlidingSegments
          label={t('statistik.spielversion')}
          options={[
            { key: 'all', label: t('statistik.gesamt') },
            ...selection.editions.map((edition) => ({ key: edition, label: editionText(edition) })),
          ]}
          selected={selection.edition ?? 'all'}
          onSelect={(key) => {
            onEdition(key === 'all' ? null : key);
          }}
          isSmall
        />
      )}
    </div>
  );
}

function Podium({
  ranking,
  criterion,
  gameId,
  nameOf,
  coin,
}: {
  readonly ranking: readonly RankedPerson[];
  readonly criterion: RankingCriterion;
  readonly gameId: GameId | null;
  readonly nameOf: Names;
  readonly coin: CoinOf;
}): React.JSX.Element {
  const top = ranking.slice(0, 3);
  const [first, second, third] = top;
  const order = [second, first, third].filter((entry) => entry !== undefined);
  return (
    <ol className={cx(styles.podium, order.length === 2 && styles.podiumTwo)}>
      {order.map((entry) => {
        const place = Math.min(entry.rank, 3);
        const metric = metricOf(entry.person, criterion, gameId);
        const name = nameOf(entry.person.personId);
        return (
          <li
            key={entry.person.personId}
            className={cx(styles.step, place === 1 && styles.stepFirst)}
            data-flip={`podium-${entry.person.personId}`}
            aria-label={t('statistik.podestPlatz', {
              rang: entry.rank,
              name,
              wert: `${metric.text} ${metric.unit}`.trim(),
            })}
          >
            {coin(entry.person.personId, place === 1 ? 68 : 54, place, entry.rank === 1)}
            <strong className={styles.stepName}>{name}</strong>
            <span className={styles.stepValue} aria-hidden="true">
              {metric.value === null ? (
                <span className={styles.stepNumber}>{metric.text}</span>
              ) : (
                <CountUp
                  value={metric.value}
                  format={metric.isDecimal ? averageText : wholeNumber}
                  className={styles.stepNumber}
                />
              )}
              <small>{metric.unit}</small>
            </span>
            <span
              className={cx(
                styles.block,
                place === 1 ? styles.block1 : place === 2 ? styles.block2 : styles.block3,
              )}
              style={{ height: `${String(STEP_HEIGHT[place === 1 ? 1 : place === 2 ? 2 : 3])}px` }}
              aria-hidden="true"
            >
              <b>{entry.rank}</b>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Overview({ stats }: { readonly stats: Statistics }): React.JSX.Element {
  return (
    <p className={styles.overview}>
      <span className={styles.count}>
        <CountUp value={stats.matchCount} format={wholeNumber} className={styles.strong} />
        <span>
          {stats.matchCount === 1 ? t('statistik.partieWort') : t('statistik.partienWort')}
        </span>
      </span>
      {stats.firstDate !== null && (
        <span className={styles.muted}>
          {t('statistik.seitDatum', { datum: fullDate(stats.firstDate) })}
        </span>
      )}
      {stats.tracksDuration && (
        <span>
          {t('statistik.dauerSchnitt', {
            dauer:
              stats.averageDuration === null
                ? t('statistik.keinWert')
                : durationText(Math.round(stats.averageDuration)),
          })}
        </span>
      )}
    </p>
  );
}

function FormDots({
  person,
  isLarge = false,
}: {
  readonly person: PersonStatistics;
  readonly isLarge?: boolean;
}): React.JSX.Element {
  const words = person.form.map(({ result }) =>
    result === 'win'
      ? t('statistik.formSieg')
      : result === 'draw'
        ? t('statistik.formUnentschieden')
        : t('statistik.formKeins'),
  );
  return (
    <span
      className={cx(styles.form, isLarge && styles.formLarge)}
      role="img"
      aria-label={t('statistik.formListe', { liste: words.join(', ') })}
    >
      {person.form.map(({ matchId, result }) => (
        <i
          key={matchId}
          className={
            result === 'win'
              ? styles.formWin
              : result === 'draw'
                ? styles.formDraw
                : styles.formNone
          }
        />
      ))}
    </span>
  );
}

function Ranking({
  stats,
  ranking,
  criterion,
  gameId,
  customGames,
  openPerson,
  onToggle,
  nameOf,
  coin,
}: {
  readonly stats: Statistics;
  readonly ranking: readonly RankedPerson[];
  readonly criterion: RankingCriterion;
  readonly gameId: GameId | null;
  readonly customGames: readonly CustomGame[];
  readonly openPerson: PersonId | null;
  readonly onToggle: (personId: PersonId) => void;
  readonly nameOf: Names;
  readonly coin: CoinOf;
}): React.JSX.Element {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('statistik.rangliste')}</h3>
      <ol className={styles.card}>
        {ranking.map((entry) => {
          const { person, rank } = entry;
          const metric = metricOf(person, criterion, gameId);
          const isOpen = openPerson === person.personId;
          const name = nameOf(person.personId);
          const note = criterion === 'wins' ? percentText(person.winRate) : metric.unit;
          return (
            <li
              key={person.personId}
              className={cx(styles.rankItem, isOpen && styles.rankItemOpen)}
              data-flip={`rank-${person.personId}`}
            >
              <PressableButton
                type="button"
                className={styles.rankRow}
                aria-expanded={isOpen}
                aria-label={t('statistik.rangZeile', {
                  rang: rank,
                  name,
                  wert: `${metric.text} ${metric.unit}`.trim(),
                })}
                onClick={() => {
                  onToggle(person.personId);
                }}
              >
                <span
                  className={cx(styles.rankNumber, rank <= 3 && styles[`rank${String(rank)}`])}
                  aria-hidden="true"
                >
                  {rank}
                </span>
                {coin(person.personId, 40, rank <= 3 ? rank : undefined)}
                <span className={styles.rankMiddle} aria-hidden="true">
                  <span className={styles.rankName}>
                    <strong>{name}</strong>
                    <FormDots person={person} />
                  </span>
                  <span className={styles.track}>
                    <GrowBar
                      share={shareOf(stats, person, criterion)}
                      className={rank === 1 ? styles.barGold : styles.bar}
                    />
                  </span>
                </span>
                <span className={styles.rankValue} aria-hidden="true">
                  {metric.value === null ? (
                    <span className={styles.rankNumberValue}>{metric.text}</span>
                  ) : (
                    <CountUp
                      value={metric.value}
                      format={metric.isDecimal ? averageText : wholeNumber}
                      className={styles.rankNumberValue}
                    />
                  )}
                  <small>{note}</small>
                </span>
              </PressableButton>
              <Unfold isOpen={isOpen}>
                <PersonDetails
                  stats={stats}
                  person={person}
                  name={name}
                  gameId={gameId}
                  customGames={customGames}
                />
              </Unfold>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Figure({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className={styles.figure}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function PersonDetails({
  stats,
  person,
  name,
  gameId,
  customGames,
}: {
  readonly stats: Statistics;
  readonly person: PersonStatistics;
  readonly name: string;
  readonly gameId: GameId | null;
  readonly customGames: readonly CustomGame[];
}): React.JSX.Element {
  const favorite = person.favoriteGame;
  const hasScores = stats.persons.some((other) => other.averageScore !== null);
  return (
    <div
      className={styles.details}
      role="group"
      aria-label={t('statistik.kennzahlenVon', { name })}
    >
      <div className={styles.formRow}>
        <span className={styles.label}>{t('statistik.form')}</span>
        <FormDots person={person} isLarge />
      </div>
      <dl className={styles.figures}>
        <Figure label={t('statistik.kennzahlen.siege')}>{person.wins}</Figure>
        <Figure label={t('statistik.kennzahlen.siegquote')}>{percentText(person.winRate)}</Figure>
        <Figure label={t('statistik.kennzahlen.durststrecke')}>
          {person.drought}
          {person.longestDrought !== null && (
            <small className={styles.figureNote}>
              {t('statistik.laengsteWert', { anzahl: person.longestDrought.length })}
            </small>
          )}
        </Figure>
        <Figure label={t('statistik.kennzahlen.laengsteSerie')}>
          {person.longestStreak?.length ?? 0}
        </Figure>
        {stats.hasDraws && (
          <Figure label={t('statistik.kennzahlen.unentschieden')}>{person.draws}</Figure>
        )}
        {stats.placedMatchCount > 0 && (
          <Figure label={t('statistik.kennzahlen.platz')}>
            {averageText(person.averagePlace)}
          </Figure>
        )}
        {hasScores && (
          <Figure label={criterionText('average-score', gameId)}>
            {averageText(person.averageScore)}
          </Figure>
        )}
        {stats.placedMatchCount > 0 && (
          <Figure label={t('statistik.kennzahlen.letzter')}>{person.lastCount}</Figure>
        )}
      </dl>
      {person.placedMatches > 0 && (
        <div className={styles.placeMini}>
          <span className={styles.label}>
            {t('statistik.plaetzePerson', { anzahl: person.placedMatches })}
          </span>
          <PlaceBar person={person} />
          <PlaceLegend size={stats.persons.length} />
        </div>
      )}
      {favorite !== null && (
        <div className={styles.favorite}>
          <GameSymbol
            gameId={favorite.gameId}
            name={gameNameOf(favorite.gameId, customGames)}
            size={36}
          />
          <span className={styles.favoriteText}>
            <span className={styles.label}>{t('statistik.paradespiel')}</span>
            <strong>{gameNameOf(favorite.gameId, customGames)}</strong>
          </span>
          <span className={styles.favoriteRate}>
            <b>{percentText(favorite.winRate)}</b>
            <small>
              {t('statistik.paradeAnteil', { siege: favorite.wins, partien: favorite.matchCount })}
            </small>
          </span>
        </div>
      )}
    </div>
  );
}

function PlaceBar({ person }: { readonly person: PersonStatistics }): React.JSX.Element {
  const places = [...person.placeCounts].toSorted(([a], [b]) => a - b);
  const total = person.placedMatches;
  const parts = [
    ...places.map(([place, count]) => t('statistik.platzAnzahl', { platz: place, anzahl: count })),
    t('statistik.letzterAnzahl', { anzahl: person.lastCount }),
  ];
  const segment = (
    key: string,
    count: number,
    className: string | undefined,
  ): React.JSX.Element => (
    <span key={key} className={cx(styles.segment, className)} style={{ flexGrow: count }}>
      {count / total >= SMALL_SEGMENT_SHARE ? count : ''}
    </span>
  );
  return (
    <span className={styles.placeBar} role="img" aria-label={parts.join(', ')}>
      {places.map(([place, count]) =>
        segment(String(place), count, styles[`place${String(Math.min(place, MAX_PLACE_COLOUR))}`]),
      )}
      {person.lastCount > 0 && segment('last', person.lastCount, styles.placeLast)}
    </span>
  );
}

function PlaceLegend({ size }: { readonly size: number }): React.JSX.Element {
  // The largest place is always "Letzter", so the numbers go up to one below the table size.
  const numbers = Array.from(
    { length: Math.min(size - 1, MAX_PLACE_COLOUR) },
    (_, index) => index + 1,
  );
  return (
    <span className={styles.legend} aria-hidden="true">
      {numbers.map((place) => (
        <span key={place}>
          <i className={styles[`place${String(place)}`]} />
          {place === MAX_PLACE_COLOUR && size - 1 > MAX_PLACE_COLOUR
            ? t('statistik.platzAbVier')
            : t('statistik.platzKurz', { platz: place })}
        </span>
      ))}
      <span>
        <i className={styles.placeLast} />
        {t('statistik.letzter')}
      </span>
    </span>
  );
}

function Records({
  stats,
  groupId,
  nameOf,
  coin,
}: {
  readonly stats: Statistics;
  readonly groupId: string;
  readonly nameOf: Names;
  readonly coin: CoinOf;
}): React.JSX.Element | null {
  const { records } = stats;
  const cards: React.JSX.Element[] = [];
  const runCard = (
    key: string,
    title: string,
    record: RunRecord,
    value: string,
    icon: React.JSX.Element,
    tone: string | undefined,
  ): void => {
    cards.push(
      <div key={key} className={cx(styles.record, tone)}>
        <RecordBody
          title={title}
          value={value}
          icon={icon}
          who={[record.personId]}
          when={runText(record)}
          nameOf={nameOf}
          coin={coin}
        />
      </div>,
    );
  };
  const matchCard = (
    key: string,
    title: string,
    record: MatchRecord,
    value: string,
    icon: React.JSX.Element,
    tone: string | undefined,
  ): void => {
    cards.push(
      <PressableLink
        key={key}
        to={resultHref(groupId, record.matchId)}
        className={cx(styles.record, tone)}
        aria-label={t('statistik.rekordOeffnen', { titel: title, wert: value })}
      >
        <RecordBody
          title={title}
          value={value}
          icon={icon}
          who={record.personIds}
          when={fullDate(record.date)}
          nameOf={nameOf}
          coin={coin}
        />
        <span className={styles.recordGo} aria-hidden="true">
          <ChevronIcon size={16} />
        </span>
      </PressableLink>,
    );
  };
  if (records.longestStreak !== null) {
    runCard(
      'streak',
      t('statistik.ewigeSerie'),
      records.longestStreak,
      winsText(records.longestStreak.length),
      <FlameIcon size={18} />,
      styles.recordStreak,
    );
  }
  if (records.longestDrought !== null) {
    runCard(
      'drought',
      t('statistik.laengsteDurststrecke'),
      records.longestDrought,
      matchCountText(records.longestDrought.length),
      <CactusIcon size={18} />,
      styles.recordDrought,
    );
  }
  if (records.longestMatch !== null) {
    matchCard(
      'long',
      t('statistik.laengstePartie'),
      records.longestMatch,
      durationText(records.longestMatch.value),
      <ClockIcon size={18} />,
      styles.recordLong,
    );
  }
  if (records.shortestMatch !== null) {
    matchCard(
      'short',
      t('statistik.kuerzestePartie'),
      records.shortestMatch,
      durationText(records.shortestMatch.value),
      <BoltIcon size={18} />,
      styles.recordShort,
    );
  }
  if (records.bestScore !== null) {
    matchCard(
      'best',
      stats.scoring === 'lowest-wins' ? t('statistik.bestwertWenigste') : t('statistik.bestwert'),
      records.bestScore,
      t('statistik.punkteAnzahl', { anzahl: records.bestScore.value }),
      <MedalIcon size={18} />,
      styles.recordBest,
    );
  }
  if (cards.length === 0) {
    return null;
  }
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('statistik.rekorde')}</h3>
      <div className={styles.recordRail}>{cards}</div>
    </section>
  );
}

function RecordBody({
  title,
  value,
  icon,
  who,
  when,
  nameOf,
  coin,
}: {
  readonly title: string;
  readonly value: string;
  readonly icon: React.JSX.Element;
  readonly who: readonly PersonId[];
  readonly when: string;
  readonly nameOf: Names;
  readonly coin: CoinOf;
}): React.JSX.Element {
  return (
    <>
      <span className={styles.recordIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.label}>{title}</span>
      <strong className={styles.recordValue}>{value}</strong>
      <span className={styles.recordWho}>
        <span className={styles.coins}>
          {who.slice(0, 3).map((personId) => (
            <span key={personId}>{coin(personId, 22)}</span>
          ))}
        </span>
        <span className={styles.recordNames}>{who.map(nameOf).join(', ')}</span>
      </span>
      <small className={styles.recordWhen}>{when}</small>
    </>
  );
}

function Places({
  stats,
  ranking,
  nameOf,
  coin,
}: {
  readonly stats: Statistics;
  readonly ranking: readonly RankedPerson[];
  readonly nameOf: Names;
  readonly coin: CoinOf;
}): React.JSX.Element | null {
  if (stats.placedMatchCount === 0) {
    return null;
  }
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{t('statistik.plaetze')}</h3>
        <span className={styles.note}>
          {t('statistik.plaetzeHinweis', { anzahl: stats.placedMatchCount })}
        </span>
      </div>
      <ul className={styles.card}>
        {ranking.map(({ person }) => (
          <li
            key={person.personId}
            className={styles.placeRow}
            data-flip={`places-${person.personId}`}
          >
            {coin(person.personId, 30)}
            <span className={styles.placeMiddle}>
              <span className={styles.placeName}>
                <strong>{nameOf(person.personId)}</strong>
                <small>
                  {t('statistik.platzSchnitt', { wert: averageText(person.averagePlace) })}
                </small>
              </span>
              <PlaceBar person={person} />
            </span>
          </li>
        ))}
      </ul>
      <PlaceLegend size={stats.persons.length} />
    </section>
  );
}

function Games({
  selection,
  customGames,
  onGame,
}: {
  readonly selection: StatsSelection;
  readonly customGames: readonly CustomGame[];
  readonly onGame: (gameId: GameId) => void;
}): React.JSX.Element {
  const most = Math.max(...selection.games.map((game) => game.matchCount));
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{t('statistik.spiele')}</h3>
        <span className={styles.note}>{t('statistik.spieleHinweis')}</span>
      </div>
      <ul className={styles.card}>
        {selection.games.map((game) => {
          const name = gameNameOf(game.gameId, customGames);
          return (
            <li key={game.gameId}>
              <PressableButton
                type="button"
                className={styles.gameRow}
                aria-label={t('statistik.spielFiltern', {
                  spiel: name,
                  partien: matchCountText(game.matchCount),
                })}
                onClick={() => {
                  onGame(game.gameId);
                }}
              >
                <GameSymbol gameId={game.gameId} name={name} size={32} />
                <span className={styles.gameMiddle} aria-hidden="true">
                  <strong>{name}</strong>
                  <span className={styles.trackThin}>
                    <GrowBar share={game.matchCount / most} className={styles.barGold} />
                  </span>
                </span>
                <CountUp
                  value={game.matchCount}
                  format={wholeNumber}
                  className={styles.gameCount}
                />
              </PressableButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
