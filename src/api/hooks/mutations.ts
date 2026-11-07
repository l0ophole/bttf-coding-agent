import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { clock } from '@/lib/clock';

import { useApi } from '../context';
import { queryKeys } from '../queryKeys';
import type {
  Conversation,
  CreateGoalInput,
  CreateSessionInput,
  ID,
  Message,
  SaveMessageVersionInput,
  Session,
  SessionSettings,
} from '../types';

function replaceMessage(queryClient: QueryClient, message: Message) {
  queryClient.setQueryData<Conversation>(queryKeys.conversation(message.sessionId), (current) =>
    current
      ? { ...current, messages: current.messages.map((m) => (m.id === message.id ? message : m)) }
      : current,
  );
}

function invalidateSession(queryClient: QueryClient, sessionId: ID) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.conversation(sessionId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  ]);
}

export function useCreateSession() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSessionInput) => api.createSession(input),
    onSuccess: (session) => {
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (sessions) =>
        sessions ? [session, ...sessions] : [session],
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.goals });
    },
  });
}

/** Optimistically applies the new settings, rolling back if the request fails. */
export function useUpdateSessionSettings(sessionId: ID) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<SessionSettings>) => api.updateSessionSettings(sessionId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions });
      const previous = queryClient.getQueryData<Session[]>(queryKeys.sessions);
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (sessions) =>
        sessions?.map((s) =>
          s.id === sessionId ? { ...s, settings: { ...s.settings, ...patch } } : s,
        ),
      );
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.sessions, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}

export function useForkSession(sessionId: ID) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: ID) => api.forkSession(sessionId, messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}

export function useRewindSession(sessionId: ID) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: ID) => api.rewindSession(sessionId, messageId),
    onSettled: () => invalidateSession(queryClient, sessionId),
  });
}

export function useStopAgent(sessionId: ID) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.stopAgent(sessionId),
    onMutate: async () => {
      const key = queryKeys.conversation(sessionId);
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<Conversation>(key, (current) =>
        current
          ? {
              ...current,
              messages: current.messages.map((m) =>
                m.status === 'thinking'
                  ? { ...m, status: 'stopped', completedAt: clock.isoNow() }
                  : m,
              ),
            }
          : current,
      );
    },
    onSettled: () => invalidateSession(queryClient, sessionId),
  });
}

/** Shows the user's message immediately; the agent's reply arrives through polling. */
export function useSendMessage(sessionId: ID) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.sendMessage(sessionId, { content }),
    onMutate: async (content) => {
      const key = queryKeys.conversation(sessionId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Conversation>(key);
      const now = clock.isoNow();
      const optimistic: Message = {
        id: `optimistic-${now}`,
        sessionId,
        role: 'user',
        status: 'complete',
        createdAt: now,
        completedAt: now,
        tokens: null,
        activeVersionId: 'optimistic',
        versions: [
          {
            id: 'optimistic',
            label: 'Original',
            createdAt: now,
            content,
            reasoning: null,
            plan: null,
            segments: [{ type: 'content' }],
          },
        ],
      };
      queryClient.setQueryData<Conversation>(key, (current) =>
        current ? { ...current, messages: [...current.messages, optimistic] } : current,
      );
      return { previous };
    },
    onError: (_error, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.conversation(sessionId), context.previous);
      }
    },
    onSettled: () => invalidateSession(queryClient, sessionId),
  });
}

export function useSaveMessageVersion() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, input }: { messageId: ID; input: SaveMessageVersionInput }) =>
      api.saveMessageVersion(messageId, input),
    onSuccess: (message) => replaceMessage(queryClient, message),
  });
}

export function useSetActiveVersion() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ message, versionId }: { message: Message; versionId: ID }) =>
      api.setActiveVersion(message.id, versionId),
    onMutate: ({ message, versionId }) => {
      const previous = message;
      replaceMessage(queryClient, { ...message, activeVersionId: versionId });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) replaceMessage(queryClient, context.previous);
    },
    onSuccess: (message) => replaceMessage(queryClient, message),
  });
}

export function useCreateGoal() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGoalInput) => api.createGoal(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}
