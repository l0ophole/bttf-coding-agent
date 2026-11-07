import {
  Brain,
  Bug,
  FilePenLine,
  FileText,
  FlaskConical,
  GitBranch,
  MessageSquareText,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react';

import type { TimelineCategory } from '@/lib/timeline';

/** Static class names per category (Tailwind needs them spelled out). */
export const CATEGORY_STYLE: Record<
  TimelineCategory,
  { bar: string; text: string; icon: LucideIcon }
> = {
  message: { bar: 'bg-evt-message', text: 'text-evt-message', icon: MessageSquareText },
  reasoning: { bar: 'bg-evt-reasoning', text: 'text-evt-reasoning', icon: Brain },
  read: { bar: 'bg-evt-read', text: 'text-evt-read', icon: FileText },
  edit: { bar: 'bg-evt-edit', text: 'text-evt-edit', icon: FilePenLine },
  command: { bar: 'bg-evt-command', text: 'text-evt-command', icon: SquareTerminal },
  test: { bar: 'bg-evt-test', text: 'text-evt-test', icon: FlaskConical },
  git: { bar: 'bg-evt-git', text: 'text-evt-git', icon: GitBranch },
  error: { bar: 'bg-evt-error', text: 'text-evt-error', icon: Bug },
};
