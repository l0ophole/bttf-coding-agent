import { CircleCheck, CircleMinus, CircleX } from 'lucide-react';

import type { ToolCall, ToolOutput as ToolOutputData } from '@/api/types';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import { languageFromPath } from '@/lib/highlight';

function DiffView({
  output,
  label,
  maxLines,
}: {
  output: Extract<ToolOutputData, { kind: 'diff' }>;
  label: string;
  maxLines: number;
}) {
  const lines = output.patch.split('\n');
  return (
    <div>
      <p className="mb-1.5 text-sm text-fg-muted">
        <span className="font-medium text-success">+{output.additions}</span>{' '}
        <span className="font-medium text-danger">−{output.deletions}</span>{' '}
        <span className="sr-only">
          {output.additions} lines added, {output.deletions} removed,
        </span>
        <span className="capitalize">{output.changeType}</span>
      </p>
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        style={{ maxHeight: maxLines * 19 + 16 }}
        className="overflow-auto rounded-lg border border-border bg-surface-sunken py-2 focus-visible:outline-offset-0"
      >
        <pre className="min-w-max font-mono text-[12px] leading-[19px]">
          {lines.map((line, index) => {
            const kind = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'del' : 'ctx';
            return (
              <span
                key={index}
                className={cn(
                  'block px-4',
                  kind === 'add' && 'bg-success-soft text-success',
                  kind === 'del' && 'bg-danger-soft text-danger',
                  kind === 'ctx' && 'text-fg-muted',
                )}
              >
                <span className="sr-only">
                  {kind === 'add' ? 'Added: ' : kind === 'del' ? 'Removed: ' : ''}
                </span>
                {line || ' '}
              </span>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

function TestsView({ output }: { output: Extract<ToolOutputData, { kind: 'tests' }> }) {
  const failed = output.results.some((r) => r.status === 'failed');
  return (
    <div className="rounded-lg border border-border bg-surface-sunken p-2">
      <p
        className={cn('px-1 pb-1.5 text-base font-medium', failed ? 'text-danger' : 'text-success')}
      >
        {output.summary}
      </p>
      <ul className="max-h-40 space-y-0.5 overflow-y-auto">
        {output.results.map((result) => (
          <li key={result.id} className="flex items-center gap-2 rounded px-1 py-0.5 text-sm">
            {result.status === 'passed' && (
              <CircleCheck aria-hidden className="size-3.5 text-success" />
            )}
            {result.status === 'failed' && <CircleX aria-hidden className="size-3.5 text-danger" />}
            {result.status === 'skipped' && (
              <CircleMinus aria-hidden className="size-3.5 text-fg-subtle" />
            )}
            <span className="sr-only">{result.status}</span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{result.name}</span>
            <span className="text-xs text-fg-subtle">{result.durationMs} ms</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ToolOutputProps {
  call: ToolCall;
  maxLines?: number;
}

/** Renders a tool call's result according to its kind. */
export function ToolOutput({ call, maxLines = 5 }: ToolOutputProps) {
  const label = `${call.title} output: ${call.target}`;
  if (!call.output) {
    return call.status === 'running' ? (
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <Spinner /> Running…
      </p>
    ) : (
      <p className="text-sm text-fg-subtle">No output.</p>
    );
  }
  const output = call.output;
  switch (output.kind) {
    case 'code':
      return (
        <CodeBlock
          code={output.code}
          language={output.language || languageFromPath(call.target)}
          startLine={output.startLine}
          highlightLines={output.highlightLines}
          label={label}
          maxLines={maxLines}
        />
      );
    case 'text':
      return <CodeBlock code={output.text} language="text" label={label} maxLines={maxLines} />;
    case 'diff':
      return <DiffView output={output} label={label} maxLines={maxLines} />;
    case 'tests':
      return <TestsView output={output} />;
  }
}
