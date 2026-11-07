import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import type { ApiClient } from '../client';
import { useApi } from '../context';
import { queryKeys } from '../queryKeys';
import type { Conversation, ID, Session } from '../types';

const POLL_WHILE_WORKING_MS = 1_000;
const SESSIONS_POLL_MS = 2_000;

const isWorking = (sessions: Session[] | undefined) =>
  sessions?.some((session) => session.status === 'working') ?? false;

const hasThinkingMessage = (conversation: Conversation | undefined) =>
  conversation?.messages.some((message) => message.status === 'thinking') ?? false;

function sessionsQuery(api: ApiClient) {
  return queryOptions({
    queryKey: queryKeys.sessions,
    queryFn: () => api.listSessions(),
    refetchInterval: (query) => (isWorking(query.state.data) ? SESSIONS_POLL_MS : false),
  });
}

export function useSessions() {
  const api = useApi();
  return useQuery(sessionsQuery(api));
}

/** One session, selected from the shared sessions list so there is a single cache entry. */
export function useSession(sessionId: ID | null) {
  const api = useApi();
  return useQuery({
    ...sessionsQuery(api),
    select: (sessions: Session[]) => sessions.find((session) => session.id === sessionId) ?? null,
  });
}

/** Messages and tool calls of a session. Polls while the agent is thinking. */
export function useConversation(sessionId: ID | null) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.conversation(sessionId ?? ''),
    queryFn: () => api.getConversation(sessionId!),
    enabled: Boolean(sessionId),
    refetchInterval: (query) =>
      hasThinkingMessage(query.state.data) ? POLL_WHILE_WORKING_MS : false,
  });
}

export function useGoals() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.goals, queryFn: () => api.listGoals() });
}

export function useProject() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.project,
    queryFn: () => api.getProject(),
    staleTime: 60_000,
  });
}

export function useModels() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.models,
    queryFn: () => api.listModels(),
    staleTime: Infinity,
  });
}

export function useEnvironments() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.environments,
    queryFn: () => api.listEnvironments(),
    staleTime: Infinity,
  });
}

/**
 * When an agent run ends (a session leaves "working"), refresh the data the run
 * may have changed but that is not polled: goals and that session's conversation.
 */
export function useRefreshWhenRunsEnd() {
  const queryClient = useQueryClient();
  const { data: sessions } = useSessions();
  const workingIds = useRef<Set<ID>>(new Set());

  useEffect(() => {
    if (!sessions) return;
    const nowWorking = new Set(sessions.filter((s) => s.status === 'working').map((s) => s.id));
    const finished = [...workingIds.current].filter((id) => !nowWorking.has(id));
    workingIds.current = nowWorking;
    if (finished.length === 0) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.goals });
    finished.forEach((id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversation(id) });
    });
  }, [sessions, queryClient]);
}
