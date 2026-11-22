import { useEffect, useState } from 'react';
import styles from './TapShield.module.css';

// As long as "Wiederholen" ignores taps after a movement in the flow (MatchView): longer than the
// two taps of a double tap.
const SHIELD_MS = 500;

/**
 * An invisible layer over the whole screen for a moment after a page opened. The second tap of a
 * double tap on the page before ends on it, not on the control that now sits at the same place
 * (Product Owner 22.11.2026: "Zur Übersicht" twice opened "Ergebnis eintragen").
 */
export function TapShield(): React.JSX.Element | null {
  const [isUp, setUp] = useState(true);
  // External system: the timer.
  useEffect(() => {
    const timer = setTimeout(() => {
      setUp(false);
    }, SHIELD_MS);
    return () => {
      clearTimeout(timer);
    };
  }, []);
  return isUp ? (
    <div className={styles.shield} aria-hidden="true" data-testid="tap-shield" />
  ) : null;
}
