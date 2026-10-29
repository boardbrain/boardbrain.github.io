import { CATAN_BOARD } from '@/games/catan';
import { t } from '@/i18n/t';
import { Board } from '@/ui/board/Board';
import { Page } from '@/ui/components/Page';
import styles from './BoardView.module.css';

/**
 * Board view `#/brett` (US-PL-01, design I1-D): shows the empty board until the placement of
 * increment I2 uses it. Reached via its address and the diagnostics view only, not via the
 * main navigation (Architecture 13.1).
 */
export function BoardView(): React.JSX.Element {
  return (
    <Page
      title={t('brett.titel')}
      intro={t('brett.einleitung')}
      backFallback="/diagnose"
      isWide
      isFullHeight
    >
      <div className={styles.area}>
        <Board board={CATAN_BOARD} />
      </div>
    </Page>
  );
}
