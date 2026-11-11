import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { useState } from 'react';
import { t } from '@/i18n/t';
import { CheckIcon, ChevronIcon, CopyIcon, HomeIcon, ReloadIcon, WarningIcon } from './Icons';
import { PressableButton } from './Pressable';
import styles from './ErrorScreen.module.css';

const BUTTON_ICON_SIZE = 18;
const PILL_ICON_SIZE = 16;
const MARK_ICON_SIZE = 32;
const COPIED_MS = 2000;

/** The page address the error screen reads and reloads; tests pass their own. */
export type ReloadableLocation = {
  readonly hash: string;
  readonly reload: () => void;
  /** Reloads the app at another address of the app, e.g. `#/`. */
  readonly reloadAt: (hash: string) => void;
};

const browserLocation: ReloadableLocation = {
  get hash() {
    return window.location.hash;
  },
  reload: () => {
    window.location.reload();
  },
  reloadAt: (hash) => {
    window.location.hash = hash;
    window.location.reload();
  },
};

type ErrorScreenProps = {
  readonly error: unknown;
  readonly location?: ReloadableLocation;
};

function formatError(error: unknown): string {
  if (error instanceof Error) {
    const heading = `${error.name}: ${error.message}`;
    const stack = error.stack ?? '';
    // Chromium's stack starts with the heading already, Safari's and Firefox's do not.
    return (stack.startsWith(heading) ? stack : `${heading}\n${stack}`).trimEnd();
  }
  return typeof error === 'string' ? error : JSON.stringify(error);
}

/** Error text with address, version and device, as copied into an issue (design K-5, D1). */
function describeError(error: unknown, location: ReloadableLocation): string {
  return [
    formatError(error),
    '',
    `${t('fehler.adresse')}: ${location.hash === '' ? '#/' : location.hash}`,
    `${t('fehler.version')}: ${__APP_VERSION__}`,
    `${t('fehler.geraet')}: ${navigator.userAgent}`,
  ].join('\n');
}

/**
 * Understandable message for an unexpected error (Development Guidelines 7.2, design K-5:
 * docs/design/k5-error-screen-final-preview.html). It fills the whole screen without the card
 * hand, because the frame itself may be broken. "Zum Start" reloads the app on the start view, so
 * no broken state remains. It brings its own Motion features, because it also shows outside the
 * frame (AppLayout), where the pressed state (K-4) would otherwise stay still. Technical details can be copied into an issue; they are never
 * transmitted (NFA-DH-01).
 */
export function ErrorScreen({
  error,
  location = browserLocation,
}: ErrorScreenProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const details = describeError(error, location);

  function handleReload(): void {
    location.reload();
  }

  function handleHome(): void {
    location.reloadAt('#/');
  }

  function handleCopy(): void {
    // Inside the promise, so a browser without clipboard access lands in the same branch.
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(details))
      .then(
        () => {
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, COPIED_MS);
        },
        (copyError: unknown) => {
          // Without clipboard access the details stay readable on the screen.
          console.error('Copying the error details failed', copyError);
          setIsOpen(true);
        },
      );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <main className={styles.screen} role="alert">
          <div className={styles.card}>
            <span className={styles.mark}>
              <WarningIcon size={MARK_ICON_SIZE} />
            </span>
            <h1 className={styles.title} aria-label={t('fehler.titelVorgelesen')}>
              {t('fehler.titel')}
            </h1>
            <p className={styles.text}>{t('fehler.text')}</p>
            <div className={styles.buttons}>
              <PressableButton type="button" onClick={handleReload}>
                <ReloadIcon size={BUTTON_ICON_SIZE} />
                {t('fehler.neuLaden')}
              </PressableButton>
              <PressableButton type="button" className={styles.secondary} onClick={handleHome}>
                <HomeIcon size={BUTTON_ICON_SIZE} />
                {t('fehler.zumStart')}
              </PressableButton>
            </div>
            <div className={styles.details}>
              <div className={styles.detailsHead}>
                <PressableButton
                  type="button"
                  className={styles.toggle}
                  aria-expanded={isOpen}
                  onClick={() => {
                    setIsOpen(!isOpen);
                  }}
                >
                  <span className={isOpen ? styles.chevronOpen : styles.chevron}>
                    <ChevronIcon size={PILL_ICON_SIZE} />
                  </span>
                  {t('fehler.details')}
                </PressableButton>
                <PressableButton
                  type="button"
                  className={isCopied ? styles.copied : styles.copy}
                  onClick={handleCopy}
                >
                  {isCopied ? (
                    <CheckIcon size={PILL_ICON_SIZE} />
                  ) : (
                    <CopyIcon size={PILL_ICON_SIZE} />
                  )}
                  {isCopied ? t('fehler.kopiert') : t('fehler.kopieren')}
                </PressableButton>
              </div>
              {isOpen && <pre className={styles.trace}>{details}</pre>}
            </div>
          </div>
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
