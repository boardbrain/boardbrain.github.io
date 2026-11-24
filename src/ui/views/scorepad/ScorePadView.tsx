import { useRef, useState, useTransition } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  parseGameId,
  parseGroupId,
  type CustomGame,
  type GameId,
  type Group,
  type GroupId,
  type Person,
  type PersonId,
} from '@/core/model';
import {
  DEFAULT_SCORE_PAD_SETTINGS,
  isScorePadNumber,
  isTargetReached,
  personsAtTarget,
  placesOfStanding,
  standingsOf,
  totalsOf,
  type ScorePadSettings,
  type ScoreRound,
} from '@/core/scorepad';
import { t } from '@/i18n/t';
import { useCurrentScorePad, useCustomGame, useGroup, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { BackButton } from '@/ui/components/BackButton';
import { ExitDoorIcon, SlidersIcon, TargetIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import { useGoBack } from '@/ui/components/useGoBack';
import { MatchDialog } from '@/ui/views/match/MatchDialog';
import shared from '@/ui/views/match/Match.module.css';
import type { ResultPerson } from '@/ui/views/result/ResultRows';
import { EntryBar, type EntryTarget } from './EntryBar';
import { ReachedSheet, SettingsSheet } from './PadSheets';
import { targetText } from './padTexts';
import { ScoreBlock } from './ScoreBlock';
import styles from './ScorePadView.module.css';

const HEAD_ICON_SIZE = 22;
const DOOR_SIZE = 20;
const TARGET_SIZE = 14;
const WHOLE_NUMBER = /^-?\d+$/u;

type Entry =
  | { readonly kind: 'round'; readonly current: PersonId }
  | { readonly kind: 'cell'; readonly index: number; readonly personId: PersonId };

type Asking = { readonly kind: 'quit' } | { readonly kind: 'delete'; readonly index: number };

/**
 * The persons of the score pad in its order, with name and table colour.
 */
export function padPersons(
  participants: readonly PersonId[],
  group: Group,
  persons: readonly Person[],
): ResultPerson[] {
  return participants.flatMap((id) => {
    const person = persons.find((candidate) => candidate.id === id);
    const member = group.members.find((candidate) => candidate.personId === id);
    return person === undefined || member === undefined
      ? []
      : [{ id, name: person.name, groupColor: member.groupColor }];
  });
}

function parseEntry(text: string | undefined): number | null {
  if (text === undefined || !WHOLE_NUMBER.test(text.trim())) {
    return null;
  }
  const value = Number(text.trim());
  return isScorePadNumber(value) ? value : null;
}

type PadData = {
  readonly gameId: GameId;
  readonly groupId: GroupId;
  readonly participants: readonly PersonId[];
  readonly rounds: readonly ScoreRound[];
  readonly settings: ScorePadSettings;
};

type PadPageProps = {
  readonly pad: PadData;
  readonly game: CustomGame;
  readonly group: Group;
  readonly persons: readonly Person[];
  /** Not started yet: the sheet "Los geht’s" is open and "Starten" stores the score pad. */
  readonly isNew: boolean;
};

/**
 * The page of the score pad (US-NB-02, US-NB-03, US-NB-04, design I3-C2 LA3, ZO1, ZY5, GE2): head
 * with game, table and target, settings and "Beenden ohne Ergebnis"; the block with the new round;
 * at the bottom only "Ergebnis speichern". Numbers are typed with the keyboard of the device and
 * the bar above it (EK5); a complete round stores itself.
 */
function PadPage({ pad, game, group, persons, isNew }: PadPageProps): React.JSX.Element {
  const { scorePad } = useAppDependencies();
  const navigate = useNavigate();
  const goBackFromStart = useGoBack('/notizblock/neu');
  const inputRef = useRef<HTMLInputElement>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [draft, setDraft] = useState<Readonly<Record<PersonId, string>>>({});
  const [cellText, setCellText] = useState('');
  const [missing, setMissing] = useState<readonly PersonId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(isNew);
  const [isReachedOpen, setIsReachedOpen] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  const [isPending, startTransition] = useTransition();
  const { participants, rounds, settings } = pad;
  const people = padPersons(participants, group, persons);
  const byId = new Map(people.map((person) => [person.id, person]));
  const scoring = game.scoring ?? 'highest-wins';
  const isSelf = settings.calculation === 'self';
  const standings = standingsOf(rounds, participants);
  const totals = totalsOf(rounds, participants);
  const roundNumber = rounds.length + 1;
  const subtitle = t('notizblock.blattUnterzeile', { spiel: game.name, tisch: group.name });
  const target = settings.target;
  const isReached = isTargetReached(target, rounds, participants);
  const entries: Record<PersonId, number | undefined> = {};
  for (const personId of participants) {
    const value = parseEntry(draft[personId]);
    entries[personId] = value ?? undefined;
  }

  function focusField(): void {
    // iOS opens the keyboard only for a field focused within the tap.
    inputRef.current?.focus({ preventScroll: true });
  }

  function openRound(personId: PersonId): void {
    focusField();
    setEntry({ kind: 'round', current: personId });
    setError(null);
  }

  function openCell(index: number, personId: PersonId): void {
    const round = rounds[index];
    if (round === undefined) {
      return;
    }
    focusField();
    const shown = isSelf ? standings[index]?.[personId] : round[personId];
    setEntry({ kind: 'cell', index, personId });
    setCellText(String(shown ?? ''));
    setError(null);
  }

  function nextMissing(after: PersonId): PersonId | null {
    const start = participants.indexOf(after);
    const order = [...participants.slice(start + 1), ...participants.slice(0, start + 1)];
    return order.find((personId) => entries[personId] === undefined) ?? null;
  }

  function saveRound(complete: ScoreRound): void {
    startTransition(async () => {
      const saved = await scorePad.addRound(rounds.length, complete);
      if (saved.ok) {
        setDraft({});
        setMissing([]);
        setIsReachedOpen(saved.value.isTargetReachedNow);
        return;
      }
      if (saved.error === 'round-changed') {
        setDraft({});
        return;
      }
      setError(t('notizblock.ungueltig'));
    });
  }

  function saveCell(index: number, personId: PersonId, value: number): void {
    startTransition(async () => {
      const saved = await scorePad.changeEntry(index, personId, value);
      if (saved.ok) {
        setIsReachedOpen(saved.value.isTargetReachedNow);
      } else {
        setError(t('notizblock.ungueltig'));
      }
    });
  }

  // US-NB-02 AK-3: "Weiter" moves to the next person still missing; once everybody has a number,
  // the field is left and the round stores itself.
  function enter(): void {
    if (entry === null) {
      return;
    }
    if (entry.kind === 'cell') {
      if (parseEntry(cellText) === null) {
        setError(t('notizblock.ungueltig'));
        return;
      }
      inputRef.current?.blur();
      return;
    }
    const text = draft[entry.current];
    if (text !== undefined && text.trim() !== '' && parseEntry(text) === null) {
      setError(t('notizblock.ungueltig'));
      return;
    }
    const next = nextMissing(entry.current);
    if (next === null) {
      inputRef.current?.blur();
      return;
    }
    if (next === entry.current) {
      setError(t('notizblock.nochNichtAlle'));
      return;
    }
    setEntry({ kind: 'round', current: next });
    setError(null);
  }

  // The keyboard was closed or the field left: a complete round stores itself, otherwise the
  // missing fields are marked (US-NB-02 AK-3); a changed number is stored.
  function close(): void {
    const was = entry;
    setEntry(null);
    setError(null);
    if (was === null) {
      return;
    }
    if (was.kind === 'cell') {
      const value = parseEntry(cellText);
      const round = rounds[was.index];
      const before = isSelf ? standings[was.index]?.[was.personId] : round?.[was.personId];
      if (value !== null && value !== before) {
        saveCell(was.index, was.personId, value);
      }
      return;
    }
    const absent = participants.filter((personId) => entries[personId] === undefined);
    if (absent.length === 0) {
      const complete: Record<PersonId, number> = {};
      for (const personId of participants) {
        complete[personId] = entries[personId] ?? 0;
      }
      saveRound(complete);
      return;
    }
    setMissing(absent.length < participants.length ? absent : []);
  }

  const current =
    entry === null ? null : byId.get(entry.kind === 'round' ? entry.current : entry.personId);
  const entryTarget: EntryTarget | null =
    entry === null || current === undefined || current === null
      ? null
      : {
          person: current,
          subtitle:
            entry.kind === 'cell'
              ? t('notizblock.rundeAendern', { runde: entry.index + 1 })
              : isSelf
                ? t('notizblock.neuerStand')
                : t('notizblock.runde', { runde: roundNumber }),
        };
  const isLastMissing =
    entry?.kind === 'round'
      ? participants.every(
          (personId) => personId === entry.current || entries[personId] !== undefined,
        )
      : true;
  const deleteIndex = asking?.kind === 'delete' ? asking.index : null;
  const canFinish = rounds.length > 0 && !isNew;

  return (
    <main className={cx(shared.main, styles.main)}>
      <div className={shared.pageHead}>
        <BackButton fallback="/" />
        <div className={shared.titles}>
          <h1 className={shared.title}>{game.name}</h1>
          <div className={shared.sub}>
            {group.name}
            {target !== null && (
              <>
                {t('notizblock.trenner')}
                <PressableButton
                  type="button"
                  className={cx(styles.targetBtn, isReached && styles.reached)}
                  aria-label={t('notizblock.zielLabel', { ziel: targetText(target) })}
                  onClick={() => {
                    setIsSettingsOpen(true);
                  }}
                >
                  <TargetIcon size={TARGET_SIZE} />
                  {targetText(target)}
                </PressableButton>
              </>
            )}
          </div>
        </div>
        <PressableButton
          type="button"
          className={shared.iconBtn}
          aria-label={t('notizblock.einstellungen')}
          onClick={() => {
            setIsSettingsOpen(true);
          }}
        >
          <SlidersIcon size={HEAD_ICON_SIZE} />
        </PressableButton>
        <PressableButton
          type="button"
          className={shared.iconBtn}
          aria-label={t('notizblock.beendenOhne')}
          title={t('notizblock.beendenOhne')}
          onClick={() => {
            setAsking({ kind: 'quit' });
          }}
        >
          <ExitDoorIcon size={DOOR_SIZE} />
        </PressableButton>
      </div>

      <ScoreBlock
        persons={people}
        rounds={rounds}
        scoring={scoring}
        calculation={settings.calculation}
        target={target}
        editing={entry?.kind === 'cell' ? entry : null}
        newRound={{
          entries,
          current: entry?.kind === 'round' ? entry.current : null,
          missing,
        }}
        onCell={openCell}
        onNewCell={openRound}
        onRound={(index) => {
          setAsking({ kind: 'delete', index });
        }}
      />
      {missing.length > 0 && (
        <p className={styles.nudge} role="status">
          {t('notizblock.nochNichtAlle')}
        </p>
      )}

      <div className={cx(styles.bottom, entry !== null && styles.underKeyboard)}>
        <PressableButton
          type="button"
          className={cx(shared.primary, !canFinish && styles.looksOff)}
          aria-disabled={!canFinish}
          onClick={() => {
            if (canFinish) {
              void navigate('/notizblock/ergebnis');
            }
          }}
        >
          {t('notizblock.ergebnisSpeichern')}
        </PressableButton>
      </div>

      <EntryBar
        isOpen={entry !== null}
        inputRef={inputRef}
        target={entryTarget}
        strip={entry?.kind === 'round' ? people : []}
        entries={entries}
        value={
          entry?.kind === 'cell' ? cellText : entry === null ? '' : (draft[entry.current] ?? '')
        }
        isLast={isLastMissing}
        error={error}
        onValue={(text) => {
          setError(null);
          if (entry?.kind === 'round') {
            setDraft({ ...draft, [entry.current]: text });
            setMissing(missing.filter((personId) => personId !== entry.current));
          } else {
            setCellText(text);
          }
        }}
        onEnter={enter}
        onPerson={(personId) => {
          setEntry({ kind: 'round', current: personId });
          setError(null);
        }}
        onClose={close}
      />

      {isSettingsOpen && (
        <SettingsSheet
          settings={settings}
          subtitle={subtitle}
          isStart={isNew}
          isBusy={isPending}
          onClose={() => {
            if (isNew) {
              goBackFromStart();
              return;
            }
            setIsSettingsOpen(false);
          }}
          onDone={(chosen) => {
            startTransition(async () => {
              if (isNew) {
                const started = await scorePad.start({
                  gameId: pad.gameId,
                  groupId: pad.groupId,
                  settings: chosen,
                });
                // Started, the page leads to the running score pad on its own (NewPad).
                if (!started.ok) {
                  void navigate('/', { replace: true });
                }
                return;
              }
              const changed = await scorePad.changeSettings(chosen);
              setIsSettingsOpen(false);
              if (changed.ok) {
                setIsReachedOpen(changed.value.isTargetReachedNow);
              }
            });
          }}
        />
      )}
      {isReachedOpen && target !== null && (
        <ReachedSheet
          persons={people}
          totals={totals}
          places={placesOfStanding(totals, participants, scoring)}
          atTarget={personsAtTarget(target, rounds, participants).flatMap((personId) => {
            const person = byId.get(personId);
            return person === undefined ? [] : [person];
          })}
          target={target}
          rounds={rounds.length}
          isSelf={isSelf}
          onContinue={() => {
            setIsReachedOpen(false);
          }}
          onFinish={() => {
            setIsReachedOpen(false);
            void navigate('/notizblock/ergebnis');
          }}
        />
      )}
      {asking?.kind === 'quit' && (
        <MatchDialog
          title={t('notizblock.beendenFrage')}
          lines={[
            rounds.length === 0
              ? t('notizblock.beendenKeineRunde')
              : rounds.length === 1
                ? t('notizblock.beendenEineRunde')
                : t('notizblock.beendenRunden', { anzahl: rounds.length }),
            t('notizblock.beendenText'),
          ]}
          cancelLabel={t('allgemein.abbrechen')}
          onCancel={() => {
            setAsking(null);
          }}
          confirmLabel={t('notizblock.beenden')}
          isDanger
          onConfirm={() => {
            setAsking(null);
            if (isNew) {
              void navigate('/', { replace: true });
              return;
            }
            startTransition(async () => {
              await scorePad.endWithoutResult();
              void navigate('/', { replace: true });
            });
          }}
        />
      )}
      {deleteIndex !== null && (
        <MatchDialog
          title={t('notizblock.rundeLoeschenFrage', { runde: deleteIndex + 1 })}
          lines={[t('notizblock.rundeLoeschenText')]}
          cancelLabel={t('allgemein.abbrechen')}
          onCancel={() => {
            setAsking(null);
          }}
          confirmLabel={t('notizblock.loeschen')}
          isDanger
          onConfirm={() => {
            setAsking(null);
            startTransition(async () => {
              const deleted = await scorePad.deleteRound(deleteIndex);
              if (deleted.ok) {
                setIsReachedOpen(deleted.value.isTargetReachedNow);
              }
            });
          }}
        />
      )}
    </main>
  );
}

/**
 * The persons and the table of a score pad, `undefined` while loading, `null` if gone.
 */
// The ids stay the same while a component uses this: a live query keeps its last answer while it
// asks anew for another id, so a changed id would first look like a missing game.
function usePadBasics(
  gameId: GameId,
  groupId: GroupId,
): { game: CustomGame; group: Group; persons: readonly Person[] } | null | undefined {
  const { db } = useAppDependencies();
  const game = useCustomGame(db, gameId);
  const group = useGroup(db, groupId);
  const persons = usePersons(db);
  if (game === undefined || group === undefined || persons === undefined) {
    return undefined;
  }
  if (game === null || group === null) {
    return null;
  }
  return { game, group, persons };
}

/**
 * The running score pad `#/notizblock` (US-NB-02 to US-NB-04). Without one, back to the start; a
 * score pad of another version can only be ended (Architecture 10.5).
 */
export function ScorePadView(): React.JSX.Element | null {
  const { db, scorePad } = useAppDependencies();
  const navigate = useNavigate();
  const current = useCurrentScorePad(db);
  const pad = current?.status === 'active' ? current.pad : null;
  if (current === undefined) {
    return null;
  }
  if (current.status === 'none') {
    return <Navigate to="/" replace />;
  }
  if (current.status === 'unsupported' || pad === null) {
    return (
      <main className={shared.main}>
        <div className={shared.pageHead}>
          <BackButton fallback="/" />
          <div className={shared.titles}>
            <h1 className={shared.title}>{t('notizblock.titel')}</h1>
            <div className={shared.sub}>{t('notizblock.unbekannt')}</div>
          </div>
        </div>
        <p className={shared.hint}>{t('notizblock.unbekanntText')}</p>
        <PressableButton
          type="button"
          className={shared.secondary}
          onClick={() => {
            void scorePad.endWithoutResult().then(() => navigate('/', { replace: true }));
          }}
        >
          <ExitDoorIcon size={DOOR_SIZE} />
          {t('notizblock.beendenOhne')}
        </PressableButton>
      </main>
    );
  }
  return <RunningPad key={`${pad.gameId}/${pad.groupId}`} pad={pad} />;
}

function RunningPad({ pad }: { readonly pad: PadData }): React.JSX.Element | null {
  const basics = usePadBasics(pad.gameId, pad.groupId);
  if (basics === undefined) {
    return null;
  }
  if (basics === null) {
    return <Navigate to="/" replace />;
  }
  return <PadPage pad={pad} isNew={false} {...basics} />;
}

/**
 * A score pad before "Starten" `#/notizblock/neu/‹spiel›/‹tisch›` (US-NB-01 AK-3): the empty
 * block under the sheet "Los geht’s"; nothing is stored until "Starten". With a running match or
 * score pad, or for a game or table that does not fit, it leads away.
 */
export function NewScorePadView(): React.JSX.Element | null {
  const { gameId = '', groupId = '' } = useParams();
  const game = parseGameId(gameId);
  const group = parseGroupId(groupId);
  if (!game.ok || !group.ok) {
    return <Navigate to="/notizblock/neu" replace />;
  }
  return <NewPad key={`${gameId}/${groupId}`} gameId={game.value} groupId={group.value} />;
}

function NewPad({
  gameId,
  groupId,
}: {
  readonly gameId: GameId;
  readonly groupId: GroupId;
}): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const current = useCurrentScorePad(db);
  const basics = usePadBasics(gameId, groupId);
  if (current === undefined || basics === undefined) {
    return null;
  }
  if (current.status !== 'none') {
    return <Navigate to="/notizblock" replace />;
  }
  if (basics === null || basics.game.archived || basics.game.scoring === undefined) {
    return <Navigate to="/notizblock/neu" replace />;
  }
  return (
    <PadPage
      pad={{
        gameId,
        groupId,
        participants: basics.group.members.map((member) => member.personId),
        rounds: [],
        settings: DEFAULT_SCORE_PAD_SETTINGS,
      }}
      isNew
      {...basics}
    />
  );
}
