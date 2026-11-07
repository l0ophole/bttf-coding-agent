import {
  FilePenLine,
  FileText,
  FlaskConical,
  GitBranch,
  Search,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react';

import type { ToolCall, ToolKind } from '@/api/types';

export const TOOL_META: Record<ToolKind, { verb: string; icon: LucideIcon; targetLabel: string }> =
  {
    read_file: { verb: 'Read', icon: FileText, targetLabel: 'Path' },
    edit_file: { verb: 'Edit', icon: FilePenLine, targetLabel: 'Path' },
    run_command: { verb: 'Run', icon: SquareTerminal, targetLabel: 'Command' },
    run_tests: { verb: 'Test', icon: FlaskConical, targetLabel: 'Command' },
    search: { verb: 'Search', icon: Search, targetLabel: 'Query' },
    git: { verb: 'Git', icon: GitBranch, targetLabel: 'Command' },
  };

/** Plain-text version of a tool call's output, for copying. */
export function outputAsText(call: ToolCall): string {
  const output = call.output;
  if (!output) return '';
  switch (output.kind) {
    case 'code':
      return output.code;
    case 'text':
      return output.text;
    case 'diff':
      return output.patch;
    case 'tests':
      return [
        output.summary,
        ...output.results.map(
          (r) => `${r.status.toUpperCase()} ${r.file}::${r.name} (${r.durationMs}ms)`,
        ),
      ].join('\n');
  }
}
