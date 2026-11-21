import type { ReactNode, Ref } from 'react';
import type { CustomGame, LocalDate } from '@/core/model';
import type { PlayedGame } from '@/core/results';
import { t } from '@/i18n/t';
import { LandscapePicture } from '@/ui/art/Pictures';
import { PlusIcon } from '@/ui/components/Icons';
import { PressableButton, PressableLink } from '@/ui/components/Pressable';
import { DevCard } from '@/ui/views/match/DevCard';
import { daysBetween, shortDate } from './dates';
import styles from './GameCards.module.css';

const PLUS_SIZE = 28;
const RECENT_DAYS = 6;

/**
 * "zuletzt heute", "zuletzt vor 3 Tagen", "zuletzt 20.10." or "noch nie gespielt" (design I3-B).
 */
export function lastPlayedText(played: PlayedGame | undefined, today: LocalDate): string {
  if (played === undefined) {
    return t('spiele.nochNie');
  }
  const days = daysBetween(played.lastDate, today);
  if (days <= 0) {
    return t('spiele.zuletzt', { wann: t('datum.heute') });
  }
  if (days === 1) {
    return t('spiele.zuletzt', { wann: t('datum.gestern') });
  }
  if (days <= RECENT_DAYS) {
    return t('spiele.zuletzt', { wann: t('datum.vorTagen', { anzahl: days }) });
  }
  return t('spiele.zuletzt', { wann: shortDate(played.lastDate, today) });
}

/**
 * Short scoring of a custom game on its card: "ohne Punkte", "meiste gewinnen", "wenigste
 * gewinnen" (FA-SP-07).
 */
export function scoringShort(game: CustomGame): string {
  if (game.scoring === 'highest-wins') {
    return t('spiele.wertungKurz.meiste');
  }
  return game.scoring === 'lowest-wins'
    ? t('spiele.wertungKurz.wenigste')
    : t('spiele.wertungKurz.keine');
}

/**
 * The grid of game cards (design I3-B): two side by side on phones, four from 600 px.
 */
export function GameGrid({
  label,
  hint,
  listRef,
  children,
}: {
  readonly label: string;
  /** The list of cards, e.g. to let them glide when sorted anew. */
  readonly listRef?: Ref<HTMLUListElement>;
  /** A short line below the cards. */
  readonly hint?: string | undefined;
  readonly children: ReactNode;
}): React.JSX.Element {
  return (
    <div className={styles.frame}>
      <ul ref={listRef} className={styles.grid} aria-label={label}>
        {children}
      </ul>
      {hint !== undefined && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

type Target = { readonly to: string } | { readonly onPress: () => void };

function CardPress({
  target,
  label,
  className,
  children,
}: {
  readonly target: Target;
  readonly label: string;
  readonly className: string | undefined;
  readonly children: ReactNode;
}): React.JSX.Element {
  return 'to' in target ? (
    <PressableLink to={target.to} look="card" className={className} aria-label={label}>
      {children}
    </PressableLink>
  ) : (
    <PressableButton
      type="button"
      look="card"
      className={className}
      aria-label={label}
      onClick={target.onPress}
    >
      {children}
    </PressableButton>
  );
}

const LETTERS = new Intl.Segmenter('de', { granularity: 'grapheme' });

// The first character as a person sees it, also for an emoji or an accented letter.
function firstLetter(name: string): string {
  for (const { segment } of LETTERS.segment(name)) {
    return segment;
  }
  return '';
}

/**
 * The picture of a custom game: its first letter in a round frame (design I3-B). Decorative.
 */
export function GameLetter({ name }: { readonly name: string }): React.JSX.Element {
  return (
    <span className={styles.art} aria-hidden="true">
      <span className={styles.letter}>{firstLetter(name)}</span>
    </span>
  );
}

/**
 * A custom game as a playing card (design I3-B GL5, SA): the number of matches in the corners,
 * its first letter as the picture, name, when it was played last and how it scores. The same card
 * on "Partie" and "Spiele" (US-SP-03 AK-1).
 */
export function CustomGameCard({
  game,
  played,
  today,
  target,
}: {
  readonly game: CustomGame;
  readonly played: PlayedGame | undefined;
  readonly today: LocalDate;
  readonly target: Target;
}): React.JSX.Element {
  const count = played?.matches ?? 0;
  return (
    <li className={styles.item}>
      <CardPress target={target} label={game.name} className={styles.card}>
        <span className={styles.corner} aria-hidden="true">
          {count}
        </span>
        <GameLetter name={game.name} />
        <strong className={styles.name}>{game.name}</strong>
        <span className={styles.last}>{lastPlayedText(played, today)}</span>
        <span className={styles.note}>{scoringShort(game)}</span>
        <span className={styles.cornerBottom} aria-hidden="true">
          {count}
        </span>
      </CardPress>
    </li>
  );
}

/**
 * Catan as a development card like under "Neue Partie", scaled to the grid (design I3-B F2):
 * when it was played last and "mit Generierung" (US-SP-03 AK-1).
 */
export function CatanGameCard({
  played,
  today,
  target,
}: {
  readonly played: PlayedGame | undefined;
  readonly today: LocalDate;
  /** Without a target the card only shows (Catan has no page under "Spiele"). */
  readonly target?: Target;
}): React.JSX.Element {
  const card = (
    <DevCard title={t('spiele.namen.catan')} art={<LandscapePicture />} isScaled>
      <strong>{lastPlayedText(played, today)}</strong>
      <span className={styles.devNote}>{t('spiele.mitGenerierung')}</span>
    </DevCard>
  );
  return (
    <li className={styles.item}>
      {target === undefined ? (
        <div className={styles.devLink} aria-label={t('spiele.namen.catan')} role="group">
          {card}
        </div>
      ) : (
        <CardPress target={target} label={t('spiele.namen.catan')} className={styles.devLink}>
          {card}
        </CardPress>
      )}
    </li>
  );
}

/**
 * The first card of "Spiele": "Neues Spiel" like "Neue Person" (design I3-B, US-SP-02 AK-1).
 */
export function NewGameCard({ to }: { readonly to: string }): React.JSX.Element {
  return (
    <li className={styles.item}>
      <PressableLink to={to} look="card" className={styles.newCard}>
        <PlusIcon size={PLUS_SIZE} />
        <span className={styles.newLabel}>{t('spiele.neuesSpiel')}</span>
      </PressableLink>
    </li>
  );
}
