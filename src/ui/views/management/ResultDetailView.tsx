import { useState, useTransition } from 'react';
import { useParams } from 'react-router';
import { parseGroupId, parseMatchId, type Match } from '@/core/model';
import { CATAN_GAME_ID } from '@/games/catan';
import { gameCapabilities } from '@/games/registry';
import { formatDateTime } from '@/i18n/format';
import { t } from '@/i18n/t';
import { useCustomGames, useGroup, useMatch, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { PenIcon, TrophyIcon } from '@/ui/components/Icons';
import { Page } from '@/ui/components/Page';
import { PillButton } from '@/ui/components/PillButton';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import { useGoBack } from '@/ui/components/useGoBack';
import { GameSymbol } from '@/ui/views/games/GameSymbol';
import { dayLabel, localToday } from '@/ui/views/games/dates';
import { Coin } from '@/ui/views/match/Coin';
import { MatchDialog } from '@/ui/views/match/MatchDialog';
import { podiumClass } from '@/ui/views/result/podium';
import { gameNameOf, resultHref } from './GroupResults';
import { detailRows, durationText, scoreNote } from './resultList';
import overview from './Overview.module.css';
import styles from './ResultDetailView.module.css';

const TROPHY_SIZE = 18;
const PILL_ICON_SIZE = 15;

/**
 * Where the list of results of a table is: its page in the tab "Ergebnisse".
 */
export function groupResultsHref(groupId: string): string {
  return `/verwaltung/gruppen/${groupId}?reiter=ergebnisse`;
}

/**
 * When a result was played as in the list: "heute, 17.11. · 21:40".
 */
export function whenText(match: Pick<Match, 'date' | 'time'>): string {
  const day = dayLabel(match.date, localToday());
  return match.time === undefined ? day : `${day} · ${match.time}`;
}

/**
 * Page of a result `#/verwaltung/gruppen/‹tisch›/ergebnisse/‹ergebnis›` (US-ER-04 AK-2, design
 * I3-C DA1, SY1, BL1, MP2): every recorded value, the places (US-ER-02 AK-5, US-ER-06 AK-5) and
 * in Catan the colours (US-ER-03 AK-2); below "Bearbeiten" and "Ergebnis löschen" (US-ER-05).
 */
export function ResultDetailView(): React.JSX.Element | null {
  const { db, results } = useAppDependencies();
  const { groupId = '', matchId = '' } = useParams();
  const parsedGroup = parseGroupId(groupId);
  const parsedMatch = parseMatchId(matchId);
  const match = useMatch(db, parsedMatch.ok ? parsedMatch.value : null);
  const group = useGroup(db, parsedGroup.ok ? parsedGroup.value : null);
  const persons = usePersons(db);
  const customGames = useCustomGames(db);
  const goBack = useGoBack(groupResultsHref(groupId));
  const [isAsking, setIsAsking] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (match === undefined || group === undefined || persons === undefined) {
    return null;
  }
  if (customGames === undefined) {
    return null;
  }
  // While leaving after deleting, the result is already gone: nothing to say.
  if (match === null && isPending) {
    return null;
  }
  if (match === null || group?.id !== match.groupId) {
    return (
      <Page title={t('ergebnisse.abschnitt')} backFallback={groupResultsHref(groupId)}>
        <p className={overview.hint}>{t('ergebnisse.nichtGefunden')}</p>
      </Page>
    );
  }
  const isCatan = match.gameId === CATAN_GAME_ID;
  const gameName = gameNameOf(match.gameId, customGames);
  const custom = customGames.find((game) => game.id === match.gameId);
  const { scoring } = gameCapabilities(match.gameId, custom);
  const participants = group.members.map((member) => member.personId);
  const nameOf = (id: string): string => persons.find((person) => person.id === id)?.name ?? '';
  const note = scoreNote(match, isCatan, scoring);
  const isChanged = match.updatedAt !== match.recordedAt;

  return (
    <Page
      title={gameName}
      subtitle={whenText(match)}
      picture={<GameSymbol gameId={match.gameId} name={gameName} size={44} />}
      backFallback={groupResultsHref(group.id)}
    >
      <section className={overview.section}>
        <div className={styles.headRow}>
          <h2 className={overview.sectionTitle}>{t('ergebnisse.abschnitt')}</h2>
          {note !== null && <span className={styles.headNote}>{note}</span>}
        </div>
        <ul className={overview.rows} aria-label={t('ergebnisse.abschnitt')}>
          {detailRows(match, participants, scoring).map(({ personId, place, isWinner }) => {
            const member = group.members.find((entry) => entry.personId === personId);
            const catanColor = match.catanColors?.[personId];
            const score = match.scores?.[personId];
            return (
              <li key={personId} className={cx(overview.row, styles.row)}>
                {isWinner ? (
                  <span className={cx(styles.slot, styles.win)} aria-label={t('ergebnisse.sieger')}>
                    <TrophyIcon size={TROPHY_SIZE} />
                  </span>
                ) : place === null ? (
                  <span className={cx(styles.slot, styles.none)} />
                ) : (
                  <span
                    className={cx(styles.slot, podiumClass(place))}
                    aria-label={t('ergebnisse.platz', { platz: place })}
                  >
                    {place}
                  </span>
                )}
                {isCatan && catanColor !== undefined ? (
                  <Coin name={nameOf(personId)} color={catanColor} className={styles.coin} />
                ) : (
                  <span
                    className={styles.seat}
                    style={
                      member === undefined
                        ? undefined
                        : { background: `var(--color-group-${member.groupColor})` }
                    }
                    aria-hidden="true"
                  >
                    {nameOf(personId).charAt(0)}
                  </span>
                )}
                <span className={overview.rowText}>
                  <strong
                    className={cx(overview.rowTitle, !isWinner && place === null && styles.other)}
                  >
                    {nameOf(personId)}
                  </strong>
                  {isCatan && catanColor !== undefined && (
                    <span className={overview.rowNote}>{t(`farben.${catanColor}`)}</span>
                  )}
                </span>
                {score !== undefined && <span className={styles.points}>{score}</span>}
              </li>
            );
          })}
        </ul>
      </section>

      {isCatan && (
        <section className={overview.section}>
          <h2 className={overview.sectionTitle}>{t('ergebnisse.partie')}</h2>
          <dl className={cx(overview.rows, styles.facts)}>
            <div className={styles.fact}>
              <dt>{t('ergebnisse.spielversion')}</dt>
              <dd>
                {match.edition === 'base' ? t('partie.basisspiel') : t('partie.staedteUndRitter')}
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>{t('ergebnisse.modus')}</dt>
              <dd>{t('partie.standard')}</dd>
            </div>
            <div className={styles.fact}>
              <dt>{t('ergebnisse.spieldauer')}</dt>
              <dd className={cx(match.durationMinutes === undefined && styles.empty)}>
                {match.durationMinutes === undefined
                  ? t('ergebnisse.keineDauer')
                  : durationText(match.durationMinutes)}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {match.notes !== undefined && (
        <section className={overview.section}>
          <h2 className={overview.sectionTitle}>{t('ergebnisse.notizen')}</h2>
          <p className={styles.notes}>{match.notes}</p>
        </section>
      )}

      <p className={styles.meta}>
        {t('ergebnisse.eingetragen', { zeit: formatDateTime(match.recordedAt) })}
        {isChanged && (
          <>
            <br />
            {t('ergebnisse.geaendert', { zeit: formatDateTime(match.updatedAt) })}
          </>
        )}
      </p>

      {/* BL1: "Bearbeiten" as on the table page; deleting set apart below it. */}
      <div className={styles.actions}>
        <PillButton
          to={`${resultHref(group.id, match.id)}/bearbeiten`}
          icon={<PenIcon size={PILL_ICON_SIZE} />}
        >
          {t('ergebnisse.bearbeiten')}
        </PillButton>
        <PressableButton
          type="button"
          className={styles.delete}
          onClick={() => {
            setIsAsking(true);
          }}
        >
          {t('ergebnisse.loeschen')}
        </PressableButton>
      </div>

      {isAsking && (
        <MatchDialog
          title={t('ergebnisse.loeschenFrage')}
          lines={[
            t('ergebnisse.loeschenWas', {
              spiel: gameName,
              datum: dayLabel(match.date, localToday()),
            }),
            t('ergebnisse.loeschenText'),
          ]}
          cancelLabel={t('allgemein.abbrechen')}
          onCancel={() => {
            setIsAsking(false);
          }}
          confirmLabel={t('ergebnisse.loeschenKnopf')}
          isDanger
          onConfirm={() => {
            if (isPending) {
              return;
            }
            // US-ER-05 AK-2 (snapshot "Vor Löschen" with I4, variant A); errors reach the error
            // view of the routes (ADR-025). A result deleted meanwhile is gone either way.
            startTransition(async () => {
              await results.delete(match.id);
              goBack();
            });
          }}
        />
      )}
    </Page>
  );
}
