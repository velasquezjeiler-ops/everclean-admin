'use client';
import { useEffect, useRef } from 'react';

/**
 * useMapRefresh — calls `callback` immediately and then every `intervalMs`.
 * Cleans up on unmount.
 */
export function useMapRefresh(callback: () => void, intervalMs = 30_000) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    savedCallback.current(); // immediate call
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
