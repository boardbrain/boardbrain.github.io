import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import type { CatanPersonDrawStep } from '@/games/catan';
import { t } from '@/i18n/t';
import { HarborsDrawArt, LandscapesDrawArt, NumbersDrawArt } from '@/ui/art/DrawArt';
import { Coin } from './Coin';
import { DevCard } from './DevCard';
import { DRAW_NAMES } from './matchTexts';
import { colorOf } from './matchColors';
import { Reveal } from './Reveal';
import styles from './MatchView.module.css';

function DrawArt({ draw }: { readonly draw: CatanPersonDrawStep['draw'] }): React.JSX.Element {
  switch (draw) {
    case 'landscapes':
      return <LandscapesDrawArt />;
    case 'harbors':
      return <HarborsDrawArt />;
    case 'numbers':
      return <NumbersDrawArt />;
  }
}

type DrawStepProps = {
  readonly session: StoredSession;
  readonly step: CatanPersonDrawStep;
  readonly nameOf: (personId: PersonId) => string;
};

/**
 * Result of LS-01, LS-03 or LS-04 as a development card D2 (US-LS-02 AK-2, design I2-C
 * page 5): what is laid out, its picture, and who does it.
 */
export function DrawStep({ session, step, nameOf }: DrawStepProps): React.JSX.Element {
  const name = nameOf(step.result);
  return (
    <Reveal className={styles.resultCard}>
      <DevCard
        title={t(DRAW_NAMES[step.draw])}
        art={<DrawArt draw={step.draw} />}
        className={styles.drawCard}
        isResult
      >
        <span className={styles.who}>
          <Coin name={name} color={colorOf(session, step.result)} className={styles.whoCoin} />
          <strong className={styles.whoName}>{name}</strong>
        </span>
        <span className={styles.task}>{t('partie.legtSieAus')}</span>
      </DevCard>
    </Reveal>
  );
}
