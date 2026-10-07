import { LinkList } from '@/ui/components/LinkList';
import { Page } from '@/ui/components/Page';
import { t } from '@/i18n/t';

/**
 * Overview of the management area `#/verwaltung` (Architecture 13.1). Groups and the archive
 * follow with their increments.
 */
export function ManagementView(): React.JSX.Element {
  return (
    <Page title={t('verwaltung.titel')}>
      <LinkList
        label={t('verwaltung.bereiche')}
        links={[
          { to: '/verwaltung/personen', text: t('verwaltung.personen') },
          { to: '/verwaltung/spiele', text: t('verwaltung.spiele') },
        ]}
      />
    </Page>
  );
}
