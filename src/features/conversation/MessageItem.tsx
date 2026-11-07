import { CircleDot, X } from 'lucide-react';
import { useId } from 'react';

import { useStopAgent } from '@/api/hooks/mutations';
import type { Message, ToolCall } from '@/api/types';
import { AgentAvatar, UserAvatar } from '@/components/brand/Avatars';
import { IconButton } from '@/components/ui/IconButton';
import { RichText } from '@/components/ui/RichText';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/cn';
import { getActiveVersion } from '@/lib/conversation';
import { formatDuration, formatTime } from '@/lib/format';
import { toast } from '@/stores/toastStore';

import { ThoughtProcess } from './ThoughtProcess';
import { ToolCallRow } from './ToolCallRow';

interface MessageItemProps {
  message: Message;
  toolCalls: Map<string, ToolCall>;
  selected: boolean;
  onSelect: () => void;
}

function MessageTime({ message, onSelect }: { message: Message; onSelect: () => void }) {
  const author = message.role === 'user' ? 'your' : 'agent';
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Inspect ${author} message from ${formatTime(message.createdAt)}`}
      className="rounded text-sm text-fg-subtle hover:text-fg hover:underline"
    >
      <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
    </button>
  );
}

function AgentRunStatus({ message }: { message: Message }) {
  const thinking = message.status === 'thinking';
  const now = useNow(thinking);
  const start = Date.parse(message.createdAt);
  const end = message.completedAt ? Date.parse(message.completedAt) : now;
  const duration = formatDuration(Math.max(0, end - start));

  if (thinking) {
    return (
      <span className="flex items-center gap-2 text-md text-fg">
        <span
          aria-hidden
          className="size-2 animate-pulse-dot rounded-full bg-evt-reasoning text-evt-reasoning"
        />
        Thinking… ({duration})
      </span>
    );
  }
  if (message.status === 'stopped') {
    return <span className="text-sm text-warning">Stopped after {duration}</span>;
  }
  if (message.status === 'error') {
    return <span className="text-sm text-danger">Failed after {duration}</span>;
  }
  return <span className="text-sm text-fg-subtle">Worked for {duration}</span>;
}

const cardClasses = (selected: boolean) =>
  cn(
    'rounded-xl border px-3 py-2.5 transition-[border-color,box-shadow] duration-200 sm:px-4',
    selected
      ? 'border-border-accent bg-surface-raised/70 shadow-[0_0_0_1px_var(--violet-border),0_0_22px_-8px_var(--violet-glow)]'
      : 'border-border bg-surface-raised/40',
  );

export function UserMessage({ message, selected, onSelect }: MessageItemProps) {
  const headingId = useId();
  const version = getActiveVersion(message);
  return (
    // Clicking anywhere selects the message for mouse users; keyboard users use the time button.
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions
    <article
      aria-labelledby={headingId}
      aria-current={selected ? 'true' : undefined}
      data-message-id={message.id}
      onClick={onSelect}
      className={cn(cardClasses(selected), 'flex gap-3')}
    >
      <UserAvatar />
      <div className="min-w-0 flex-1">
        <header className="flex items-baseline gap-3">
          <h3 id={headingId} className="text-xl font-semibold text-link">
            User
          </h3>
          <MessageTime message={message} onSelect={onSelect} />
        </header>
        <RichText text={version.content} className="mt-0.5 text-md text-fg" />
      </div>
    </article>
  );
}

export function AgentMessage({ message, toolCalls, selected, onSelect }: MessageItemProps) {
  const headingId = useId();
  const version = getActiveVersion(message);
  const stop = useStopAgent(message.sessionId);
  const thinking = message.status === 'thinking';

  return (
    // Clicking anywhere selects the message for mouse users; keyboard users use the time button.
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions
    <article
      aria-labelledby={headingId}
      aria-current={selected ? 'true' : undefined}
      aria-busy={thinking}
      data-message-id={message.id}
      onClick={onSelect}
      className={cn(cardClasses(selected), 'flex gap-3')}
    >
      <AgentAvatar />
      <div className="min-w-0 flex-1">
        <header className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1">
          <h3 id={headingId} className="text-xl font-semibold text-link">
            Agent
          </h3>
          <MessageTime message={message} onSelect={onSelect} />
          <AgentRunStatus message={message} />
          {thinking && (
            <span className="ml-auto">
              <IconButton
                label="Stop agent"
                icon={<X />}
                size="sm"
                disabled={stop.isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  stop.mutate(undefined, { onSuccess: () => toast.info('Agent stopped') });
                }}
              />
            </span>
          )}
        </header>

        <div className="mt-1.5 space-y-2.5">
          {(version.reasoning || version.plan) && (
            <ThoughtProcess reasoning={version.reasoning} plan={version.plan} />
          )}
          {version.segments.map((segment, index) => {
            if (segment.type === 'tool') {
              const call = toolCalls.get(segment.toolCallId);
              return call ? (
                <ToolCallRow
                  key={segment.toolCallId}
                  call={call}
                  defaultExpanded={segment.expanded}
                />
              ) : null;
            }
            if (!version.content) {
              return thinking ? (
                <p
                  key={`content-${index}`}
                  className="flex items-center gap-2 pl-1 text-base text-fg-muted"
                >
                  <span aria-hidden className="h-3 w-24 skeleton rounded" />
                  <span className="sr-only">Writing a reply</span>
                </p>
              ) : null;
            }
            return (
              <div key={`content-${index}`} className="flex gap-2.5">
                <CircleDot aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                <RichText text={version.content} className="text-md text-fg" />
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
