import type { Session, SessionStatus } from '@/api/types';
import type { BadgeTone } from '@/components/ui/Badge';

export const SESSION_STATUS: Record<SessionStatus, { label: string; tone: BadgeTone }> = {
  working: { label: 'Working…', tone: 'success' },
  idle: { label: 'Waiting for input', tone: 'brand' },
  paused: { label: 'Paused', tone: 'danger' },
  completed: { label: 'Completed', tone: 'success' },
  error: { label: 'Error', tone: 'danger' },
};

/** Total agent working time, including the run in progress. */
export function sessionElapsedMs(session: Session, now: number): number {
  const running = session.activeSince ? Math.max(0, now - Date.parse(session.activeSince)) : 0;
  return session.activeMs + running;
}
