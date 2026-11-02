import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import type { PersonId } from '@/core/model';
import {
  CATAN_PERSON_DRAWS,
  CATAN_STARTING_RESOURCES_COUNT,
  type CatanEdition,
} from '@/games/catan';
import { t } from '@/i18n/t';
import { useGroup, usePersons } from '@/infra/db/readHooks';
import { OrderOptionIcon, ResourcesOptionIcon } from '@/ui/art/OptionIcons';
import { useAppDependencies } from '@/ui/AppDependencies';
import { PieceMark } from '@/ui/board/PieceMark';
import { BackButton } from '@/ui/components/BackButton';
import { ChevronIcon, InfoIcon } from '@/ui/components/Icons';
import { MiniTable } from '@/ui/components/MiniTable';
import { PressableButton } from '@/ui/components/Pressable';
import { DrawSymbol } from './DrawSymbol';
import { MatchDialog } from './MatchDialog';
import { DRAW_NAMES } from './matchTexts';
import { isOrderComplete, tapForOrder, type MatchPreparation } from './preparation';
import { useChosenPreparation } from './PreparationLayout';
import { WizardDots } from './WizardDots';
import shared from './Match.module.css';
import styles from './OptionsView.module.css';
import { cx } from '@/ui/components/classNames';

/**
 * Options `#/partie/neu/optionen` (US-SP-04, US-AB-01 AK-3, AK-4, FA-LS-07, design I2-C page 3,
 * O1, E2, R1): edition, mode, draws, order and starting resources. "Weiter zu den Farben" sits
 * after all settings, so one scrolls through them once.
 */
export function OptionsView(): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const { preparation, setPreparation, redirect } = useChosenPreparation();
  const group = useGroup(db, preparation?.base.groupId ?? null);
  const persons = usePersons(db);
  const navigate = useNavigate();
  const [isShowingRules, setShowingRules] = useState(false);
  if (redirect !== null || preparation === null) {
    return redirect;
  }
  if (group === undefined || group === null || persons === undefined) {
    return null;
  }
  const nameOf = (personId: PersonId): string =>
    persons.find((person) => person.id === personId)?.name ?? '';
  const change = (changes: Partial<MatchPreparation>): void => {
    setPreparation({ ...preparation, ...changes });
  };

  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton fallback="/partie/neu/tisch" />
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('partie.optionenTitel')}</h1>
          <div className={shared.sub}>
            {t('partie.schritt', { spiel: t('spiele.namen.catan'), nummer: 2 })}
          </div>
        </div>
      </div>
      <WizardDots done={2} />
      <div className={shared.chosenTable}>
        <MiniTable
          seats={group.members.map(({ personId, groupColor }) => ({ personId, groupColor }))}
          diameter={40}
          hasSeatRims
        />
        <span className={shared.chosenText}>
          <strong>{group.name}</strong>
          <span className={shared.chosenNames}>
            {group.members.map((member) => nameOf(member.personId)).join(', ')}
          </span>
        </span>
      </div>

      <section className={shared.section}>
        <h2 className={shared.sectionTitle}>{t('partie.spielversion')}</h2>
        <div className={styles.edCards}>
          <EditionCard
            edition="base"
            selected={preparation.edition}
            onSelect={(edition) => {
              change({ edition });
            }}
          />
          <EditionCard
            edition="cities-and-knights"
            selected={preparation.edition}
            onSelect={(edition) => {
              change({ edition });
            }}
          />
        </div>
        <div className={cx(styles.modeLine, shared.small)}>
          <span className={shared.muted}>{t('partie.modus')}</span>
          <span>{t('partie.standard')}</span>
          <PressableButton
            type="button"
            className={styles.infoBtn}
            aria-label={t('partie.modusInfo')}
            onClick={() => {
              setShowingRules(true);
            }}
          >
            <InfoIcon size={18} />
          </PressableButton>
        </div>
      </section>

      <section className={shared.section}>
        <h2 className={shared.sectionTitle}>{t('partie.losenWer')}</h2>
        <div className={shared.group}>
          {CATAN_PERSON_DRAWS.map((draw) => (
            <SwitchRow
              key={draw}
              icon={<DrawSymbol draw={draw} />}
              label={t(DRAW_NAMES[draw])}
              isOn={preparation.personDraws[draw]}
              onToggle={() => {
                change({
                  personDraws: {
                    ...preparation.personDraws,
                    [draw]: !preparation.personDraws[draw],
                  },
                });
              }}
            />
          ))}
          <SwitchRow
            icon={<OrderOptionIcon />}
            label={t('partie.reihenfolgeLosen')}
            isOn={preparation.isOrderDrawn}
            onToggle={() => {
              change({ isOrderDrawn: !preparation.isOrderDrawn });
            }}
          />
          {!preparation.isOrderDrawn && (
            <div className={styles.optColumn}>
              <Segmented
                options={[
                  ['manual', t('partie.selbstFestlegen')],
                  ['none', t('partie.ohnePlatzierung')],
                ]}
                selected={preparation.orderAlternative}
                onSelect={(orderAlternative) => {
                  change({ orderAlternative });
                }}
              />
              {preparation.orderAlternative === 'manual' ? (
                <ManualOrder
                  preparation={preparation}
                  nameOf={nameOf}
                  groupColorOf={(personId) =>
                    group.members.find((member) => member.personId === personId)?.groupColor ??
                    'gray'
                  }
                  onTap={(personId) => {
                    setPreparation(tapForOrder(preparation, personId));
                  }}
                />
              ) : (
                <small className={shared.muted}>{t('partie.keineGebaeude')}</small>
              )}
            </div>
          )}
        </div>
      </section>

      <section className={shared.section}>
        <h2 className={shared.sectionTitle}>{t('partie.startrohstoffe')}</h2>
        <div className={shared.group}>
          <SwitchRow
            icon={<ResourcesOptionIcon />}
            label={t('partie.rohstoffeZiehen')}
            isOn={preparation.hasStartingResources}
            onToggle={() => {
              change({ hasStartingResources: !preparation.hasStartingResources });
            }}
          />
          {preparation.hasStartingResources && (
            <>
              <div className={styles.optRow}>
                <span className={styles.txt}>{t('partie.anzahlJePerson')}</span>
                <span className={styles.stepper}>
                  <PressableButton
                    type="button"
                    aria-label={t('partie.weniger')}
                    disabled={preparation.resourceCount <= CATAN_STARTING_RESOURCES_COUNT.min}
                    onClick={() => {
                      change({ resourceCount: preparation.resourceCount - 1 });
                    }}
                  >
                    {t('partie.zeichenMinus')}
                  </PressableButton>
                  <output>{preparation.resourceCount}</output>
                  <PressableButton
                    type="button"
                    aria-label={t('partie.mehr')}
                    disabled={preparation.resourceCount >= CATAN_STARTING_RESOURCES_COUNT.max}
                    onClick={() => {
                      change({ resourceCount: preparation.resourceCount + 1 });
                    }}
                  >
                    {t('partie.zeichenPlus')}
                  </PressableButton>
                </span>
              </div>
              <div className={styles.optColumn}>
                <Segmented
                  options={[
                    ['with', t('partie.mitZuruecklegen')],
                    ['without', t('partie.ohneZuruecklegen')],
                  ]}
                  selected={preparation.replacement}
                  onSelect={(replacement) => {
                    change({ replacement });
                  }}
                />
                <small className={shared.muted}>
                  {preparation.replacement === 'with'
                    ? t('partie.mitZuruecklegenText')
                    : t('partie.ohneZuruecklegenText')}
                </small>
              </div>
            </>
          )}
        </div>
      </section>

      <div className={shared.footer}>
        <PressableButton
          type="button"
          className={shared.primary}
          disabled={!isOrderComplete(preparation)}
          onClick={() => void navigate('/partie/neu/farben')}
        >
          {t('partie.weiterZuDenFarben')}
          <ChevronIcon size={18} />
        </PressableButton>
      </div>

      {isShowingRules && (
        <MatchDialog
          title={t('partie.modusTitel')}
          cancelLabel={t('partie.schliessen')}
          onCancel={() => {
            setShowingRules(false);
          }}
        >
          <ul className={styles.ruleList}>
            <li>{t('partie.regelInland')}</li>
            <li>{t('partie.regelStrasse')}</li>
            <li>{t('partie.regelGleich')}</li>
          </ul>
        </MatchDialog>
      )}
    </main>
  );
}

type EditionCardProps = {
  readonly edition: CatanEdition;
  readonly selected: CatanEdition;
  readonly onSelect: (edition: CatanEdition) => void;
};

// E2: compact card with the name and the buildings of each person (US-SP-04 AK-1).
function EditionCard({ edition, selected, onSelect }: EditionCardProps): React.JSX.Element {
  const isBase = edition === 'base';
  return (
    <PressableButton
      type="button"
      look="card"
      className={styles.edCard}
      aria-pressed={edition === selected}
      onClick={() => {
        onSelect(edition);
      }}
    >
      <strong>{isBase ? t('partie.basisspiel') : t('partie.staedteUndRitter')}</strong>
      <span className={styles.edSub}>
        <span className={styles.edPieces}>
          <PieceMark kind="settlement" color="sand" size={15} />
          <PieceMark kind={isBase ? 'settlement' : 'city'} color="sand" size={15} />
        </span>
        {isBase ? t('partie.zweiSiedlungen') : t('partie.siedlungUndStadt')}
      </span>
    </PressableButton>
  );
}

type SwitchRowProps = {
  readonly icon: ReactNode;
  readonly label: string;
  readonly isOn: boolean;
  readonly onToggle: () => void;
};

// O1: a row with symbol and switch, as the switch in the table editor.
function SwitchRow({ icon, label, isOn, onToggle }: SwitchRowProps): React.JSX.Element {
  return (
    <PressableButton
      type="button"
      role="switch"
      aria-checked={isOn}
      className={styles.optRow}
      onClick={onToggle}
    >
      <span className={styles.optIcon}>{icon}</span>
      <span className={styles.txt}>{label}</span>
      <span className={styles.switch} />
    </PressableButton>
  );
}

type SegmentedProps<K extends string> = {
  readonly options: readonly (readonly [K, string])[];
  readonly selected: K;
  readonly onSelect: (key: K) => void;
};

// Choice between two settings inside a row.
function Segmented<K extends string>({
  options,
  selected,
  onSelect,
}: SegmentedProps<K>): React.JSX.Element {
  return (
    <div className={styles.seg}>
      {options.map(([key, label]) => (
        <PressableButton
          key={key}
          type="button"
          aria-pressed={key === selected}
          onClick={() => {
            onSelect(key);
          }}
        >
          {label}
        </PressableButton>
      ))}
    </div>
  );
}

type ManualOrderProps = {
  readonly preparation: MatchPreparation;
  readonly nameOf: (personId: PersonId) => string;
  readonly groupColorOf: (personId: PersonId) => string;
  readonly onTap: (personId: PersonId) => void;
};

// R1: tap the persons one after the other; the last place follows from the others.
function ManualOrder({
  preparation,
  nameOf,
  groupColorOf,
  onTap,
}: ManualOrderProps): React.JSX.Element {
  const { manualOrder, base } = preparation;
  const isDone = manualOrder.length === base.participants.length;
  return (
    <div className={styles.orderPick}>
      <div className={styles.orderChips}>
        {base.participants.map((personId) => {
          const place = manualOrder.indexOf(personId);
          return (
            <PressableButton
              key={personId}
              type="button"
              className={styles.orderChip}
              aria-pressed={place >= 0}
              onClick={() => {
                onTap(personId);
              }}
            >
              <span className={place >= 0 ? styles.orderNum : styles.orderNumEmpty}>
                {place >= 0 ? place + 1 : null}
              </span>
              <span
                className={styles.dot}
                style={{ background: `var(--color-group-${groupColorOf(personId)})` }}
              />
              {nameOf(personId)}
            </PressableButton>
          );
        })}
      </div>
      <small className={shared.muted}>
        {isDone
          ? t('partie.reiheZuruecknehmen')
          : t('partie.reiheAntippen', { platz: manualOrder.length + 1 })}
      </small>
    </div>
  );
}
