import type { ReactNode } from 'react';
import { GlideMarker } from './GlideMarker';
import { PressableButton } from './Pressable';
import { cx } from './classNames';
import styles from './Tabs.module.css';

/**
 * One tab: its key and its label from the language file.
 */
export type TabItem<K extends string> = { readonly key: K; readonly label: string };

type TabsProps<K extends string> = {
  /** Name of the tab list for screen readers. */
  readonly label: string;
  /** From `useId`, shared with the panels. */
  readonly idPrefix: string;
  readonly tabs: readonly TabItem<K>[];
  readonly selected: K;
  readonly onSelect: (key: K) => void;
  readonly className?: string | undefined;
};

const NEXT_KEYS: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
};

/**
 * Id of the tab `key` of a tab list.
 */
export function tabId(idPrefix: string, key: string): string {
  return `${idPrefix}-tab-${key}`;
}

/**
 * Id of the panel of the tab `key`.
 */
export function panelId(idPrefix: string, key: string): string {
  return `${idPrefix}-panel-${key}`;
}

/**
 * Tabs of the table page and of the running match (design I3-C RA1, UE1; C-G-10): text on a thin
 * line, the chosen tab golden with a bar below that glides to it (PO 27.11.2026). A screen reader hears a tab list; the arrow keys,
 * Home and End move between the tabs (WAI-ARIA tabs pattern, automatic activation).
 */
export function Tabs<K extends string>({
  label,
  idPrefix,
  tabs,
  selected,
  onSelect,
  className,
}: TabsProps<K>): React.JSX.Element {
  return (
    <div
      className={cx(styles.tabs, className)}
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => {
        const move = NEXT_KEYS[event.key];
        const index = tabs.findIndex((tab) => tab.key === selected);
        const next = move === undefined ? undefined : tabs[move(index, tabs.length)];
        if (next === undefined) {
          return;
        }
        event.preventDefault();
        onSelect(next.key);
        document.getElementById(tabId(idPrefix, next.key))?.focus();
      }}
    >
      <GlideMarker at={selected} className={styles.bar} />
      {tabs.map((tab) => (
        <PressableButton
          key={tab.key}
          type="button"
          role="tab"
          id={tabId(idPrefix, tab.key)}
          aria-selected={tab.key === selected}
          aria-controls={panelId(idPrefix, tab.key)}
          tabIndex={tab.key === selected ? 0 : -1}
          onClick={() => {
            onSelect(tab.key);
          }}
        >
          <span className={styles.label}>{tab.label}</span>
        </PressableButton>
      ))}
    </div>
  );
}

type TabPanelProps = {
  readonly idPrefix: string;
  readonly tabKey: string;
  readonly className?: string | undefined;
  readonly children: ReactNode;
};

/**
 * The content of the chosen tab, named by its tab.
 */
export function TabPanel({
  idPrefix,
  tabKey,
  className,
  children,
}: TabPanelProps): React.JSX.Element {
  return (
    <div
      role="tabpanel"
      id={panelId(idPrefix, tabKey)}
      aria-labelledby={tabId(idPrefix, tabKey)}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
