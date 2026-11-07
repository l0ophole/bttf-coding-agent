import { ChevronLeft, ChevronRight, GitFork } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Panel } from '@/components/ui/Panel';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';

import { useTimeTravel } from './useTimeTravel';

/** "Rewind to: Start · Current" + "Fork from here". */
export function RewindCard({ className }: { className?: string }) {
  const { playhead, forkHere, forking, canAct } = useTimeTravel();
  const atStart = playhead.index === 0 && playhead.messages.length > 1;

  const segment = (active: boolean) =>
    cn(
      'h-8 flex-1 rounded-md text-base font-medium transition-colors disabled:opacity-50',
      active
        ? 'border border-border-accent bg-surface-selected text-fg shadow-glow'
        : 'text-fg-muted hover:text-fg',
    );

  return (
    <Panel
      as="section"
      aria-labelledby="rewind-card-title"
      className={cn('flex flex-col gap-2.5 p-3', className)}
    >
      <h2 id="rewind-card-title" className="text-md font-semibold text-fg">
        Rewind to
      </h2>
      <div
        role="group"
        aria-label="Move the playhead"
        className="flex gap-1 rounded-lg border border-border bg-surface-sunken p-0.5"
      >
        <button
          type="button"
          aria-pressed={atStart}
          disabled={!canAct}
          onClick={playhead.toStart}
          className={segment(atStart)}
        >
          Start
        </button>
        <button
          type="button"
          aria-pressed={playhead.following}
          disabled={!canAct}
          onClick={playhead.toLatest}
          className={segment(playhead.following)}
        >
          Current
        </button>
      </div>
      <Button
        variant="violet"
        size="md"
        leadingIcon={<GitFork />}
        onClick={forkHere}
        loading={forking}
        disabled={!canAct}
      >
        Fork from here
      </Button>
    </Panel>
  );
}

/** Step the playhead message by message; the time is announced politely. */
export function JumpToCard({ className }: { className?: string }) {
  const { playhead } = useTimeTravel();
  const message = playhead.message;
  return (
    <Panel
      as="section"
      aria-labelledby="jump-card-title"
      className={cn('flex flex-col gap-2.5 p-3', className)}
    >
      <h2 id="jump-card-title" className="text-md font-semibold text-fg">
        Jump to
      </h2>
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <IconButton
          label="Previous message"
          icon={<ChevronLeft />}
          variant="outline"
          size="lg"
          disabled={playhead.index <= 0}
          onClick={() => playhead.step(-1)}
        />
        <output
          aria-label="Playhead time"
          className="flex h-9 min-w-0 flex-1 items-center justify-center rounded-lg border border-border-strong bg-surface-sunken text-lg font-medium text-fg tabular-nums"
        >
          {message ? formatTime(message.createdAt) : '—'}
        </output>
        <IconButton
          label="Next message"
          icon={<ChevronRight />}
          variant="outline"
          size="lg"
          disabled={playhead.index >= playhead.messages.length - 1}
          onClick={() => playhead.step(1)}
        />
      </div>
    </Panel>
  );
}
