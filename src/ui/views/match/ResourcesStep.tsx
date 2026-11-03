import type { StoredSession } from '@/app/ports';
import type { PersonId } from '@/core/model';
import type { CatanStartingResourcesStep } from '@/games/catan';
import { t } from '@/i18n/t';
import { ResourcesOptionIcon } from '@/ui/art/OptionIcons';
import { ResourceCardPicture } from '@/ui/art/Pictures';
import { cx } from '@/ui/components/classNames';
import { colorOf } from './matchColors';
import { orderOrSeats } from './matchFlow';
import { RESOURCE_NAMES } from './matchTexts';
import { Reveal } from './Reveal';
import { TurnBand } from './TurnBand';
import styles from './MatchView.module.css';

// Up to two cards are larger, from four on smaller (design I2-C, S4).
const FEW_UP_TO = 2;
const MANY_FROM = 4;

type ResourcesStepProps = {
  readonly session: StoredSession;
  readonly step: CatanStartingResourcesStep;
  readonly nameOf: (personId: PersonId) => string;
};

/**
 * The starting resources of one person as resource cards S4 with their names (US-SR-01 AK-2,
 * AK-5, design I2-C page 8); duplicates side by side (D1). Below, the band of the placement.
 */
export function ResourcesStep({ session, step, nameOf }: ResourcesStepProps): React.JSX.Element {
  const count = step.result.length;
  const size =
    count <= FEW_UP_TO ? styles.resGridFew : count >= MANY_FROM ? styles.resGridMany : undefined;
  return (
    <>
      <Reveal className={cx(styles.resGrid, size)}>
        {step.result.map((resource, position) => (
          <div key={`${resource}-${String(position)}`} className={styles.resCard}>
            <ResourceCardPicture resource={resource} className={styles.resCardArt} />
            <span className={styles.resName}>{t(RESOURCE_NAMES[resource])}</span>
          </div>
        ))}
      </Reveal>
      <TurnBand
        icon={
          <span className={styles.tbResources}>
            <ResourcesOptionIcon />
          </span>
        }
        name={nameOf(step.personId)}
        what={count === 1 ? t('partie.einRohstoff') : t('partie.rohstoffe', { anzahl: count })}
        color={colorOf(session, step.personId)}
        order={orderOrSeats(session).map((personId) => ({
          personId,
          name: nameOf(personId),
          color: colorOf(session, personId),
        }))}
        currentId={step.personId}
      />
    </>
  );
}
