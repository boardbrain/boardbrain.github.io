import { useSyncExternalStore } from 'react';

// FA-IN-08, US-IN-02 AK-5: the tension mode is state of the view only (Architecture 13.6). It is
// never stored: after a restart of the app it is off. It belongs to one match, named by when it
// started, so a new match begins with it off; the overview and back keep it.
let onFor: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function set(match: string, isOn: boolean): void {
  onFor = isOn ? match : null;
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Whether the tension mode is on for the match `match` (e.g. its start time), and a function to
 * switch it (US-IN-02 AK-5).
 */
export function useTensionMode(match: string): readonly [boolean, (isOn: boolean) => void] {
  const isOn = useSyncExternalStore(subscribe, () => onFor === match);
  return [
    isOn,
    (isNextOn: boolean) => {
      set(match, isNextOn);
    },
  ];
}
