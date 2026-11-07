import { useCallback, useMemo } from 'react';

import { useConversation, useSession } from '@/api/hooks/queries';
import type { Conversation, ID, Message } from '@/api/types';
import { useWorkspaceStore } from '@/stores/workspaceStore';

/** The session shown in the main area, with its conversation. */
export function useActiveSession() {
  const sessionId = useWorkspaceStore((s) => s.activeSessionId);
  const sessionQuery = useSession(sessionId);
  const conversationQuery = useConversation(sessionId);
  return {
    sessionId,
    session: sessionQuery.data ?? null,
    conversation: conversationQuery.data,
    isLoading: sessionQuery.isPending || (Boolean(sessionId) && conversationQuery.isPending),
    error: sessionQuery.error ?? conversationQuery.error,
    refetch: conversationQuery.refetch,
  };
}

export interface Playhead {
  messages: Message[];
  /** Index of the selected message, -1 when the conversation is empty. */
  index: number;
  message: Message | null;
  /** True while the playhead follows the newest message. */
  following: boolean;
  select: (messageId: ID | null) => void;
  step: (delta: number) => void;
  toStart: () => void;
  toLatest: () => void;
}

/**
 * The timeline playhead: the selected message of a session. Every timeline,
 * inspector and "jump" control reads and writes this one value.
 */
export function usePlayhead(
  sessionId: ID | null,
  conversation: Conversation | undefined,
): Playhead {
  const stored = useWorkspaceStore((s) => (sessionId ? (s.playhead[sessionId] ?? null) : null));
  const setPlayhead = useWorkspaceStore((s) => s.setPlayhead);
  const messages = useMemo(() => conversation?.messages ?? [], [conversation]);

  const storedIndex = stored ? messages.findIndex((m) => m.id === stored) : -1;
  const following = storedIndex === -1;
  const index = following ? messages.length - 1 : storedIndex;

  const select = useCallback(
    (messageId: ID | null) => {
      if (!sessionId) return;
      // Selecting the newest message means "follow live" so new messages stay in view.
      const latest = messages[messages.length - 1];
      setPlayhead(sessionId, messageId && messageId !== latest?.id ? messageId : null);
    },
    [sessionId, setPlayhead, messages],
  );

  const step = useCallback(
    (delta: number) => {
      const next = messages[Math.min(messages.length - 1, Math.max(0, index + delta))];
      if (next) select(next.id);
    },
    [messages, index, select],
  );

  return {
    messages,
    index,
    message: messages[index] ?? null,
    following,
    select,
    step,
    toStart: () => select(messages[0]?.id ?? null),
    toLatest: () => select(null),
  };
}
