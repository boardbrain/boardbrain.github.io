import { Link, useParams } from 'react-router';
import { parseGroupId, type Group, type Person } from '@/core/model';
import { formatDate } from '@/i18n/format';
import { t } from '@/i18n/t';
import { useCustomGames, useGroup, useGroups, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { EditorDialog } from '@/ui/components/EditorDialog';
import { ChevronIcon, PenIcon } from '@/ui/components/Icons';
import { Page } from '@/ui/components/Page';
import { PillButton } from '@/ui/components/PillButton';
import { useGoBack } from '@/ui/components/useGoBack';
import { GroupEditor } from './GroupEditor';
import { bindingLongLabel } from './groupBinding';
import { GroupTable, type TableSeat } from './GroupTable';
import overview from './Overview.module.css';
import styles from './GroupView.module.css';

const CHEVRON_SIZE = 18;
const PILL_ICON_SIZE = 15;

function groupHref(id: string): string {
  return `/verwaltung/gruppen/${id}`;
}

function personHref(id: string): string {
  return `/verwaltung/personen/${id}`;
}

// The seats of the big table: initial and group colour, no Catan colour (only in the editor).
function seatsOf(group: Group, persons: readonly Person[]): TableSeat[] {
  return group.members.map((member) => {
    const name = persons.find((person) => person.id === member.personId)?.name ?? '';
    return {
      id: member.personId,
      label: t('gruppen.platz', { name, farbe: t(`farben.${member.groupColor}`) }),
      initial: name.charAt(0),
      groupColor: member.groupColor,
    };
  });
}

type GroupViewProps = {
  /** `#/verwaltung/gruppen/‹id›/bearbeiten`: the editor is open above the page (US-VW-02). */
  readonly isEditing?: boolean;
};

/**
 * Page of a table `#/verwaltung/gruppen/‹id›` (US-VW-05 AK-3, AK-4, design I1-E T7): the big
 * round table as in the editor with the seats as links, below the binding, the number of
 * persons and the date, and the members with their colours. Results and statistics follow as
 * tabs with I3. "Bearbeiten" opens the editor at its own address, so the Android back key closes
 * it (US-VW-02, design I1-F).
 */
export function GroupView({ isEditing = false }: GroupViewProps): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const { groupId = '' } = useParams();
  const parsed = parseGroupId(groupId);
  const group = useGroup(db, parsed.ok ? parsed.value : null);
  const persons = usePersons(db);
  const customGames = useCustomGames(db);
  const groups = useGroups(db);
  const closeEditor = useGoBack(groupHref(groupId));

  if (group === undefined || persons === undefined) {
    return null;
  }
  if (group === null) {
    return (
      <Page title={t('gruppen.titel')} backFallback="/verwaltung/gruppen">
        <p className={overview.hint}>{t('gruppen.nichtGefunden')}</p>
      </Page>
    );
  }

  const binding = bindingLongLabel(group, customGames ?? []);
  const count = group.members.length;
  return (
    <Page title={group.name} isWide backFallback="/verwaltung/gruppen">
      <div className={styles.layout}>
        <div className={styles.tableColumn}>
          <GroupTable
            seats={seatsOf(group, persons)}
            size="detail"
            seatHref={personHref}
            title={group.name}
            subtitle={binding}
          />
          <div className={[overview.facts, overview.centered].join(' ')}>
            <span className={overview.fact}>
              <span className={overview.factText}>{binding}</span>
            </span>
            <span className={overview.fact}>
              <b>{count}</b>
              <span className={overview.factLabel}>
                {t(count === 1 ? 'gruppen.person' : 'gruppen.personen')}
              </span>
            </span>
            <span className={overview.fact}>
              <span className={overview.factLabel}>
                {t('gruppen.angelegtAm', { datum: formatDate(group.createdAt) })}
              </span>
            </span>
          </div>
          <div className={[overview.facts, overview.centered].join(' ')}>
            <PillButton
              to={`${groupHref(group.id)}/bearbeiten`}
              icon={<PenIcon size={PILL_ICON_SIZE} />}
            >
              {t('gruppen.bearbeiten')}
            </PillButton>
          </div>
        </div>
        <section className={overview.section}>
          <h2 className={overview.sectionTitle}>{t('gruppen.amTisch', { anzahl: count })}</h2>
          <ul className={overview.rows} aria-label={t('gruppen.mitglieder')}>
            {group.members.map((member) => {
              const name = persons.find((person) => person.id === member.personId)?.name ?? '';
              return (
                <li key={member.personId}>
                  {/* US-VW-05 AK-4: a member opens the person's page. */}
                  <Link to={personHref(member.personId)} className={overview.row}>
                    <span
                      className={styles.seat}
                      style={{ background: `var(--color-group-${member.groupColor})` }}
                      aria-hidden="true"
                    >
                      {name.charAt(0)}
                    </span>
                    <span className={overview.rowText}>
                      <strong className={overview.rowTitle}>{name}</strong>
                      <span className={overview.rowNote}>{t(`farben.${member.groupColor}`)}</span>
                    </span>
                    <span className={overview.chevron}>
                      <ChevronIcon size={CHEVRON_SIZE} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
      {isEditing && (
        <EditorDialog title={t('gruppen.bearbeitenTitel')} onClose={closeEditor}>
          <GroupEditor
            group={group}
            persons={persons}
            takenNames={(groups ?? [])
              .filter((other) => other.id !== group.id)
              .map((other) => other.name)}
            customGames={customGames ?? []}
            onSaved={closeEditor}
          />
        </EditorDialog>
      )}
    </Page>
  );
}
