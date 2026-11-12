import styles from './Match.module.css';

const STEPS = 3;

/**
 * Progress of the preparation in three steps: table, options, colours (design I2-C, V3).
 * Decorative: the subtitle names the step.
 */
export function WizardDots({ done }: { readonly done: number }): React.JSX.Element {
  return (
    <div className={styles.wizardDots} aria-hidden="true">
      {Array.from({ length: STEPS }, (_, step) => (
        <span key={step} className={step < done ? styles.wizardDotOn : styles.wizardDot} />
      ))}
    </div>
  );
}
