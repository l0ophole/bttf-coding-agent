import { ChevronRight } from 'lucide-react';
import { useId, useState } from 'react';

import type { ToolCall } from '@/api/types';
import { cn } from '@/lib/cn';
import { basename } from '@/lib/format';

import { ToolCallCard } from './ToolCallCard';
import { TOOL_META } from './toolMeta';
import { ToolStatusIcon } from './ToolStatusIcon';

interface ToolCallRowProps {
  call: ToolCall;
  defaultExpanded?: boolean;
  className?: string;
}

/** Compact one-line tool call with a "View" disclosure that reveals the full card. */
export function ToolCallRow({ call, defaultExpanded = false, className }: ToolCallRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const meta = TOOL_META[call.kind];
  const Icon = meta.icon;
  const name =
    call.kind === 'read_file' || call.kind === 'edit_file' ? basename(call.target) : call.target;

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-raised text-fg-muted">
          <Icon aria-hidden className="size-4" />
        </span>
        <div className="flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-border bg-surface-raised/50 pr-2 pl-3">
          <ChevronRight aria-hidden className="size-4 shrink-0 text-danger" strokeWidth={2.5} />
          <span className="shrink-0 font-medium text-fg">{meta.verb}</span>
          <span className="min-w-0 flex-1 truncate text-fg-muted" title={call.target}>
            {call.target}
          </span>
          <ToolStatusIcon status={call.status} />
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={contentId}
            aria-label={`${expanded ? 'Hide' : 'View'} ${meta.verb.toLowerCase()} ${name}`}
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'rounded-md px-2 py-1 text-base font-medium transition-colors hover:bg-surface-hover',
              expanded ? 'text-brand' : 'text-fg',
            )}
          >
            {expanded ? 'Hide' : 'View'}
          </button>
        </div>
      </div>
      <div id={contentId} hidden={!expanded} className="mt-2">
        {expanded && <ToolCallCard call={call} />}
      </div>
    </div>
  );
}
