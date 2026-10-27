"use client";

import { useEffect, useState } from "react";

/** useState that remembers its value in the browser (localStorage). */
export function usePersistedState<T>(
  key: string,
  initial: T,
  merge: (stored: unknown, initial: T) => T,
) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setState(merge(JSON.parse(raw), initial));
    } catch {
      /* ignore broken or blocked storage */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state, hydrated]);

  return [state, setState, hydrated] as const;
}
