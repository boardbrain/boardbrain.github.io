import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Group, Person, PersonId } from '@/core/model';
import { CATAN_GAME_ID, canPlayCatan } from '@/games/catan';
import { t } from '@/i18n/t';
import { useGroups, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { BackButton } from '@/ui/components/BackButton';
import { MiniTable } from '@/ui/components/MiniTable';
import { PressableButton, PressableLink } from '@/ui/components/Pressable';
import { useLongPress } from '@/ui/components/useLongPress';
import { MatchDialog } from './MatchDialog';
import { preparationFor } from './preparation';
import { usePreparationContext } from './PreparationLayout';
import { WizardDots } from './WizardDots';
import shared from './Match.module.css';
import styles from './TableChoiceView.module.css';
import { cx } from '@/ui/components/classNames';

const FULL_CIRCLE_DEGREES = 360;
const DETAIL_SEAT_RADIUS = 41;
// From this many seats they get smaller so they still fit around the table.
const DENSE_FROM = 7;
// Catan colours appear in the details only where Catan is possible.
const CATAN_MAX_SEATS = 4;

function namesOf(group: Group, persons: ReadonlyMap<PersonId, Person>): string[] {
  return group.members.map((member) => persons.get(member.personId)?.name ?? '');
}

function isCatanOnly(group: Group): boolean {
  return group.binding.kind === 'game' && group.binding.gameId === CATAN_GAME_ID;
}

/**
 * Table choice `#/partie/neu/tisch` (US-AB-01 AK-1, AK-2, design I2-C page 2, T2): only active
 * tables that can play Catan. A tap leads on to the options, holding shows the details.
 */
export function TableChoiceView(): React.JSX.Element | null {
  const { db, session } = useAppDependencies();
  const groups = useGroups(db);
  const persons = usePersons(db);
  const { preparation, setPreparation } = usePreparationContext();
  const navigate = useNavigate();
  const [details, setDetails] = useState<Group | null>(null);
  if (groups === undefined || persons === undefined) {
    return null;
  }
  const byId = new Map(persons.map((person) => [person.id, person]));
  const tables = groups.filter(canPlayCatan);

  const choose = async (group: Group): Promise<void> => {
    setDetails(null);
    if (preparation?.base.groupId !== group.id) {
      const prepared = await session.prepare(group.id);
      if (!prepared.ok) {
        return;
      }
      setPreparation(preparationFor(prepared.value, preparation));
    }
    await navigate('/partie/neu/optionen');
  };

  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton fallback="/partie/neu" />
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('partie.tischTitel')}</h1>
          <div className={shared.sub}>
            {t('partie.schritt', { spiel: t('spiele.namen.catan'), nummer: 1 })}
          </div>
        </div>
      </div>
      <WizardDots done={1} />
      {tables.length === 0 ? (
        <div className={cx(shared.card, styles.emptyTables)}>
          <strong>{t('partie.keinTischTitel')}</strong>
          <span className={cx(shared.small, shared.muted)}>{t('partie.keinTischText')}</span>
          <PressableLink to="/verwaltung/gruppen" className={shared.secondary}>
            {t('partie.tischeVerwalten')}
          </PressableLink>
        </div>
      ) : (
        <>
          <div className={styles.roomGrid}>
            {tables.map((group) => (
              <TableCard
                key={group.id}
                group={group}
                names={namesOf(group, byId)}
                isSelected={preparation?.base.groupId === group.id}
                onChoose={() => void choose(group)}
                onHold={() => {
                  setDetails(group);
                }}
              />
            ))}
          </div>
          <p className={shared.hint}>{t('partie.tischHinweis')}</p>
        </>
      )}
      {details !== null && (
        <MatchDialog
          cancelLabel={t('partie.schliessen')}
          confirmLabel={t('partie.tischWaehlen')}
          onCancel={() => {
            setDetails(null);
          }}
          onConfirm={() => void choose(details)}
        >
          <TableDetails group={details} persons={byId} />
        </MatchDialog>
      )}
    </main>
  );
}

type TableCardProps = {
  readonly group: Group;
  readonly names: readonly string[];
  readonly isSelected: boolean;
  readonly onChoose: () => void;
  readonly onHold: () => void;
};

// One table of the room with fixed rows: table, name and names, number of persons (T2).
function TableCard({
  group,
  names,
  isSelected,
  onChoose,
  onHold,
}: TableCardProps): React.JSX.Element {
  const press = useLongPress(onHold, onChoose);
  return (
    <PressableButton
      type="button"
      look="card"
      className={styles.roomCard}
      aria-pressed={isSelected}
      aria-label={t('partie.tischBeschriftung', { tisch: group.name, namen: names.join(', ') })}
      {...press}
    >
      {isCatanOnly(group) && (
        <span className={styles.boundTag}>
          {t('partie.nurSpiel', { spiel: t('spiele.namen.catan') })}
        </span>
      )}
      <span className={styles.mini}>
        <MiniTable
          seats={group.members.map(({ personId, groupColor }) => ({ personId, groupColor }))}
          diameter={96}
          hasSeatRims
        />
      </span>
      <span className={styles.cardText}>
        <strong className={styles.tableName}>{group.name}</strong>
        <span className={styles.names}>{names.join(', ')}</span>
      </span>
      <span className={styles.count}>
        {t('partie.personenAnzahl', { anzahl: group.members.length })}
      </span>
    </PressableButton>
  );
}

type TableDetailsProps = {
  readonly group: Group;
  readonly persons: ReadonlyMap<PersonId, Person>;
};

// Details after holding a table: the large table with initials, full name, binding, everyone.
function TableDetails({ group, persons }: TableDetailsProps): React.JSX.Element {
  const count = group.members.length;
  const binding = isCatanOnly(group)
    ? t('partie.nurSpiel', { spiel: t('spiele.namen.catan') })
    : t('partie.alleSpiele');
  return (
    <>
      <div className={styles.detailHead}>
        <span className={styles.seatTable} aria-hidden="true">
          <span className={styles.seatTableTop} />
          {group.members.map((member, index) => {
            const radians = (((index / count) * FULL_CIRCLE_DEGREES - 90) * Math.PI) / 180;
            const name = persons.get(member.personId)?.name ?? '';
            return (
              <span
                key={member.personId}
                className={count >= DENSE_FROM ? styles.denseSeat : styles.seat}
                style={{
                  left: `${String(50 + DETAIL_SEAT_RADIUS * Math.cos(radians))}%`,
                  top: `${String(50 + DETAIL_SEAT_RADIUS * Math.sin(radians))}%`,
                  background: `var(--color-group-${member.groupColor})`,
                }}
              >
                {name.slice(0, 1)}
                {count <= CATAN_MAX_SEATS && member.catanColor !== undefined && (
                  <span
                    className={styles.catanMark}
                    style={{ background: `var(--color-catan-${member.catanColor})` }}
                  />
                )}
              </span>
            );
          })}
        </span>
        <h2 className={styles.detailTitle}>{group.name}</h2>
        <span className={cx(shared.small, shared.muted)}>
          {t('partie.tischDetails', { anzahl: count, bindung: binding })}
        </span>
      </div>
      <ul className={styles.detailPeople}>
        {group.members.map((member) => (
          <li key={member.personId} className={styles.detailPerson}>
            <span
              className={styles.dot}
              style={{ background: `var(--color-group-${member.groupColor})` }}
            />
            {persons.get(member.personId)?.name}
          </li>
        ))}
      </ul>
    </>
  );
}
