import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  cleanName,
  countFellowPlayers,
  findNameConflicts,
  isSameName,
  parsePersonId,
  tablesOfPerson,
  type CustomGame,
  type Group,
  type Person,
  type PersonTable,
} from '@/core/model';
import { formatDate, formatQuotedList } from '@/i18n/format';
import { t } from '@/i18n/t';
import { useCustomGames, useGroups, usePerson, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { ChevronIcon, PenIcon } from '@/ui/components/Icons';
import { MiniTable } from '@/ui/components/MiniTable';
import { Page } from '@/ui/components/Page';
import { PillButton } from '@/ui/components/PillButton';
import { bindingLabel } from './groupBinding';
import overview from './Overview.module.css';
import styles from './Profile.module.css';
import { useRenameForm } from './RenameForm';

// From this many tables the list is collapsed to the first ones (design I1-E, D9).
const COLLAPSE_FROM = 7;
const VISIBLE_WHEN_COLLAPSED = 6;
const ROW_TABLE_DIAMETER = 44;
const CHEVRON_SIZE = 18;
const PILL_ICON_SIZE = 15;

type TableRowsProps = {
  readonly person: Person;
  readonly tables: readonly PersonTable[];
  readonly customGames: readonly CustomGame[];
};

function TableRows({ person, tables, customGames }: TableRowsProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  if (tables.length === 0) {
    return <p className={overview.hint}>{t('personen.sitztNirgends', { name: person.name })}</p>;
  }
  const isCollapsible = tables.length >= COLLAPSE_FROM;
  const visible = isCollapsible && !isExpanded ? tables.slice(0, VISIBLE_WHEN_COLLAPSED) : tables;
  return (
    <>
      <ul className={overview.rows} aria-label={t('personen.tische')}>
        {visible.map(({ group, member }) => (
          <li key={group.id}>
            {/* US-VW-05 AK-3: a table of the person opens the table page. */}
            <Link to={`/verwaltung/gruppen/${group.id}`} className={overview.row}>
              <MiniTable
                seats={group.members}
                diameter={ROW_TABLE_DIAMETER}
                highlightId={person.id}
              />
              <span className={overview.rowText}>
                <strong className={overview.rowTitle}>{group.name}</strong>
                <span className={overview.rowNote}>
                  {t('personen.tischZeile', {
                    bindung: bindingLabel(group, customGames),
                    farbe: t(`farben.${member.groupColor}`),
                  })}
                </span>
              </span>
              <span className={overview.chevron}>
                <ChevronIcon size={CHEVRON_SIZE} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {isCollapsible && (
        <button
          type="button"
          className={overview.more}
          aria-expanded={isExpanded}
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded
            ? t('personen.wenigerTische')
            : t('personen.alleTische', { anzahl: tables.length })}
        </button>
      )}
    </>
  );
}

type PersonRenameProps = {
  readonly person: Person;
  readonly persons: readonly Person[];
  readonly groups: readonly Group[];
  readonly card: React.JSX.Element;
  readonly actions: React.JSX.Element;
  readonly onClose: () => void;
};

// US-VW-06: the card stays, the field takes the place of the profile; messages below.
function PersonRename({
  person,
  persons,
  groups,
  card,
  actions,
  onClose,
}: PersonRenameProps): React.JSX.Element {
  const { masterData } = useAppDependencies();
  // AK-2: checked while typing, so the tables are named before saving.
  function conflictText(name: string): string | null {
    const conflicts = findNameConflicts(groups, persons, person.id, name);
    if (conflicts.length === 0) {
      return null;
    }
    return t(conflicts.length === 1 ? 'personen.konfliktEiner' : 'personen.konfliktMehrere', {
      tische: formatQuotedList(conflicts.map((group) => group.name)),
      name: cleanName(name),
    });
  }
  const { form, notices } = useRenameForm({
    initialName: person.name,
    fieldLabel: t('personen.neuerName'),
    liveError: conflictText,
    // US-PG-01 AK-3: another person with the name elsewhere is only a hint.
    liveHint: (name) =>
      persons.some((other) => other.id !== person.id && isSameName(other.name, name))
        ? {
            text: t('personen.gleicherNameUmbenennen', { name: cleanName(name) }),
            note: t('personen.gleicherNameGruppe'),
          }
        : null,
    save: (name, isConfirmed) =>
      masterData.renamePerson({ personId: person.id, name, isDuplicateConfirmed: isConfirmed }),
    // Only if someone changed the data in the meantime; the live checks show it right after.
    messageFor: (error, name) => {
      if (error === 'name-duplicate') {
        return t('personen.gleicherNameUmbenennen', { name });
      }
      if (error === 'name-empty') {
        return t('verwaltung.nameLeer');
      }
      return t('personen.konfliktAllgemein', { name });
    },
    onClose,
  });
  return (
    <>
      <div className={styles.profile}>
        {card}
        <div className={styles.facts}>{form}</div>
      </div>
      {actions}
      {notices}
    </>
  );
}

/**
 * Page of a person `#/verwaltung/personen/‹id›` (US-VW-05 AK-2, design I1-E D9): a small
 * playing card and the profile with the number of tables and fellow players, below the person's
 * tables with the colour at each of them. Catan colours are not shown here, only in the editor.
 */
export function PersonView(): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const { personId = '' } = useParams();
  const parsed = parsePersonId(personId);
  const person = usePerson(db, parsed.ok ? parsed.value : null);
  const groups = useGroups(db);
  const persons = usePersons(db);
  const customGames = useCustomGames(db);
  const [isRenaming, setIsRenaming] = useState(false);

  if (person === undefined || groups === undefined || persons === undefined) {
    return null;
  }
  if (person === null) {
    return (
      <Page title={t('personen.titel')} backFallback="/verwaltung/personen">
        <p className={overview.hint}>{t('personen.nichtGefunden')}</p>
      </Page>
    );
  }

  const tables = tablesOfPerson(groups, person.id);
  const fellows = countFellowPlayers(groups, person.id);
  const card = (
    <div className={styles.card} aria-hidden="true">
      <span className={styles.corner}>{tables.length}</span>
      <span className={styles.initial}>{person.name.charAt(0)}</span>
      <strong className={styles.cardName}>{person.name}</strong>
      <span className={styles.cornerBottom}>{tables.length}</span>
    </div>
  );
  const actions = (
    <div className={styles.actions}>
      <PillButton
        icon={<PenIcon size={PILL_ICON_SIZE} />}
        onClick={() => {
          setIsRenaming(true);
        }}
      >
        {t('personen.umbenennen')}
      </PillButton>
    </div>
  );
  return (
    <Page title={person.name} backFallback="/verwaltung/personen">
      {isRenaming ? (
        <PersonRename
          person={person}
          persons={persons}
          groups={groups}
          card={card}
          actions={actions}
          onClose={() => {
            setIsRenaming(false);
          }}
        />
      ) : (
        <>
          <div className={styles.profile}>
            {card}
            <div className={styles.facts}>
              <strong className={styles.name}>{person.name}</strong>
              <span className={styles.since}>
                {t('personen.dabeiSeit', { datum: formatDate(person.createdAt) })}
              </span>
              <div className={overview.facts}>
                <span className={overview.fact}>
                  <b>{tables.length}</b>
                  <span className={overview.factLabel}>
                    {t(tables.length === 1 ? 'personen.tisch' : 'personen.tische')}
                  </span>
                </span>
                <span className={overview.fact}>
                  <b>{fellows}</b>
                  <span className={overview.factLabel}>{t('personen.mitspieler')}</span>
                </span>
              </div>
            </div>
          </div>
          {actions}
        </>
      )}
      <section className={overview.section}>
        <h2 className={overview.sectionTitle}>
          {t('personen.tischeUeberschrift', { anzahl: tables.length })}
        </h2>
        <TableRows person={person} tables={tables} customGames={customGames ?? []} />
      </section>
    </Page>
  );
}
