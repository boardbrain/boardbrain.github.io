import { useId, useState, useTransition, type SubmitEvent } from 'react';
import {
  CATAN_COLOR_KEYS,
  colorSchemeOf,
  findSameNamedPersons,
  GROUP_COLOR_KEYS,
  GROUP_MAX_PLAYERS_WITH_COLORS,
  GROUP_SIZE,
  isBlankName,
  normalizeColors,
  setMemberColor,
  suggestGroupName,
  type ColorScheme,
  type CustomGame,
  type GameId,
  type GroupBinding,
  type MemberColors,
  type Person,
  type PersonId,
} from '@/core/model';
import { findSupportedGame, gameCapabilities, SUPPORTED_GAMES } from '@/games/registry';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { ColorPicker } from '@/ui/components/ColorPicker';
import { Notice } from '@/ui/components/Notice';
import { GroupTable, type TableSeat } from './GroupTable';
import styles from './GroupEditor.module.css';
import { PersonBench } from './PersonBench';

type GroupEditorProps = {
  readonly persons: readonly Person[];
  readonly customGames: readonly CustomGame[];
  /** Called after the group is saved. */
  readonly onSaved: () => void;
};

// `null` = all games; otherwise the game the group is bound to.
type BindingChoice = GameId | null;

type BindingOption = {
  readonly gameId: GameId;
  readonly label: string;
  readonly maxMembers: number;
};

function schemeOf(
  memberCount: number,
  choice: BindingChoice,
  isCatanExcluded: boolean,
): ColorScheme {
  return colorSchemeOf({
    memberCount,
    boundGame:
      choice === null ? null : { hasPlayerColors: gameCapabilities(choice).playerColors !== null },
    maxPlayersWithColors: GROUP_MAX_PLAYERS_WITH_COLORS,
    excludesCatan: isCatanExcluded,
  });
}

// FA-PG-10: a supported game dictates the most members; a custom game allows all sizes.
function isChoiceAllowed(choice: BindingChoice, memberCount: number): boolean {
  if (choice === null) {
    return true;
  }
  const game = findSupportedGame(choice);
  return game === undefined || memberCount <= game.playerCount.max;
}

function toBinding(choice: BindingChoice, isCatanExcluded: boolean): GroupBinding {
  if (choice !== null) {
    return { kind: 'game', gameId: choice };
  }
  return isCatanExcluded ? { kind: 'global', excludesCatan: true } : { kind: 'global' };
}

/**
 * Editor for a new group (US-PG-02, US-PG-03): bring 2 to 12 persons to the table, check the
 * automatically assigned colours, choose what is played and save. The colours of every
 * member follow the rules of Specification 3.3.
 */
export function GroupEditor({
  persons,
  customGames,
  onSaved,
}: GroupEditorProps): React.JSX.Element {
  const { masterData } = useAppDependencies();
  const [memberIds, setMemberIds] = useState<readonly PersonId[]>([]);
  const [colors, setColors] = useState<readonly MemberColors[]>([]);
  const [choice, setChoice] = useState<BindingChoice>(null);
  const [isCatanExcluded, setIsCatanExcluded] = useState(false);
  const [activeId, setActiveId] = useState<PersonId | null>(null);
  // `null` while the user has not typed a name: the suggestion is shown then (US-PG-02 AK-2).
  const [typedName, setTypedName] = useState<string | null>(null);
  const [hasSaveFailed, setHasSaveFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const nameId = useId();

  const members = memberIds.flatMap((id) => {
    const person = persons.find((candidate) => candidate.id === id);
    return person === undefined ? [] : [person];
  });
  const scheme = schemeOf(members.length, choice, isCatanExcluded);
  const name = typedName ?? suggestGroupName(members);
  const sameNamed = findSameNamedPersons(members);
  // US-PG-02 AK-3: fewer than 2 or more than 12 members cannot be saved.
  const isCountValid = members.length >= GROUP_SIZE.min && members.length <= GROUP_SIZE.max;
  const canSave = isCountValid && sameNamed.length === 0 && !isBlankName(name) && !isPending;
  const activeIndex = Math.max(
    0,
    memberIds.findIndex((id) => id === activeId),
  );
  const activePerson = members[activeIndex];
  const activeColors = colors[activeIndex];

  const bindingOptions: readonly BindingOption[] = [
    ...SUPPORTED_GAMES.map((game) => ({
      gameId: game.id,
      label: t(game.nameKey),
      maxMembers: game.playerCount.max,
    })),
    ...customGames
      .filter((game) => !game.archived)
      .map((game) => ({ gameId: game.id, label: game.name, maxMembers: GROUP_SIZE.max })),
  ];

  // US-PG-02 AK-4: a binding the new member count no longer allows falls back to "all games".
  function change(
    nextIds: readonly PersonId[],
    nextColors: readonly Partial<MemberColors>[],
    nextChoice: BindingChoice,
    isNextCatanExcluded: boolean,
  ): void {
    const allowedChoice = isChoiceAllowed(nextChoice, nextIds.length) ? nextChoice : null;
    setMemberIds(nextIds);
    setColors(
      normalizeColors(nextColors, schemeOf(nextIds.length, allowedChoice, isNextCatanExcluded)),
    );
    setChoice(allowedChoice);
    setIsCatanExcluded(isNextCatanExcluded);
    setHasSaveFailed(false);
  }

  function toggleMember(person: Person): void {
    const index = memberIds.indexOf(person.id);
    if (index === -1) {
      setActiveId(person.id);
      change([...memberIds, person.id], [...colors, {}], choice, isCatanExcluded);
      return;
    }
    change(
      memberIds.filter((id) => id !== person.id),
      colors.filter((_, colorIndex) => colorIndex !== index),
      choice,
      isCatanExcluded,
    );
  }

  function save(): void {
    // Unexpected errors in the transition reach the error boundary of the view (ADR-025).
    startTransition(async () => {
      const result = await masterData.createGroup({
        name,
        binding: toBinding(choice, isCatanExcluded),
        personIds: memberIds,
        colors,
      });
      startTransition(() => {
        if (result.ok) {
          onSaved();
          return;
        }
        setHasSaveFailed(true);
      });
    });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (canSave) {
      save();
    }
  }

  function holderOf(field: 'groupColor' | 'catanColor', color: string): string | undefined {
    const index = colors.findIndex((memberColors) => memberColors[field] === color);
    return index === activeIndex ? undefined : members[index]?.name;
  }

  function setColor(kind: 'group' | 'catan', color: (typeof GROUP_COLOR_KEYS)[number]): void {
    // AK-5: choosing a colour someone else has swaps the two.
    setColors(setMemberColor(colors, activeIndex, kind, color, scheme));
  }

  const seats: TableSeat[] = members.flatMap((person, index) => {
    const memberColors = colors[index];
    if (memberColors === undefined) {
      return [];
    }
    // The Catan colour is a marker at the seat only where the group has one besides the group colour.
    const catanColor = scheme === 'both' ? memberColors.catanColor : undefined;
    const farbe = t(`farben.${memberColors.groupColor}`);
    const label =
      catanColor === undefined
        ? t('gruppen.platz', { name: person.name, farbe })
        : t('gruppen.platzCatan', { name: person.name, farbe, catan: t(`farben.${catanColor}`) });
    return [
      {
        id: person.id,
        label,
        initial: person.name.charAt(0),
        groupColor: memberColors.groupColor,
        ...(catanColor === undefined ? {} : { catanColor }),
      },
    ];
  });

  const isSwitchOn = isCatanExcluded || members.length > GROUP_MAX_PLAYERS_WITH_COLORS;

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-label={t('gruppen.neu')}>
      <section className={styles.section}>
        <div className={styles.head}>
          <h2>{t('gruppen.wer')}</h2>
          <span className={styles.muted} role="status">
            {t('gruppen.mitgliederAnzahl', { count: members.length })}
          </span>
        </div>
        <PersonBench
          persons={persons}
          selectedIds={memberIds}
          isFull={members.length >= GROUP_SIZE.max}
          onToggle={toggleMember}
        />
        {sameNamed.length > 0 && (
          <Notice tone="error">
            <p>
              {t('gruppen.gleicheNamen', {
                namen: sameNamed
                  .flat()
                  .map((person) => person.name)
                  .join(', '),
              })}
            </p>
          </Notice>
        )}
      </section>

      <div className={styles.columns}>
        <div className={styles.tableColumn}>
          <GroupTable
            seats={seats}
            size="large"
            selectedId={activePerson?.id}
            onSelect={setActiveId}
            title={name === '' ? t('gruppen.tischLeer') : name}
            subtitle={
              choice === null
                ? isSwitchOn
                  ? t('gruppen.bindungOhneCatan')
                  : t('gruppen.bindungGlobal')
                : bindingOptions.find((option) => option.gameId === choice)?.label
            }
          />
        </div>

        {(activePerson === undefined || activeColors === undefined) && (
          <div className={styles.card}>
            <p className={styles.cardHint}>{t('gruppen.farbenLeer')}</p>
          </div>
        )}
        {activePerson !== undefined && activeColors !== undefined && (
          <section className={styles.card}>
            <div className={styles.head}>
              <h2>{t('gruppen.farbeFuer', { name: activePerson.name })}</h2>
              <span className={styles.muted}>{t('gruppen.farbenHinweis')}</span>
            </div>
            {scheme !== 'catan-only' && (
              <>
                <span className={styles.muted}>{t('gruppen.farbeGruppeTitel')}</span>
                <ColorPicker
                  label={t('gruppen.farbeGruppe', { name: activePerson.name })}
                  palette="group"
                  options={GROUP_COLOR_KEYS}
                  selected={activeColors.groupColor}
                  holderOf={(color) => holderOf('groupColor', color)}
                  onSelect={(color) => {
                    setColor('group', color);
                  }}
                />
              </>
            )}
            {activeColors.catanColor !== undefined && (
              <>
                <span className={styles.muted}>
                  {scheme === 'catan-only'
                    ? t('gruppen.farbeCatanGruppeTitel')
                    : t('gruppen.farbeCatanTitel')}
                </span>
                <ColorPicker
                  label={t(
                    scheme === 'catan-only' ? 'gruppen.farbeCatanGruppe' : 'gruppen.farbeCatan',
                    { name: activePerson.name },
                  )}
                  palette="catan"
                  options={CATAN_COLOR_KEYS}
                  selected={activeColors.catanColor}
                  holderOf={(color) => holderOf('catanColor', color)}
                  onSelect={(color) => {
                    setColor('catan', color);
                  }}
                />
              </>
            )}
          </section>
        )}
      </div>

      <div className={styles.columns}>
        <div className={styles.section}>
          <label htmlFor={nameId} className={styles.label}>
            {t('gruppen.name')}
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="off"
            value={name}
            onChange={(event) => {
              setTypedName(event.target.value);
            }}
          />
          <span className={styles.muted}>{t('gruppen.namenHinweis')}</span>
        </div>

        <fieldset className={styles.section}>
          <legend className={styles.label}>{t('gruppen.spiele')}</legend>
          <div className={styles.segment}>
            <button
              type="button"
              className={choice === null ? styles.segmentOn : styles.segmentOff}
              aria-pressed={choice === null}
              onClick={() => {
                change(memberIds, colors, null, isCatanExcluded);
              }}
            >
              {t('gruppen.bindungGlobal')}
            </button>
            {bindingOptions.map((option) => (
              <button
                key={option.gameId}
                type="button"
                className={choice === option.gameId ? styles.segmentOn : styles.segmentOff}
                aria-pressed={choice === option.gameId}
                disabled={members.length > option.maxMembers}
                onClick={() => {
                  change(memberIds, colors, option.gameId, isCatanExcluded);
                }}
              >
                {t('gruppen.bindungNur', { spiel: option.label })}
              </button>
            ))}
          </div>
          {bindingOptions
            .filter((option) => members.length > option.maxMembers)
            .map((option) => (
              <span key={option.gameId} className={styles.muted}>
                {t('gruppen.bindungGesperrt', {
                  spiel: option.label,
                  max: option.maxMembers,
                  count: members.length,
                })}
              </span>
            ))}
          {choice === null && (
            <button
              type="button"
              className={styles.switchRow}
              role="switch"
              aria-checked={isSwitchOn}
              disabled={members.length > GROUP_MAX_PLAYERS_WITH_COLORS}
              onClick={() => {
                change(memberIds, colors, choice, !isCatanExcluded);
              }}
            >
              <span className={styles.switchText}>
                <strong>{t('gruppen.catanAusschliessen')}</strong>
                <span className={styles.muted}>
                  {members.length > GROUP_MAX_PLAYERS_WITH_COLORS
                    ? t('gruppen.catanAusschliessenZuViele')
                    : t('gruppen.catanAusschliessenHinweis')}
                </span>
              </span>
              <span
                className={isSwitchOn ? styles.switchOn : styles.switchOff}
                aria-hidden="true"
              />
            </button>
          )}
        </fieldset>
      </div>

      {hasSaveFailed && (
        <Notice tone="error">
          <p>{t('gruppen.fehlerSpeichern')}</p>
        </Notice>
      )}
      <div className={styles.saveBar}>
        <button type="submit" className={styles.save} disabled={!canSave}>
          {t('gruppen.speichern')}
        </button>
      </div>
    </form>
  );
}
