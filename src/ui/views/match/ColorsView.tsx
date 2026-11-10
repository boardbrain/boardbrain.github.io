import { useNavigate } from 'react-router';
import { CATAN_COLOR_KEYS, type PersonId } from '@/core/model';
import { t } from '@/i18n/t';
import { useGroup, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { BackButton } from '@/ui/components/BackButton';
import { AgainIcon, PlayIcon } from '@/ui/components/Icons';
import { MiniTable } from '@/ui/components/MiniTable';
import { PressableButton } from '@/ui/components/Pressable';
import { recapLine } from './matchTexts';
import { chooseColor, isColorChanged, startInputOf } from './preparation';
import { useChosenPreparation } from './PreparationLayout';
import { WizardDots } from './WizardDots';
import shared from './Match.module.css';
import { cx } from '@/ui/components/classNames';
import styles from './ColorsView.module.css';

/**
 * Colours `#/partie/neu/farben` (US-PG-04, US-PL-04 AK-1, design I2-C page 4, C1): the Catan
 * colours of this match, a taken colour swaps; "Generierung starten" stores the match and its
 * first step before it is shown (ADR-014).
 */
export function ColorsView(): React.JSX.Element | null {
  const { db, session } = useAppDependencies();
  const { preparation, setPreparation, redirect } = useChosenPreparation();
  const group = useGroup(db, preparation?.base.groupId ?? null);
  const persons = usePersons(db);
  const navigate = useNavigate();
  if (redirect !== null || preparation === null) {
    return redirect;
  }
  if (group === undefined || group === null || persons === undefined) {
    return null;
  }
  const nameOf = (personId: PersonId): string =>
    persons.find((person) => person.id === personId)?.name ?? '';
  const holderOf = new Map(preparation.colors.map((color) => [color.catanColor, color.personId]));
  const isChanged = preparation.colors.some((color) => isColorChanged(preparation, color.personId));

  const start = async (): Promise<void> => {
    const started = await session.start(startInputOf(preparation));
    if (!started.ok) {
      // Another match runs meanwhile: the layout leads to it.
      return;
    }
    await navigate(
      started.value.generation.state === 'running' ? '/partie/uebersicht' : '/partie',
      { replace: true },
    );
  };

  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton fallback="/partie/neu/optionen" />
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('partie.farbenTitel')}</h1>
          <div className={shared.sub}>
            {t('partie.schritt', { spiel: t('spiele.namen.catan'), nummer: 3 })}
          </div>
        </div>
      </div>
      <WizardDots done={3} />
      <div className={shared.chosenTable}>
        <MiniTable
          seats={group.members.map(({ personId, groupColor }) => ({ personId, groupColor }))}
          diameter={40}
          hasSeatRims
        />
        <span className={shared.chosenText}>
          <strong>{group.name}</strong>
          <span className={shared.recapLine}>{recapLine(preparation)}</span>
        </span>
      </div>
      <section className={shared.section}>
        <h2 className={cx(shared.sectionTitle, styles.titleWithPill)}>
          <span>{t('partie.farbenDerPartie')}</span>
          {isChanged && (
            <PressableButton
              type="button"
              className={shared.pill}
              onClick={() => {
                setPreparation({ ...preparation, colors: preparation.base.colors });
              }}
            >
              <AgainIcon size={14} />
              {t('partie.wieAmTisch')}
            </PressableButton>
          )}
        </h2>
        <div className={shared.group}>
          {preparation.colors.map(({ personId, catanColor }) => (
            <div key={personId} className={styles.colorRow}>
              <span className={styles.who}>
                <strong>{nameOf(personId)}</strong>
                {isColorChanged(preparation, personId) && (
                  <span className={styles.changed}>{t('partie.einmalig')}</span>
                )}
              </span>
              <span
                className={styles.swatches}
                role="group"
                aria-label={t('partie.farbeVon', { name: nameOf(personId) })}
              >
                {CATAN_COLOR_KEYS.map((color) => {
                  const holder = holderOf.get(color);
                  return (
                    <PressableButton
                      key={color}
                      type="button"
                      className={styles.swatch}
                      style={{ background: `var(--color-catan-${color})` }}
                      aria-pressed={color === catanColor}
                      aria-label={t(`farben.${color}`)}
                      onClick={() => {
                        setPreparation(chooseColor(preparation, personId, color));
                      }}
                    >
                      {color !== catanColor && holder !== undefined && (
                        <span className={styles.initial}>{nameOf(holder).slice(0, 1)}</span>
                      )}
                    </PressableButton>
                  );
                })}
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className={shared.footer}>
        <PressableButton type="button" className={shared.primary} onClick={() => void start()}>
          <PlayIcon size={18} />
          {t('partie.generierungStarten')}
        </PressableButton>
      </div>
    </main>
  );
}
