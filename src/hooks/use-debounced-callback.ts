"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Debounces a callback — used for autosaving free-text inputs (e.g. custom
 * field values) so typing doesn't fire a network request per keystroke.
 * Select-driven fields don't need this since they only change once per pick.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(
        () => callbackRef.current(...args),
        delayMs,
      );
    },
    [delayMs],
  );
}
