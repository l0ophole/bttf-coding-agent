import type { ID } from './types';

/** Query key factory: one place that defines the shape of the React Query cache. */
export const queryKeys = {
  sessions: ['sessions'] as const,
  conversation: (sessionId: ID) => ['conversation', sessionId] as const,
  goals: ['goals'] as const,
  project: ['project'] as const,
  models: ['models'] as const,
  environments: ['environments'] as const,
};
