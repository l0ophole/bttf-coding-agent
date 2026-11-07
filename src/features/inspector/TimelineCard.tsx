import { ChevronsRight, GitFork, History, Radio, RotateCcw, Search, SkipBack } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import type { Conversation, ID } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Kbd } from '@/components/ui/Kbd';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/cn';
import { searchConversation } from '@/lib/conversation';
import { formatTime } from '@/lib/format';
import { buildTimeline } from '@/lib/timeline';
import { useUiStore } from '@/stores/uiStore';

import { SESSION_STATUS } from '../session/status';
import { TimelineTrack } from '../timeline/TimelineTrack';
import { useTimeTravel } from '../timeline/useTimeTravel';

/** Focus requests already handled, shared across mounts (the sheet may mount the field). */
let handledFocusRequest = 0;

function JumpSearch({
  conversation,
  onJump,
}: {
  conversation: Conversation | undefined;
  onJump: (messageId: ID) => void;
}) {
  const id = useId();
  const listId = `${id}-results`;
  const inputRef = useRef<HTMLInputElement>(null);
  const focusRequest = useUiStore((s) => s.searchFocusRequest);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchConversation(conversation, query), [conversation, query]);
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));
  const expanded = open && query.trim().length > 0;

  useEffect(() => {
    if (focusRequest > handledFocusRequest) {
      handledFocusRequest = focusRequest;
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [focusRequest]);

  const choose = (index: number) => {
    const result = results[index];
    if (!result) return;
    onJump(result.messageId);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((activeIndex + 1) % Math.max(1, results.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((activeIndex - 1 + results.length) % Math.max(1, results.length));
    } else if (event.key === 'Enter' && expanded) {
      event.preventDefault();
      choose(activeIndex);
    } else if (event.key === 'Escape') {
      if (expanded) {
        event.preventDefault();
        setOpen(false);
      } else {
        setQuery('');
      }
    }
  };

  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="sr-only">
        Jump to a message or tool call
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted"
      />
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={
          expanded && results[activeIndex] ? `${id}-r-${activeIndex}` : undefined
        }
        placeholder="Jump to..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-lg border border-border-strong bg-surface-sunken pr-14 pl-9 text-base text-fg placeholder:text-fg-subtle hover:border-border-accent focus-visible:border-border-accent focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
      />
      <Kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 md:inline-flex">
        Ctrl K
      </Kbd>
      <ul
        id={listId}
        role="listbox"
        aria-label="Search results"
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border-strong bg-surface-overlay p-1 shadow-popover"
      >
        {results.length === 0 ? (
          <li
            role="option"
            aria-selected={false}
            aria-disabled="true"
            className="px-2 py-2 text-sm text-fg-subtle"
          >
            No matches
          </li>
        ) : (
          results.map((result, index) => (
            // Driven by aria-activedescendant from the input; pointer selection is a shortcut.
            // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events
            <li
              key={result.id}
              id={`${id}-r-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(index)}
              className={cn('rounded-md px-2 py-1.5', index === activeIndex && 'bg-surface-hover')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-fg">{result.title}</span>
                <span className="text-xs text-fg-subtle">{formatTime(result.time)}</span>
              </span>
              <span className="block truncate text-xs text-fg-muted">{result.snippet}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

/** Mini timeline, step / rewind / fork controls and the jump search. */
export function TimelineCard() {
  const { session, conversation, playhead, forkHere, forking, rewindHere, canAct } =
    useTimeTravel();
  const working = session?.status === 'working';
  const now = useNow(working);
  const timeline = useMemo(() => buildTimeline(conversation, now), [conversation, now]);
  const titleId = useId();

  const status = session ? SESSION_STATUS[session.status] : null;

  return (
    <Panel as="section" variant="raised" aria-labelledby={titleId} className="pb-3">
      <PanelHeader
        id={titleId}
        icon={<History />}
        title="Timeline"
        actions={
          working ? (
            <Badge tone="success" size="md">
              <Radio aria-hidden />
              Live
            </Badge>
          ) : status ? (
            <Badge tone={status.tone === 'success' ? 'success' : 'neutral'} size="md">
              {session?.status === 'idle' ? 'Idle' : status.label}
            </Badge>
          ) : null
        }
      />
      <div className="px-3">
        <TimelineTrack
          variant="mini"
          label="Timeline overview playhead"
          timeline={timeline}
          messages={playhead.messages}
          selectedIndex={playhead.index}
          onSelectMessage={(messageId) => playhead.select(messageId)}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 px-3">
        <IconButton
          label="Previous message"
          icon={<SkipBack />}
          variant="outline"
          size="md"
          disabled={playhead.index <= 0}
          onClick={() => playhead.step(-1)}
        />
        <IconButton
          label="Next message"
          icon={<ChevronsRight />}
          variant="outline"
          size="md"
          disabled={playhead.index >= playhead.messages.length - 1}
          onClick={() => playhead.step(1)}
        />
        <Button
          variant="outline"
          size="sm"
          leadingIcon={<RotateCcw />}
          disabled={!canAct}
          onClick={rewindHere}
        >
          Rewind
        </Button>
        <Button
          variant="outline"
          size="sm"
          leadingIcon={<GitFork />}
          disabled={!canAct}
          loading={forking}
          onClick={forkHere}
        >
          Fork
        </Button>
      </div>
      <div className="mt-3 px-3">
        <JumpSearch
          conversation={conversation}
          onJump={(messageId) => playhead.select(messageId)}
        />
      </div>
    </Panel>
  );
}
