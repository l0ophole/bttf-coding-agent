import { useSyncExternalStore } from 'react';

import { clock } from '@/lib/clock';

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
/**
 * Cached "now". It must only change on ticks or (un)subscription: returning a
 * fresh `clock.now()` on every read would make useSyncExternalStore loop.
 * Initialised lazily so it picks up the clock offset set at startup.
 */
let current: number | null = null;

const snapshot = () => (current ??= clock.now());

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    current = clock.now();
    timer = setInterval(() => {
      current = clock.now();
      listeners.forEach((l) => l());
    }, 1_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function noopSubscribe() {
  return () => {};
}

/**
 * The current time, re-rendering once per second while `enabled`. All callers
 * share one interval, so many live timers cost a single tick.
 */
export function useNow(enabled = true): number {
  return useSyncExternalStore(enabled ? subscribe : noopSubscribe, snapshot, snapshot);
}
