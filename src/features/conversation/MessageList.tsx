import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import type { Conversation } from '@/api/types';
import { indexToolCalls } from '@/lib/conversation';

import type { Playhead } from '../session/useActiveSession';
import { AgentMessage, UserMessage } from './MessageItem';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** How close to the bottom (px) still counts as "reading the latest". */
const STICKY_THRESHOLD = 120;

interface MessageListProps {
  conversation: Conversation;
  playhead: Playhead;
}

/**
 * Scrollable list of message cards. Follows new content while the reader is at
 * the bottom, and scrolls the selected message into view when the playhead moves.
 */
export function MessageList({ conversation, playhead }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const toolCalls = useMemo(() => indexToolCalls(conversation.toolCalls), [conversation.toolCalls]);
  const selectedId = playhead.message?.id;

  // A signature that changes whenever visible content grows.
  const contentSignature = `${conversation.messages.length}:${conversation.toolCalls.length}:${
    conversation.messages.at(-1)?.status
  }:${conversation.messages.at(-1)?.versions.at(0)?.content.length}`;

  // Start at the bottom, like any chat.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [conversation.sessionId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (playhead.following) {
      if (stickToBottom.current) container.scrollTo({ top: container.scrollHeight, behavior });
      return;
    }
    const element = container.querySelector<HTMLElement>(`[data-message-id="${selectedId}"]`);
    element?.scrollIntoView({ block: 'nearest', behavior });
  }, [selectedId, playhead.following, contentSignature]);

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        const el = event.currentTarget;
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICKY_THRESHOLD;
      }}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
    >
      <h2 className="sr-only">Conversation</h2>
      <ol className="flex flex-col gap-3 pb-1">
        {conversation.messages.map((message) => {
          const Item = message.role === 'user' ? UserMessage : AgentMessage;
          return (
            <li key={message.id}>
              <Item
                message={message}
                toolCalls={toolCalls}
                selected={message.id === selectedId}
                onSelect={() => playhead.select(message.id)}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
