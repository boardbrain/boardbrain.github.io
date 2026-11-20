import { useId, useState, useTransition } from 'react';
import {
  cleanName,
  containsName,
  type CustomGame,
  type GameId,
  type ScoringDirection,
} from '@/core/model';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { ConfirmDialog } from '@/ui/components/ConfirmDialog';
import { cx } from '@/ui/components/classNames';
import { PressableButton } from '@/ui/components/Pressable';
import styles from './GameEditor.module.css';

type Scoring = ScoringDirection | null;

const SCORING_ROWS = [
  { value: null, title: 'spiele.wertung.keine', text: 'spiele.wertung.keineText' },
  { value: 'highest-wins', title: 'spiele.wertung.meiste', text: 'spiele.wertung.meisteText' },
  { value: 'lowest-wins', title: 'spiele.wertung.wenigste', text: 'spiele.wertung.wenigsteText' },
] as const;

function resultsText(count: number): string {
  return count === 1
    ? t('spiele.einErgebnisMitPunkten')
    : t('spiele.ergebnisseMitPunkten', { anzahl: count });
}

type GameEditorProps = {
  /** The game to edit; without it a new game is created (US-SP-02). */
  readonly game?: CustomGame | undefined;
  /** Names of all other games, Catan included (US-SP-02 AK-2). */
  readonly otherNames: readonly string[];
  /** Results of the game with points: "Keine" is locked and a new direction asks (US-VW-07). */
  readonly scoredCount: number;
  readonly onSaved: (gameId: GameId) => void;
};

/**
 * "Neues Spiel" and "Spiel bearbeiten" (design I3-B V2, US-SP-02 AK-1, AK-4, US-VW-07): name and
 * "Punkte" as a list. A taken name shows at once and locks saving; "Keine" is locked while results
 * have points; changing the direction of such a game asks before saving.
 */
export function GameEditor({
  game,
  otherNames,
  scoredCount,
  onSaved,
}: GameEditorProps): React.JSX.Element {
  const { masterData } = useAppDependencies();
  const nameId = useId();
  const scoringId = useId();
  const [name, setName] = useState(game?.name ?? '');
  const [scoring, setScoring] = useState<Scoring>(game?.scoring ?? null);
  const [isAsking, setIsAsking] = useState(false);
  const [isTakenOnSave, setIsTakenOnSave] = useState(false);
  // Once stored, the new name is among the taken ones until the page closes; no hint then.
  const [isSaved, setIsSaved] = useState(false);
  const [isNoneRefused, setIsNoneRefused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isTaken = !isSaved && (containsName(otherNames, name) || isTakenOnSave);
  const isNoneLocked = scoredCount > 0;
  const isChanged = cleanName(name) !== game?.name || scoring !== (game.scoring ?? null);
  const canSave = cleanName(name) !== '' && !isTaken && isChanged && !isPending;

  function store(): void {
    setIsAsking(false);
    // Unexpected errors in the transition reach the error view of the routes (ADR-025).
    startTransition(async () => {
      if (game === undefined) {
        const created = await masterData.createCustomGame(name, scoring ?? undefined);
        if (created.ok) {
          setIsSaved(true);
          onSaved(created.value.id);
        } else {
          // Only if a game of this name was created meanwhile; empty names cannot be saved.
          setIsTakenOnSave(true);
        }
        return;
      }
      if (cleanName(name) !== game.name) {
        const renamed = await masterData.renameCustomGame({ gameId: game.id, name });
        if (!renamed.ok) {
          setIsTakenOnSave(true);
          return;
        }
      }
      if (scoring !== (game.scoring ?? null)) {
        const changed = await masterData.changeCustomGameScoring({ gameId: game.id, scoring });
        if (!changed.ok) {
          // US-VW-07 AK-4: a result with points was stored meanwhile; the editor stays open.
          setIsNoneRefused(true);
          return;
        }
      }
      setIsSaved(true);
      onSaved(game.id);
    });
  }

  // US-VW-07 AK-3: a new direction changes places and statistics of results with points.
  const shouldAsk =
    game?.scoring !== undefined && scoring !== null && scoring !== game.scoring && scoredCount > 0;

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) {
          return;
        }
        if (shouldAsk) {
          setIsAsking(true);
          return;
        }
        store();
      }}
    >
      <div className={styles.section}>
        <label htmlFor={nameId} className={styles.label}>
          {t('allgemein.name')}
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="off"
          className={cx(styles.field, isTaken && styles.bad)}
          placeholder={t('spiele.nameBeispiel')}
          aria-label={t('spiele.nameFeld')}
          aria-invalid={isTaken}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setIsTakenOnSave(false);
          }}
        />
        {isTaken && <p className={styles.error}>{t('spiele.nameGibtEs')}</p>}
      </div>
      <div className={styles.section}>
        <h2 id={scoringId} className={styles.label}>
          {t('spiele.punkte')}
        </h2>
        <div className={styles.group} role="radiogroup" aria-labelledby={scoringId}>
          {SCORING_ROWS.map((row) => (
            <PressableButton
              key={row.title}
              type="button"
              role="radio"
              className={styles.radioRow}
              aria-checked={scoring === row.value}
              disabled={row.value === null && isNoneLocked}
              onClick={() => {
                setScoring(row.value);
                setIsNoneRefused(false);
              }}
            >
              <span className={styles.radio} aria-hidden="true" />
              <span className={styles.text}>
                {t(row.title)}
                <small className={styles.sub}>{t(row.text)}</small>
              </span>
            </PressableButton>
          ))}
        </div>
        {isNoneRefused && <p className={styles.error}>{t('spiele.keineNichtMehr')}</p>}
        {isNoneLocked && game?.scoring !== undefined && (
          <p className={styles.hint}>
            {t('spiele.keineGesperrt', { ergebnisse: resultsText(scoredCount) })}
          </p>
        )}
      </div>
      <div className={styles.saveBar}>
        <PressableButton type="submit" className={styles.save} disabled={!canSave}>
          {t(game === undefined ? 'spiele.anlegen' : 'spiele.aenderungenSpeichern')}
        </PressableButton>
      </div>
      {isAsking && (
        <ConfirmDialog
          title={t('spiele.umkehrenFrage')}
          text={t('spiele.umkehrenText', {
            ergebnisse:
              scoredCount === 1
                ? t('spiele.einemErgebnis')
                : t('spiele.ergebnissen', { anzahl: scoredCount }),
          })}
          cancelLabel={t('allgemein.abbrechen')}
          confirmLabel={t('spiele.umkehren')}
          onCancel={() => {
            setIsAsking(false);
          }}
          onConfirm={store}
        />
      )}
    </form>
  );
}
