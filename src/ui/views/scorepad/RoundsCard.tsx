import { m } from 'motion/react';
import { useState } from 'react';
import type { ScoreTarget, ScoringDirection } from '@/core/model';
import type { ScoreRound } from '@/core/scorepad';
import { t } from '@/i18n/t';
import { ChevronIcon, TargetIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { Unfold } from '@/ui/components/Unfold';
import type { ResultPerson } from '@/ui/views/result/ResultRows';
import { MiniPaper } from './MiniPaper';
import { roundsText, targetText } from './padTexts';
import { ScoreBlock } from './ScoreBlock';
import styles from './RoundsCard.module.css';

const CHEVRON_SIZE = 18;
const TARGET_SIZE = 12;

/**
 * The rounds of a result from the score pad (US-NB-05 AK-1, design I3-C2 DF1): a card with the
 * small sheet, the number of rounds and the target; opened, the block to read in the same card.
 */
export function RoundsCard({
  persons,
  rounds,
  target,
  scoring,
}: {
  readonly persons: readonly ResultPerson[];
  readonly rounds: readonly ScoreRound[];
  readonly target: ScoreTarget | null;
  readonly scoring: ScoringDirection;
}): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.card}>
      <PressableButton
        type="button"
        className={styles.row}
        aria-expanded={isOpen}
        aria-label={t('notizblock.rundenZeigen')}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <MiniPaper />
        <span className={styles.text}>
          <strong>{t('notizblock.rundenKarte')}</strong>
          <small>
            {roundsText(rounds.length)}
            {target !== null && (
              <>
                {t('notizblock.trenner')}
                <span className={styles.target}>
                  <TargetIcon size={TARGET_SIZE} />
                  {targetText(target)}
                </span>
              </>
            )}
          </small>
        </span>
        <m.span className={styles.chevron} animate={{ rotate: isOpen ? 90 : 0 }}>
          <ChevronIcon size={CHEVRON_SIZE} />
        </m.span>
      </PressableButton>
      <Unfold isOpen={isOpen}>
        <ScoreBlock
          persons={persons}
          rounds={rounds}
          scoring={scoring}
          calculation="app"
          target={target}
          isReadOnly
          isInCard
        />
      </Unfold>
    </div>
  );
}
