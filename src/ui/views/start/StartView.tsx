import { LinkList } from '@/ui/components/LinkList';
import { Page } from '@/ui/components/Page';
import { t } from '@/i18n/t';

/**
 * Start view `#/` (Architecture 13.1). "New match" and the banners follow with their
 * increments.
 */
export function StartView(): React.JSX.Element {
  return (
    <Page title={t('start.titel')} intro={t('start.einleitung')}>
      <LinkList
        label={t('verwaltung.bereiche')}
        links={[
          { to: '/verwaltung/personen', text: t('start.personen') },
          { to: '/verwaltung/spiele', text: t('start.spiele') },
        ]}
      />
    </Page>
  );
}
