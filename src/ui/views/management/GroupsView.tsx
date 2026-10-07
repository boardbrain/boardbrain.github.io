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
  type GroupBinding,
  type MemberColors,
  type Person,
  type PersonId,
} from '@/core/model';
import { findSupportedGame, gameCapabilities, SUPPORTED_GAMES } from '@/games/registry';
import { t } from '@/i18n/t';
import { useCustomGames, useGroups, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { ColorPicker } from '@/ui/components/ColorPicker';
import { NameList } from '@/ui/components/NameList';
import { Notice } from '@/ui/components/Notice';
import { Page } from '@/ui/components/Page';
import styles from './GroupsView.module.css';

const GLOBAL_BINDING: GroupBinding = { kind: 'global' };

/**
 * Group management `#/verwaltung/gruppen` (US-PG-02, US-PG-03): choose 2 to 12 persons, a
 * binding and a name, check the automatically assigned colours and create the group.
 */
export function GroupsView(): React.JSX.Element {
  const { db, masterData } = useAppDependencies();
  const persons = usePersons(db);
  const customGames = useCustomGames(db);
  const groups = useGroups(db);
  const [memberIds, setMemberIds] = useState<readonly PersonId[]>([]);
  const [colors, setColors] = useState<readonly MemberColors[]>([]);
  const [binding, setBinding] = useState<GroupBinding>(GLOBAL_BINDING);
  // `null` while the user has not typed a name: the suggestion is shown then (US-PG-02 AK-2).
  const [typedName, setTypedName] = useState<string | null>(null);
  const [hasSaveFailed, setHasSaveFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const nameId = useId();

  const activePersons = (persons ?? []).filter((person) => !person.archived);
  const members = memberIds.flatMap((id) => {
    const person = activePersons.find((candidate) => candidate.id === id);
    return person === undefined ? [] : [person];
  });
  const scheme = schemeOf(members.length, binding);
  const name = typedName ?? suggestGroupName(members);
  const sameNamed = findSameNamedPersons(members);
  // US-PG-02 AK-3: fewer than 2 or more than 12 members cannot be saved.
  const isCountValid = members.length >= GROUP_SIZE.min && members.length <= GROUP_SIZE.max;
  const canSave = isCountValid && sameNamed.length === 0 && !isBlankName(name) && !isPending;

  // US-PG-02 AK-4: a binding the new member count no longer allows falls back to "all games".
  function change(
    nextIds: readonly PersonId[],
    nextColors: readonly Partial<MemberColors>[],
  ): void {
    const nextBinding = isBindingAllowed(binding, nextIds.length) ? binding : GLOBAL_BINDING;
    setMemberIds(nextIds);
    setColors(normalizeColors(nextColors, schemeOf(nextIds.length, nextBinding)));
    setBinding(nextBinding);
    setHasSaveFailed(false);
  }

  function toggleMember(person: Person): void {
    const index = memberIds.indexOf(person.id);
    if (index === -1) {
      change([...memberIds, person.id], [...colors, {}]);
      return;
    }
    change(
      memberIds.filter((id) => id !== person.id),
      colors.filter((_, colorIndex) => colorIndex !== index),
    );
  }

  function chooseBinding(next: GroupBinding): void {
    setBinding(next);
    // FA-PG-08: the colours of the new scheme are completed with free colours.
    setColors(normalizeColors(colors, schemeOf(memberIds.length, next)));
    setHasSaveFailed(false);
  }

  function save(): void {
    // Unexpected errors in the transition reach the error boundary of the view (ADR-025).
    startTransition(async () => {
      const result = await masterData.createGroup({
        name,
        binding,
        personIds: memberIds,
        colors,
      });
      startTransition(() => {
        if (result.ok) {
          setMemberIds([]);
          setColors([]);
          setBinding(GLOBAL_BINDING);
          setTypedName(null);
          setHasSaveFailed(false);
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

  const bindingOptions = [
    ...SUPPORTED_GAMES.map((game) => ({
      binding: { kind: 'game', gameId: game.id } satisfies GroupBinding,
      label: t(game.nameKey),
      maxMembers: game.playerCount.max,
    })),
    ...(customGames ?? [])
      .filter((game) => !game.archived)
      .map((game) => ({
        binding: { kind: 'game', gameId: game.id } satisfies GroupBinding,
        label: game.name,
        maxMembers: GROUP_SIZE.max,
      })),
  ];

  return (
    <Page title={t('gruppen.titel')}>
      {persons !== undefined && activePersons.length < GROUP_SIZE.min && (
        <Notice tone="warning">
          <p>{t('gruppen.zuWenigPersonen')}</p>
        </Notice>
      )}
      <form onSubmit={handleSubmit} aria-label={t('gruppen.neu')}>
        <div className={styles.layout}>
          <fieldset className={styles.section}>
            <legend className={styles.legend}>{t('gruppen.mitglieder')}</legend>
            {activePersons.map((person) => {
              const isSelected = memberIds.includes(person.id);
              return (
                <label key={person.id} className={styles.choice}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!isSelected && members.length >= GROUP_SIZE.max}
                    onChange={() => {
                      toggleMember(person);
                    }}
                  />
                  {person.name}
                </label>
              );
            })}
            <p className={styles.hint} role="status">
              {t('gruppen.mitgliederAnzahl', { count: members.length })}
            </p>
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
          </fieldset>

          <div className={styles.section}>
            <label htmlFor={nameId} className={styles.legend}>
              {t('gruppen.name')}
            </label>
            <input
              id={nameId}
              className={styles.input}
              type="text"
              autoComplete="off"
              value={name}
              onChange={(event) => {
                setTypedName(event.target.value);
              }}
            />
            <fieldset className={styles.section}>
              <legend className={styles.legend}>{t('gruppen.bindung')}</legend>
              <label className={styles.choice}>
                <input
                  type="radio"
                  name="binding"
                  checked={binding.kind === 'global'}
                  onChange={() => {
                    chooseBinding(GLOBAL_BINDING);
                  }}
                />
                {t('gruppen.bindungGlobal')}
              </label>
              {bindingOptions.map((option) => {
                const isAllowed = members.length <= option.maxMembers;
                const hintId = `${nameId}-${option.binding.gameId}`;
                return (
                  <div key={option.binding.gameId} className={styles.section}>
                    <label className={styles.choice}>
                      <input
                        type="radio"
                        name="binding"
                        checked={
                          binding.kind === 'game' && binding.gameId === option.binding.gameId
                        }
                        disabled={!isAllowed}
                        aria-describedby={isAllowed ? undefined : hintId}
                        onChange={() => {
                          chooseBinding(option.binding);
                        }}
                      />
                      {option.label}
                    </label>
                    {!isAllowed && (
                      <p id={hintId} className={styles.hint}>
                        {t('gruppen.bindungGesperrt', {
                          spiel: option.label,
                          max: option.maxMembers,
                          count: members.length,
                        })}
                      </p>
                    )}
                  </div>
                );
              })}
            </fieldset>
          </div>

          {members.length > 0 && (
            <fieldset className={styles.sectionWide}>
              <legend className={styles.legend}>{t('gruppen.farben')}</legend>
              <p className={styles.hint}>{t('gruppen.farbenHinweis')}</p>
              {members.map((person, index) => {
                const memberColors = colors[index];
                if (memberColors === undefined) {
                  return null;
                }
                return (
                  <div key={person.id} className={styles.member}>
                    <p className={styles.memberName}>{person.name}</p>
                    {scheme !== 'catan-only' && (
                      <ColorPicker
                        label={t('gruppen.farbeGruppe', { name: person.name })}
                        palette="group"
                        options={GROUP_COLOR_KEYS}
                        selected={memberColors.groupColor}
                        onSelect={(color) => {
                          setColors(setMemberColor(colors, index, 'group', color, scheme));
                        }}
                      />
                    )}
                    {memberColors.catanColor !== undefined && (
                      <ColorPicker
                        label={t(
                          scheme === 'catan-only'
                            ? 'gruppen.farbeCatanGruppe'
                            : 'gruppen.farbeCatan',
                          { name: person.name },
                        )}
                        palette="catan"
                        options={CATAN_COLOR_KEYS}
                        selected={memberColors.catanColor}
                        onSelect={(color) => {
                          setColors(setMemberColor(colors, index, 'catan', color, scheme));
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </fieldset>
          )}

          <div className={styles.sectionWide}>
            {hasSaveFailed && (
              <Notice tone="error">
                <p>{t('gruppen.fehlerSpeichern')}</p>
              </Notice>
            )}
            <button type="submit" disabled={!canSave}>
              {t('allgemein.speichern')}
            </button>
          </div>
        </div>
      </form>
      {groups !== undefined && (
        <section className={styles.section}>
          <h2>{t('gruppen.liste')}</h2>
          <NameList label={t('gruppen.liste')} items={groups} emptyText={t('gruppen.leer')} />
        </section>
      )}
    </Page>
  );
}

function schemeOf(memberCount: number, binding: GroupBinding): ColorScheme {
  return colorSchemeOf({
    memberCount,
    boundGame:
      binding.kind === 'global'
        ? null
        : { hasPlayerColors: gameCapabilities(binding.gameId).playerColors !== null },
    maxPlayersWithColors: GROUP_MAX_PLAYERS_WITH_COLORS,
  });
}

// FA-PG-10: a supported game dictates the most members; a custom game allows all sizes.
function isBindingAllowed(binding: GroupBinding, memberCount: number): boolean {
  if (binding.kind === 'global') {
    return true;
  }
  const game = findSupportedGame(binding.gameId);
  return game === undefined || memberCount <= game.playerCount.max;
}
