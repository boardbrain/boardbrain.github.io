import { AnimatePresence, m } from 'motion/react';
import { useEffect, useId } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { parseGroupId, parseMatchId, type GroupId, type MatchId } from '@/core/model';
import { t } from '@/i18n/t';
import { useCurrentSession, useGroup } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { ChevronIcon, PlayIcon, TrophyIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { Logo } from '@/ui/components/Logo';
import { PlayingCard } from '@/ui/components/PlayingCard';
import { PressableLink } from '@/ui/components/Pressable';
import { useAreaCards } from '@/ui/views/areaCards';
import styles from './StartView.module.css';

const FAN_POSITIONS = [styles.left, styles.middle, styles.right];
const LOGO_SIZE = 44;
const TROPHY_SIZE = 24;
const SAVED_ARROW_SIZE = 20;
// Long enough to read (Product Owner 20.11.2026): at least 5 s, longer for long names.
const NOTE_MIN_MS = 5000;
const NOTE_MS_PER_CHARACTER = 70;

type SavedNote = {
  readonly who: string;
  readonly where: string;
  readonly groupId: GroupId;
  readonly matchId: MatchId;
};

// The note the result form passes along (design I3-B R3, I3-C NB1); anything else in the history
// is ignored.
function savedNoteOf(state: unknown): SavedNote | null {
  if (typeof state !== 'object' || state === null || !('saved' in state)) {
    return null;
  }
  const { saved } = state;
  if (
    typeof saved !== 'object' ||
    saved === null ||
    !('who' in saved && 'where' in saved && 'groupId' in saved && 'matchId' in saved) ||
    typeof saved.who !== 'string' ||
    typeof saved.where !== 'string' ||
    typeof saved.groupId !== 'string' ||
    typeof saved.matchId !== 'string'
  ) {
    return null;
  }
  const groupId = parseGroupId(saved.groupId);
  const matchId = parseMatchId(saved.matchId);
  return groupId.ok && matchId.ok
    ? { who: saved.who, where: saved.where, groupId: groupId.value, matchId: matchId.value }
    : null;
}

/**
 * Start view `#/` (Architecture 13.1, design D-3): persons, tables and games as a fan of
 * playing cards right above the card hand; the view never scrolls. Above them the draw pile
 * "Partie" (I2, US-SP-01 AK-1): it starts a new match, or leads to the running one. At the top
 * the logo with the app name, the only place it appears in the app (design I2-G, L5); below it
 * the banner of a running match leads back to it with one tap (US-AB-04 AK-2, design I2-D);
 * the banners of I4 follow there.
 */
export function StartView(): React.JSX.Element {
  const { db } = useAppDependencies();
  const cards = useAreaCards();
  const current = useCurrentSession(db);
  const group = useGroup(db, current?.status === 'active' ? current.session.groupId : null);
  const headingId = useId();
  const location = useLocation();
  const navigate = useNavigate();
  const saved = savedNoteOf(location.state);
  // NB1: the card leads to the result in the list of its table, lit up once (design I3-C).
  const openSaved = (note: SavedNote): void => {
    void navigate('.', { replace: true, state: null });
    void navigate(`/verwaltung/gruppen/${note.groupId}?reiter=ergebnisse`, {
      state: { highlight: note.matchId },
    });
  };
  const noteMs =
    saved === null
      ? 0
      : Math.max(NOTE_MIN_MS, (saved.who.length + saved.where.length) * NOTE_MS_PER_CHARACTER);
  // External system: the clock. The note disappears on its own once it could be read.
  useEffect(() => {
    if (noteMs === 0) {
      return undefined;
    }
    const timer = setTimeout(() => {
      void navigate('.', { replace: true, state: null });
    }, noteMs);
    return () => {
      clearTimeout(timer);
    };
  }, [noteMs, navigate, location.key]);
  return (
    <main className={styles.start}>
      {/* R3: after storing a result a card floats at the top, over the banner of a match, and
          moves nothing; it disappears once it could be read. NB1: a tap opens the result in the
          list of its table (design I3-C). */}
      <AnimatePresence>
        {saved !== null && (
          <m.div
            key="saved"
            className={styles.savedNote}
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <PressableButton
              type="button"
              look="card"
              className={styles.savedButton}
              aria-label={t('ergebnisse.ansehen', { wer: saved.who, wo: saved.where })}
              onClick={() => {
                openSaved(saved);
              }}
            >
              <span className={styles.savedIcon}>
                <TrophyIcon size={TROPHY_SIZE} />
              </span>
              <span className={styles.savedText}>
                <strong>{saved.who}</strong>
                <small>{saved.where}</small>
              </span>
              <span className={styles.savedArrow}>
                <ChevronIcon size={SAVED_ARROW_SIZE} />
              </span>
            </PressableButton>
          </m.div>
        )}
      </AnimatePresence>
      <h1 className={styles.hiddenTitle}>{t('start.titel')}</h1>
      <p className={styles.brand}>
        <Logo size={LOGO_SIZE} />
        {t('app.name')}
      </p>
      {/* Place for the banners (reminder I4, update I4, running match I2) at the top; they must
          not push the cards down while there is room. Look and sizes:
          docs/design/d3-start-navigation-final-preview.html, scope "Mit späteren Funktionen". */}
      {group !== undefined && group !== null && (
        <div className={styles.banner}>
          <span className={styles.bannerText}>
            <b>{group.name}</b>
            {t('start.spieltGerade')}
          </span>
          <PressableLink to="/partie" className={styles.pill}>
            {t('start.weiter')}
            <ChevronIcon size={14} />
          </PressableLink>
        </div>
      )}
      <div className={styles.spacer} />
      {/* "Partie" as a draw pile right above the cards, together with them in one column with a
          14px gap (same reference, docs/design/i2-match-final-preview.html). */}
      <div className={styles.column}>
        <PressableLink
          to={current !== undefined && current.status !== 'none' ? '/partie' : '/partie/neu'}
          look="card"
          className={styles.pile}
        >
          <span className={styles.pileStack} aria-hidden="true">
            <span className={styles.back} />
            <span className={styles.back} />
            <span className={styles.back}>
              <span className={styles.backBadge}>
                <PlayIcon size={18} />
              </span>
            </span>
          </span>
          <strong className={styles.pileTitle}>{t('start.partie')}</strong>
          <span className={styles.pileArrow}>
            <ChevronIcon size={20} />
          </span>
        </PressableLink>
        <nav className={styles.cards} aria-labelledby={headingId}>
          <h2 id={headingId} className={styles.heading}>
            {t('karten.titel')}
          </h2>
          <div className={styles.fan}>
            {cards?.map((card, index) => (
              <PlayingCard
                key={card.key}
                to={card.to}
                title={card.title}
                count={card.count}
                icon={card.icon}
                note={
                  card.key === 'personen' && card.count === 0 ? t('karten.hierAnfangen') : undefined
                }
                className={FAN_POSITIONS[index]}
              />
            ))}
          </div>
        </nav>
      </div>
      <div className={styles.spacerLow} />
    </main>
  );
}
