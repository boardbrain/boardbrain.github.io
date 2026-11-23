import { useId } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { parseGroupId, parseMatchId, type Group, type MatchId, type Person } from '@/core/model';
import { formatDate } from '@/i18n/format';
import { t } from '@/i18n/t';
import { useCustomGames, useGroup, useGroups, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { EditorDialog } from '@/ui/components/EditorDialog';
import { ChartIcon, ChevronIcon, PenIcon, PlusIcon } from '@/ui/components/Icons';
import { Page } from '@/ui/components/Page';
import { PillButton } from '@/ui/components/PillButton';
import { TabPanel, Tabs, type TabItem } from '@/ui/components/Tabs';
import { cx } from '@/ui/components/classNames';
import { useGoBack } from '@/ui/components/useGoBack';
import { GroupResults } from './GroupResults';
import { GroupEditor } from './GroupEditor';
import { bindingLongLabel } from './groupBinding';
import { GroupTable, type TableSeat } from './GroupTable';
import overview from './Overview.module.css';
import styles from './GroupView.module.css';
import { PressableLink } from '@/ui/components/Pressable';

const CHEVRON_SIZE = 18;
const PILL_ICON_SIZE = 15;
const PLUS_SIZE = 22;
const SOON_ICON_SIZE = 30;

type TableTab = 'am-tisch' | 'ergebnisse' | 'statistik';

const TABLE_TABS: readonly TabItem<TableTab>[] = [
  { key: 'am-tisch', label: t('ergebnisse.amTisch') },
  { key: 'ergebnisse', label: t('ergebnisse.ergebnisse') },
  { key: 'statistik', label: t('ergebnisse.statistik') },
];

// The tab from the address `?reiter=`; anything else is "Am Tisch".
function tabOf(value: string | null): TableTab {
  return value === 'ergebnisse' || value === 'statistik' ? value : 'am-tisch';
}

// The result just stored, passed along by the form (design I3-C HL1); anything else is ignored.
function highlightOf(state: unknown): MatchId | null {
  if (typeof state !== 'object' || state === null || !('highlight' in state)) {
    return null;
  }
  const { highlight } = state;
  if (typeof highlight !== 'string') {
    return null;
  }
  const parsed = parseMatchId(highlight);
  return parsed.ok ? parsed.value : null;
}

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
 * Page of a table `#/verwaltung/gruppen/‹id›` (US-VW-05 AK-3, AK-4, design I1-E T7, I3-C RT2):
 * tabs "Am Tisch | Ergebnisse | Statistik" right below the head. "Am Tisch" shows the big round
 * table with the seats as links, the binding, the number of persons and the date, and the
 * members with their colours; "Ergebnisse" the results (US-ER-04); "Statistik" a placeholder
 * until I3-D. "Bearbeiten" opens the editor at its own address, so the Android back key closes
 * it (US-VW-02, design I1-F); the plus in the head enters a result (US-ER-01 AK-1).
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
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const tabsId = useId();
  const tab = tabOf(searchParams.get('reiter'));
  const highlight = highlightOf(location.state);

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
  const selectTab = (key: TableTab): void => {
    // The tab is part of the address, so the back key from a result returns to it; switching
    // tabs adds no entry to the history.
    setSearchParams(key === 'am-tisch' ? {} : { reiter: key }, { replace: true });
  };
  return (
    <Page
      title={group.name}
      backFallback="/verwaltung/gruppen"
      actions={
        // SW4: "Ergebnis eintragen" as a round plus in the head, in every tab (US-ER-01 AK-1).
        !group.archived && (
          <PressableLink
            to={`${groupHref(group.id)}/ergebnis`}
            className={styles.plus}
            aria-label={t('ergebnisse.eintragen')}
          >
            <PlusIcon size={PLUS_SIZE} />
          </PressableLink>
        )
      }
    >
      <div className={styles.layout}>
        {/* RT2: the big table belongs to "Am Tisch"; from 1000 px it stays on the left. */}
        <div className={cx(styles.tableColumn, tab !== 'am-tisch' && styles.onlyWide)}>
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
        <Tabs
          label={t('ergebnisse.reiter', { name: group.name })}
          idPrefix={tabsId}
          tabs={TABLE_TABS}
          selected={tab}
          onSelect={selectTab}
          className={styles.tabs}
        />
        <TabPanel idPrefix={tabsId} tabKey={tab} className={styles.panel}>
          {tab === 'am-tisch' && (
            <ul className={overview.rows} aria-label={t('gruppen.mitglieder')}>
              {group.members.map((member) => {
                const name = persons.find((person) => person.id === member.personId)?.name ?? '';
                return (
                  <li key={member.personId}>
                    {/* US-VW-05 AK-4: a member opens the person's page. */}
                    <PressableLink to={personHref(member.personId)} className={overview.row}>
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
                    </PressableLink>
                  </li>
                );
              })}
            </ul>
          )}
          {tab === 'ergebnisse' && (
            <GroupResults
              group={group}
              persons={persons}
              customGames={customGames ?? []}
              highlight={highlight}
              onHighlighted={() => {
                // The light-up shows once; back from a result it does not repeat.
                void navigate({ search: location.search }, { replace: true, state: null });
              }}
            />
          )}
          {tab === 'statistik' && (
            // The statistics follow with I3-D; until then a placeholder (design I3-C).
            <div className={styles.soon}>
              <ChartIcon size={SOON_ICON_SIZE} />
              <strong>{t('ergebnisse.statistik')}</strong>
              <span className={overview.factLabel}>{t('ergebnisse.statistikBald')}</span>
            </div>
          )}
        </TabPanel>
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
