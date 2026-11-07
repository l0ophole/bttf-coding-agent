import { Copy, Gauge, Maximize2 } from 'lucide-react';
import { useState } from 'react';

import type { ToolCall } from '@/api/types';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import { toast } from '@/stores/toastStore';

import { outputAsText, TOOL_META } from './toolMeta';
import { ToolStatusIcon } from './ToolStatusIcon';
import { ToolOutput } from './ToolOutput';

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  } catch {
    toast.error("Couldn't copy", { description: 'Clipboard access was blocked by the browser.' });
  }
}

/** Expanded view of a tool call: header, target and output. */
export function ToolCallCard({ call, className }: { call: ToolCall; className?: string }) {
  const [enlarged, setEnlarged] = useState(false);
  const meta = TOOL_META[call.kind];
  const target = call.target.replace(/^~/, '');

  return (
    <div
      className={cn(
        'rounded-xl border border-border-strong/70 bg-surface-raised/60 px-3 pt-2.5 pb-3',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Gauge aria-hidden className="mt-1 size-6 shrink-0 text-fg-muted" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-md">
            <span className="font-semibold text-brand">Tool Call</span>
            <span className="font-medium text-fg">{call.title}</span>
            <time dateTime={call.startedAt} className="text-sm text-fg-subtle">
              {formatTime(call.startedAt)}
            </time>
            <ToolStatusIcon status={call.status} />
          </p>
          <p className="truncate text-base text-fg-muted">
            {meta.targetLabel}: <span className="text-fg">{target}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            label="Copy output"
            icon={<Copy />}
            size="sm"
            disabled={!call.output}
            onClick={() => void copy(outputAsText(call))}
          />
          <IconButton
            label="Open output in a larger view"
            icon={<Maximize2 />}
            size="sm"
            disabled={!call.output}
            onClick={() => setEnlarged(true)}
          />
        </div>
      </div>
      <div className="mt-2">
        <ToolOutput call={call} />
      </div>
      <Dialog
        open={enlarged}
        onClose={() => setEnlarged(false)}
        title={`${call.title}: ${call.target}`}
        className="w-[min(960px,calc(100vw-32px))]"
      >
        <div className="p-4">
          <ToolOutput call={call} maxLines={28} />
        </div>
      </Dialog>
    </div>
  );
}
