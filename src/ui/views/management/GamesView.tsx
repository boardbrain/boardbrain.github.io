import { useId, useState, useTransition } from 'react';
import { cleanName } from '@/core/model';
import { SUPPORTED_GAMES } from '@/games/registry';
import { useCustomGames } from '@/infra/db/readHooks';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { NameForm } from '@/ui/components/NameForm';
import { NameList } from '@/ui/components/NameList';
import { Notice } from '@/ui/components/Notice';
import { Page } from '@/ui/components/Page';

type Message = { readonly kind: 'duplicate'; readonly name: string } | { readonly kind: 'empty' };

/**
 * Game management `#/verwaltung/spiele` (US-SP-02): supported and custom games in separate
 * areas (FA-SP-03) and creating custom games with a unique name (AK-2).
 */
export function GamesView(): React.JSX.Element {
  const { db, masterData } = useAppDependencies();
  const customGames = useCustomGames(db);
  const [name, setName] = useState('');
  const [message, setMessage] = useState<Message | null>(null);
  const [isPending, startTransition] = useTransition();
  const supportedId = useId();
  const customId = useId();
  const supportedGames = SUPPORTED_GAMES.map((game) => ({ id: game.id, name: t(game.nameKey) }));

  function save(): void {
    // Unexpected errors in the transition reach the error boundary of the view (ADR-025).
    startTransition(async () => {
      const result = await masterData.createCustomGame(name);
      startTransition(() => {
        if (result.ok) {
          setName('');
          setMessage(null);
          return;
        }
        switch (result.error) {
          case 'name-duplicate':
            setMessage({ kind: 'duplicate', name: cleanName(name) });
            break;
          case 'name-empty':
            setMessage({ kind: 'empty' });
            break;
        }
      });
    });
  }

  function handleNameChange(value: string): void {
    setName(value);
    setMessage(null);
  }

  return (
    <Page title={t('spiele.titel')}>
      <NameForm
        title={t('spiele.neu')}
        value={name}
        isPending={isPending}
        onValueChange={handleNameChange}
        onSubmit={save}
      >
        {message?.kind === 'duplicate' && (
          <Notice tone="error">
            <p>{t('spiele.gleicherName', { name: message.name })}</p>
          </Notice>
        )}
        {message?.kind === 'empty' && (
          <Notice tone="error">
            <p>{t('verwaltung.nameLeer')}</p>
          </Notice>
        )}
      </NameForm>
      <section aria-labelledby={supportedId}>
        <h2 id={supportedId}>{t('spiele.unterstuetzt')}</h2>
        <NameList label={t('spiele.unterstuetzt')} items={supportedGames} />
      </section>
      <section aria-labelledby={customId}>
        <h2 id={customId}>{t('spiele.eigene')}</h2>
        {customGames !== undefined && (
          <NameList
            label={t('spiele.eigene')}
            items={customGames}
            emptyText={t('spiele.eigeneLeer')}
          />
        )}
      </section>
    </Page>
  );
}
