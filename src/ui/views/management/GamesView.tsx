import { useId, useState, useTransition } from 'react';
import { Link } from 'react-router';
import type { NameDuplicateError } from '@/app/services/masterDataService';
import { cleanName, type CustomGame, type Group, type NameEmptyError } from '@/core/model';
import { SUPPORTED_GAMES } from '@/games/registry';
import { useCustomGames, useGroups } from '@/infra/db/readHooks';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { NameForm } from '@/ui/components/NameForm';
import { ChevronIcon } from '@/ui/components/Icons';
import { Notice } from '@/ui/components/Notice';
import { Page } from '@/ui/components/Page';
import overview from './Overview.module.css';
import styles from './GamesView.module.css';

// `submitted` is the input the message belongs to; the message is hidden once the input changes.
type Message = {
  readonly error: NameEmptyError | NameDuplicateError;
  readonly submitted: string;
};

const CHEVRON_SIZE = 18;

// How many tables play only this game, e.g. "2 Tische nur dafür" (design I1-F).
function boundTablesText(game: CustomGame, groups: readonly Group[]): string {
  const count = groups.filter(
    (group) => group.binding.kind === 'game' && group.binding.gameId === game.id,
  ).length;
  if (count === 0) {
    return t('spiele.keinEigenerTisch');
  }
  return count === 1
    ? t('spiele.einTischNurDafuer')
    : t('spiele.tischeNurDafuer', { anzahl: count });
}

/**
 * Game management `#/verwaltung/spiele` (US-SP-02): supported and custom games in separate
 * areas (FA-SP-03) and creating custom games with a unique name (AK-2). A custom game opens
 * its page (US-VW-07, design I1-F); Catan is built in and has none.
 */
export function GamesView(): React.JSX.Element {
  const { db, masterData } = useAppDependencies();
  const customGames = useCustomGames(db);
  const groups = useGroups(db);
  const [name, setName] = useState('');
  const [message, setMessage] = useState<Message | null>(null);
  const [isPending, startTransition] = useTransition();
  const supportedId = useId();

  function save(): void {
    // Unexpected errors in the transition reach the error boundary of the view (ADR-025).
    const submitted = name;
    startTransition(async () => {
      const result = await masterData.createCustomGame(submitted);
      startTransition(() => {
        if (result.ok) {
          // Keep a name that was typed while saving was still running.
          setName((current) => (current === submitted ? '' : current));
          setMessage(null);
          return;
        }
        setMessage({ error: result.error, submitted });
      });
    });
  }

  const visibleMessage = message?.submitted === name ? message : null;

  function handleNameChange(value: string): void {
    setName(value);
    setMessage(null);
  }

  return (
    <Page title={t('spiele.titel')} backFallback="/verwaltung">
      <NameForm
        title={t('spiele.neu')}
        value={name}
        isPending={isPending}
        onValueChange={handleNameChange}
        onSubmit={save}
      >
        {visibleMessage?.error === 'name-duplicate' && (
          <Notice tone="error">
            <p>{t('spiele.gleicherName', { name: cleanName(visibleMessage.submitted) })}</p>
          </Notice>
        )}
        {visibleMessage?.error === 'name-empty' && (
          <Notice tone="error">
            <p>{t('verwaltung.nameLeer')}</p>
          </Notice>
        )}
      </NameForm>
      <section className={overview.section} aria-labelledby={supportedId}>
        <h2 id={supportedId} className={overview.sectionTitle}>
          {t('spiele.unterstuetzt')}
        </h2>
        <ul className={overview.rows} aria-label={t('spiele.unterstuetzt')}>
          {SUPPORTED_GAMES.map((game) => (
            <li key={game.id} className={overview.row}>
              <span className={overview.rowText}>
                <strong className={overview.rowTitle}>{t(game.nameKey)}</strong>
                <span className={overview.rowNote}>{t('spiele.catanBeschreibung')}</span>
              </span>
              <span className={styles.builtIn}>{t('spiele.festEingebaut')}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className={overview.section} aria-label={t('spiele.eigene')}>
        <h2 className={overview.sectionTitle}>
          {t('spiele.eigeneAnzahl', { anzahl: customGames?.length ?? 0 })}
        </h2>
        {customGames?.length === 0 && <p className={overview.hint}>{t('spiele.eigeneLeer')}</p>}
        {customGames !== undefined && customGames.length > 0 && (
          <ul className={overview.rows} aria-label={t('spiele.eigene')}>
            {customGames.map((game) => (
              <li key={game.id}>
                {/* US-VW-07: a custom game opens its page, where it can be renamed. */}
                <Link to={`/verwaltung/spiele/${game.id}`} className={overview.row}>
                  <span className={overview.rowText}>
                    <strong className={overview.rowTitle}>{game.name}</strong>
                    <span className={overview.rowNote}>{boundTablesText(game, groups ?? [])}</span>
                  </span>
                  <span className={overview.chevron}>
                    <ChevronIcon size={CHEVRON_SIZE} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
