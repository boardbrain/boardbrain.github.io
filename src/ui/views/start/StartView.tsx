import { AnimatePresence, m } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { parseGroupId, parseMatchId, type GroupId, type MatchId } from '@/core/model';
import { t } from '@/i18n/t';
import {
  useCurrentScorePad,
  useCurrentSession,
  useCustomGame,
  useGroup,
} from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { ChevronIcon, PlayIcon, TrophyIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import { Logo } from '@/ui/components/Logo';
import { PlayingCard } from '@/ui/components/PlayingCard';
import { PressableLink } from '@/ui/components/Pressable';
import { useAreaCards } from '@/ui/views/areaCards';
import { MatchDialog } from '@/ui/views/match/MatchDialog';
import { MiniPaper } from '@/ui/views/scorepad/MiniPaper';
import { FROM_START } from '@/ui/views/scorepad/padNavigation';
import styles from './StartView.module.css';

const FAN_POSITIONS = [styles.left, styles.middle, styles.right];
const LOGO_SIZE = 44;
const TROPHY_SIZE = 24;
const SAVED_ARROW_SIZE = 20;
const PAD_ARROW_SIZE = 18;
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
 * the banners of I4 follow there. Above "Partie" the row "Notizblock" starts the score pad or, in
 * the accent colour, leads back to the running one (US-NB-01, design I3-C2 SL4); there is at most
 * one running match, so the other one asks first (E-51).
 */
export function StartView(): React.JSX.Element {
  const { db } = useAppDependencies();
  const cards = useAreaCards();
  const current = useCurrentSession(db);
  const group = useGroup(db, current?.status === 'active' ? current.session.groupId : null);
  const padState = useCurrentScorePad(db);
  const pad = padState?.status === 'active' ? padState.pad : null;
  const padGame = useCustomGame(db, pad?.gameId ?? null);
  const padGroup = useGroup(db, pad?.groupId ?? null);
  const [asking, setAsking] = useState<'pad' | 'match' | null>(null);
  const isPadRunning = padState !== undefined && padState.status !== 'none';
  const isMatchRunning = current !== undefined && current.status !== 'none';
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
        {isMatchRunning ? (
          <PressableButton
            type="button"
            look="card"
            className={styles.padRow}
            onClick={() => {
              setAsking('match');
            }}
          >
            <PadRowContent />
          </PressableButton>
        ) : (
          <PressableLink
            to={isPadRunning ? '/notizblock' : '/notizblock/neu'}
            state={isPadRunning ? FROM_START : undefined}
            look="card"
            className={cx(styles.padRow, isPadRunning && styles.padRunning)}
          >
            <PadRowContent
              running={
                pad === null
                  ? undefined
                  : t('notizblock.startLaeuft', {
                      spiel: padGame?.name ?? '',
                      tisch: padGroup?.name ?? '',
                      runde: pad.rounds.length + 1,
                    })
              }
            />
          </PressableLink>
        )}
        {isPadRunning ? (
          <PressableButton
            type="button"
            look="card"
            className={styles.pile}
            onClick={() => {
              setAsking('pad');
            }}
          >
            <PileContent />
          </PressableButton>
        ) : (
          <PressableLink
            to={isMatchRunning ? '/partie' : '/partie/neu'}
            look="card"
            className={styles.pile}
          >
            <PileContent />
          </PressableLink>
        )}
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
      {asking === 'pad' && (
        <MatchDialog
          title={t('notizblock.laeuft')}
          lines={[
            ...(pad === null
              ? []
              : [
                  t('notizblock.laeuftText', {
                    tisch: padGroup?.name ?? '',
                    spiel: padGame?.name ?? '',
                    runde: pad.rounds.length + 1,
                  }),
                ]),
            t('notizblock.erstBeenden'),
          ]}
          cancelLabel={t('allgemein.abbrechen')}
          onCancel={() => {
            setAsking(null);
          }}
          confirmLabel={t('notizblock.zumNotizblock')}
          onConfirm={() => {
            setAsking(null);
            void navigate('/notizblock');
          }}
        />
      )}
      {asking === 'match' && (
        <MatchDialog
          title={t('notizblock.partieLaeuft')}
          lines={[t('notizblock.partieLaeuftText')]}
          cancelLabel={t('allgemein.abbrechen')}
          onCancel={() => {
            setAsking(null);
          }}
          confirmLabel={t('notizblock.zurPartie')}
          onConfirm={() => {
            setAsking(null);
            void navigate('/partie');
          }}
        />
      )}
    </main>
  );
}

/**
 * The draw pile "Partie" (design I2-C).
 */
function PileContent(): React.JSX.Element {
  return (
    <>
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
    </>
  );
}

/**
 * The row "Notizblock" (design I3-C2 SL4, SY1): the small sheet, the name and either what it does
 * or, in the accent colour with a dot, the running score pad with game, table and round.
 */
function PadRowContent({ running }: { readonly running?: string | undefined }): React.JSX.Element {
  return (
    <>
      <MiniPaper />
      <span className={styles.padText}>
        <strong>{t('notizblock.titel')}</strong>
        {running === undefined ? (
          <small>{t('notizblock.startText')}</small>
        ) : (
          <small className={styles.live}>
            <span className={styles.liveDot} aria-hidden="true" />
            {running}
          </small>
        )}
      </span>
      <span className={styles.padArrow}>
        <ChevronIcon size={PAD_ARROW_SIZE} />
      </span>
    </>
  );
}
