import { useRef } from 'react';
import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import type { CatanPersonDraw } from '@/games/catan';
import { t } from '@/i18n/t';
import { HarborsDrawArt, LandscapesDrawArt, NumbersDrawArt } from '@/ui/art/DrawArt';
import { useElementSize } from '@/ui/components/useElementSize';
import { Coin } from '../Coin';
import { DevCard } from '../DevCard';
import { colorOf } from '../matchColors';
import { DRAW_NAMES } from '../matchTexts';
import { Reveal } from '../Reveal';
import { drawLayout, TASK_CARD_WIDTH } from './cardLayout';
import { PersonFront, Place, TableCard } from './TableCard';
import { tableSize } from './tableSize';
import shared from '../MatchView.module.css';
import styles from './Cards.module.css';

function DrawArt({ draw }: { readonly draw: CatanPersonDraw }): React.JSX.Element {
  switch (draw) {
    case 'landscapes':
      return <LandscapesDrawArt />;
    case 'harbors':
      return <HarborsDrawArt />;
    case 'numbers':
      return <NumbersDrawArt />;
  }
}

type DrawSceneProps = {
  readonly session: StoredSession;
  readonly draw: CatanPersonDraw;
  /** The drawn person, `null` before drawing (US-AB-02 AK-3). */
  readonly result: PersonId | null;
  readonly nameOf: (personId: PersonId) => string;
};

/**
 * Page 5, a draw of a person with cards (US-LS-02, US-IN-01, design I2-D): the development card
 * of the flow, beside it the place of the drawn person, below the person cards face up. Before
 * drawing the card says "Wer?" and the place is empty; afterwards the card of the drawn person
 * lies on it and the development card names the person (US-LS-02 AK-2).
 */
export function DrawScene({ session, draw, result, nameOf }: DrawSceneProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = tableSize(useElementSize(ref));
  const layout = drawLayout(width, height);
  // FA-LS-06: with replacement everyone is in again; the drawn card lies on its place.
  const below = session.setup.participants.filter((personId) => personId !== result);
  const row = layout.row(below.length);
  const resultName = result === null ? '' : nameOf(result);
  return (
    <div ref={ref} className={styles.table}>
      <div
        data-solid=""
        className={styles.task}
        style={{
          left: layout.task.x,
          top: layout.task.y,
          transform: `scale(${String(layout.task.width / TASK_CARD_WIDTH)})`,
        }}
      >
        <DevCard
          title={t(DRAW_NAMES[draw])}
          art={<DrawArt draw={draw} />}
          className={styles.taskCard}
          isResult
        >
          {result === null ? (
            <span className={shared.who}>
              <span className={styles.unknownCoin} aria-hidden="true">
                {t('partie.fragezeichen')}
              </span>
              <strong className={shared.whoName}>{t('partie.wer')}</strong>
            </span>
          ) : (
            <Reveal key={result} className={shared.who}>
              <Coin name={resultName} color={colorOf(session, result)} className={shared.whoCoin} />
              <strong className={shared.whoName}>{resultName}</strong>
            </Reveal>
          )}
          <span className={shared.task}>{t('partie.legtSieAus')}</span>
        </DevCard>
      </div>
      <Place box={layout.slot} label={t('partie.fragezeichen')} isFilled={result !== null} />
      {result !== null && (
        <Reveal key={`card-${result}`} className={styles.layer}>
          <TableCard
            box={layout.slot}
            z={5}
            front={<PersonFront name={resultName} color={colorOf(session, result)} />}
          />
        </Reveal>
      )}
      {below.map((personId, index) => {
        const box = row[index];
        return (
          box !== undefined && (
            <TableCard
              key={personId}
              box={box}
              z={10 + index}
              front={<PersonFront name={nameOf(personId)} color={colorOf(session, personId)} />}
            />
          )
        );
      })}
    </div>
  );
}
