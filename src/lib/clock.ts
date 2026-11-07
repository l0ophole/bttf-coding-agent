/**
 * Single source of "now" for the app.
 *
 * Everything that needs the current time (elapsed timers, new timestamps in the
 * mock server) reads `clock.now()`. Mock mode shifts the clock so the demo data
 * lines up with the design (10:26 AM); with a real backend it is `Date.now()`.
 */
let offsetMs = 0;

export const clock = {
  now(): number {
    return Date.now() + offsetMs;
  },
  /** Make `now()` return `epochMs` at this instant and keep ticking from there. */
  setNow(epochMs: number): void {
    offsetMs = epochMs - Date.now();
  },
  reset(): void {
    offsetMs = 0;
  },
  isoNow(): string {
    return new Date(this.now()).toISOString();
  },
};
