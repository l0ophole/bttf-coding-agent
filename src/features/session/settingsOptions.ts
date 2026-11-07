import type { ApprovalMode, ToolAccess } from '@/api/types';
import type { SelectOption } from '@/components/ui/Select';

export const APPROVAL_OPTIONS: SelectOption<ApprovalMode>[] = [
  { value: 'auto', label: 'Auto-approve', description: 'Run allowed tools without asking' },
  {
    value: 'ask-edits',
    label: 'Ask before edits',
    description: 'Confirm file changes and commands',
  },
  { value: 'ask-always', label: 'Ask every time', description: 'Confirm every tool call' },
];

export const TOOL_ACCESS_OPTIONS: SelectOption<ToolAccess>[] = [
  { value: 'safe', label: 'Safe', description: 'Read files, run tests and read-only commands' },
  {
    value: 'workspace',
    label: 'Workspace',
    description: 'Edit files and run commands in the project',
  },
  { value: 'full', label: 'Full', description: 'Unrestricted, including network access' },
];
