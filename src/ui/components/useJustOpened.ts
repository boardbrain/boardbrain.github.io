import { useEffect, useState } from 'react';

// As long as "Wiederholen" ignores taps after a movement in the flow (MatchView): longer than the
// two taps of a double tap.
const JUST_OPENED_MS = 500;

/**
 * Whether the component appeared less than 500 ms ago. A control that leaves the page at once
 * ignores taps for this moment, so the second tap of a double tap on the page before, where
 * another control sat, does not reach it (Product Owner 22.11.2026: "Zur Übersicht" twice opened
 * "Ergebnis eintragen").
 */
export function useJustOpened(): boolean {
  const [isJustOpened, setJustOpened] = useState(true);
  // External system: the timer.
  useEffect(() => {
    const timer = setTimeout(() => {
      setJustOpened(false);
    }, JUST_OPENED_MS);
    return () => {
      clearTimeout(timer);
    };
  }, []);
  return isJustOpened;
}
