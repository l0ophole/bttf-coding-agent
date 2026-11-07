import { CircleCheck, CircleMinus, CircleX } from 'lucide-react';
import type { ReactNode } from 'react';

import type { ID } from '@/api/types';
import { cn } from '@/lib/cn';
import type { SessionActivity } from '@/lib/conversation';
import { formatDuration, formatTime } from '@/lib/format';

import { TOOL_META } from '../conversation/toolMeta';
import { ToolStatusIcon } from '../conversation/ToolStatusIcon';

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-2 py-3 text-sm text-fg-subtle">{children}</p>;
}

const rowClasses =
  'flex h-7 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors hover:bg-surface-hover';

const CHANGE_BADGE = {
  added: { letter: 'A', className: 'text-success border-success/50', label: 'Added' },
  modified: { letter: 'M', className: 'text-warning border-warning/50', label: 'Modified' },
  deleted: { letter: 'D', className: 'text-danger border-danger/50', label: 'Deleted' },
} as const;

interface ListProps {
  activity: SessionActivity;
  onSelectMessage: (messageId: ID) => void;
}

export function FilesChangedList({ activity, onSelectMessage }: ListProps) {
  if (!activity.files.length) return <Empty>No files changed yet.</Empty>;
  const max = Math.max(...activity.files.map((f) => f.additions + f.deletions), 1);
  return (
    <ul className="flex flex-col">
      {activity.files.map((file) => {
        const badge = CHANGE_BADGE[file.changeType];
        return (
          <li key={file.path}>
            <button
              type="button"
              className={rowClasses}
              onClick={() => onSelectMessage(file.messageId)}
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold',
                  badge.className,
                )}
                aria-hidden
              >
                {badge.letter}
              </span>
              <span className="sr-only">{badge.label}:</span>
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{file.path}</span>
              <span className="text-xs font-medium text-success">+{file.additions}</span>
              <span className="text-xs font-medium text-danger">−{file.deletions}</span>
              <span
                aria-hidden
                className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover sm:flex"
              >
                <span
                  className="bg-success"
                  style={{ width: `${(file.additions / max) * 100}%` }}
                />
                <span className="bg-danger" style={{ width: `${(file.deletions / max) * 100}%` }} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ToolCallList({ activity, onSelectMessage }: ListProps) {
  if (!activity.toolCalls.length) return <Empty>No tool calls yet.</Empty>;
  return (
    <ul className="flex flex-col">
      {[...activity.toolCalls].reverse().map((call) => {
        const Icon = TOOL_META[call.kind].icon;
        return (
          <li key={call.id}>
            <button
              type="button"
              className={rowClasses}
              onClick={() => onSelectMessage(call.messageId)}
            >
              <ToolStatusIcon status={call.status} className="[&_svg]:size-3.5" />
              <Icon aria-hidden className="size-3.5 shrink-0 text-fg-muted" />
              <span className="shrink-0 font-medium text-fg">{call.title}</span>
              <span className="min-w-0 flex-1 truncate text-fg-muted">{call.target}</span>
              <span className="hidden text-xs text-fg-subtle sm:inline">
                {call.durationMs === null ? 'running' : formatDuration(call.durationMs)}
              </span>
              <time dateTime={call.startedAt} className="text-xs text-fg-subtle">
                {formatTime(call.startedAt)}
              </time>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function TestResultsList({ activity, onSelectMessage }: ListProps) {
  const tests = activity.tests;
  if (!tests) return <Empty>No test runs yet.</Empty>;
  const failed = tests.results.filter((r) => r.status === 'failed').length;
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelectMessage(tests.toolCall.messageId)}
        className={cn(rowClasses, 'font-medium', failed ? 'text-danger' : 'text-success')}
      >
        {failed ? (
          <CircleX aria-hidden className="size-3.5" />
        ) : (
          <CircleCheck aria-hidden className="size-3.5" />
        )}
        Latest run: {tests.summary}
        <span className="ml-auto text-xs font-normal text-fg-subtle">
          {formatTime(tests.toolCall.startedAt)}
        </span>
      </button>
      <ul className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        {tests.results.map((result) => (
          <li key={result.id} className="flex h-6 items-center gap-2 px-2 text-xs">
            {result.status === 'passed' && (
              <CircleCheck aria-hidden className="size-3 text-success" />
            )}
            {result.status === 'failed' && <CircleX aria-hidden className="size-3 text-danger" />}
            {result.status === 'skipped' && (
              <CircleMinus aria-hidden className="size-3 text-fg-subtle" />
            )}
            <span className="sr-only">{result.status}</span>
            <span className="min-w-0 flex-1 truncate font-mono text-fg">{result.name}</span>
            <span className="text-fg-subtle">{result.durationMs} ms</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GitList({ activity, onSelectMessage }: ListProps) {
  if (!activity.git.length) return <Empty>No git operations yet.</Empty>;
  return (
    <ul className="flex flex-col">
      {[...activity.git].reverse().map((call) => {
        const firstLine =
          call.output?.kind === 'text' ? (call.output.text.split('\n')[0] ?? '') : '';
        return (
          <li key={call.id}>
            <button
              type="button"
              className={rowClasses}
              onClick={() => onSelectMessage(call.messageId)}
            >
              <ToolStatusIcon status={call.status} className="[&_svg]:size-3.5" />
              <span className="shrink-0 font-mono text-xs text-fg">{call.target}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-fg-muted">{firstLine}</span>
              <time dateTime={call.startedAt} className="text-xs text-fg-subtle">
                {formatTime(call.startedAt)}
              </time>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
