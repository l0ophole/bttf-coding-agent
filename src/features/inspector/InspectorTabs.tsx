import { FilePenLine, FileText, Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { useMemo } from 'react';

import type { ID } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { deriveActivity, getActiveVersion } from '@/lib/conversation';
import { formatTime, truncate, stripMarkdown } from '@/lib/format';
import { useUiStore, type ThemePreference } from '@/stores/uiStore';

import { ToolCallRow } from '../conversation/ToolCallRow';
import {
  ApprovalSelect,
  EnvironmentSelect,
  ModelSelect,
  ToolAccessSelect,
} from '../session/SessionSelects';
import { useTimeTravel } from '../timeline/useTimeTravel';

/** Every tool call in the session, grouped by the message that made it. */
export function ToolsTab() {
  const { conversation, playhead } = useTimeTravel();
  const groups = useMemo(() => {
    if (!conversation) return [];
    return conversation.messages
      .map((message) => ({
        message,
        calls: conversation.toolCalls.filter((call) => call.messageId === message.id),
      }))
      .filter((group) => group.calls.length > 0);
  }, [conversation]);

  if (!groups.length) return <EmptyState title="No tool calls yet" />;

  return (
    <div className="flex flex-col gap-3">
      {groups.map(({ message, calls }) => (
        <Panel key={message.id} as="section" variant="raised" className="p-2.5">
          <h3>
            <button
              type="button"
              onClick={() => playhead.select(message.id)}
              className="mb-2 rounded text-left text-sm text-fg-muted hover:text-fg"
            >
              <span className="font-medium text-brand">Agent</span> ·{' '}
              {formatTime(message.createdAt)} ·{' '}
              {truncate(stripMarkdown(getActiveVersion(message).content) || 'Working…', 40)}
            </button>
          </h3>
          <div className="flex flex-col gap-2">
            {calls.map((call) => (
              <ToolCallRow key={call.id} call={call} />
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

/** Files the agent read or changed, newest activity first. */
export function FilesTab() {
  const { conversation, playhead } = useTimeTravel();
  const files = useMemo(() => {
    const activity = deriveActivity(conversation);
    const edited = new Map(activity.files.map((f) => [f.path, f]));
    const entries = new Map<
      string,
      { path: string; edited: boolean; messageId: ID; detail: string }
    >();
    for (const call of conversation?.toolCalls ?? []) {
      if (call.kind !== 'read_file' && call.kind !== 'edit_file') continue;
      const path = call.target.replace(/^~\/projects\/[^/]+\//, '');
      const change = edited.get(path);
      entries.set(path, {
        path,
        edited: Boolean(change),
        messageId: call.messageId,
        detail: change ? `+${change.additions} −${change.deletions}` : 'Read',
      });
    }
    return [...entries.values()].reverse();
  }, [conversation]);

  if (!files.length) return <EmptyState title="No files touched yet" />;

  return (
    <ul className="flex flex-col gap-1">
      {files.map((file) => (
        <li key={file.path}>
          <button
            type="button"
            onClick={() => playhead.select(file.messageId)}
            className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface-raised/60 px-3 py-2 text-left hover:border-border-accent"
          >
            {file.edited ? (
              <FilePenLine aria-hidden className="size-4 shrink-0 text-evt-edit" />
            ) : (
              <FileText aria-hidden className="size-4 shrink-0 text-evt-read" />
            )}
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{file.path}</span>
            <span className="text-xs text-fg-muted">
              {file.edited ? <span className="sr-only">Edited, </span> : null}
              {file.detail}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light', icon: <Sun /> },
  { value: 'dark' as const, label: 'Dark', icon: <Moon /> },
  { value: 'system' as const, label: 'System', icon: <Monitor /> },
];

/** Appearance and the active session's run settings. */
export function SettingsTab() {
  const { session } = useTimeTravel();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
    <div className="flex flex-col gap-3">
      <Panel
        as="section"
        variant="raised"
        aria-labelledby="settings-appearance"
        className="flex flex-col gap-3 p-3"
      >
        <h3 id="settings-appearance" className="text-md font-semibold text-fg">
          Appearance
        </h3>
        <SegmentedControl<ThemePreference>
          label="Theme"
          value={theme}
          options={THEME_OPTIONS}
          onChange={setTheme}
          className="w-full"
        />
      </Panel>

      {session && (
        <Panel
          as="section"
          variant="raised"
          aria-labelledby="settings-session"
          className="flex flex-col gap-3 p-3"
        >
          <h3 id="settings-session" className="text-md font-semibold text-fg">
            This session
          </h3>
          <ModelSelect session={session} variant="field" visibleLabel />
          <EnvironmentSelect session={session} variant="field" visibleLabel />
          <ApprovalSelect session={session} variant="field" visibleLabel />
          <ToolAccessSelect session={session} variant="field" visibleLabel />
        </Panel>
      )}

      <Panel
        as="section"
        variant="raised"
        aria-labelledby="settings-demo"
        className="flex flex-col gap-2 p-3"
      >
        <h3 id="settings-demo" className="text-md font-semibold text-fg">
          Demo data
        </h3>
        <p className="text-sm text-fg-muted">
          Sessions are simulated in your browser and reset when the page reloads.
        </p>
        <Button
          variant="outline"
          leadingIcon={<RotateCcw />}
          className="self-start"
          onClick={() => {
            localStorage.removeItem('picode:workspace');
            window.location.reload();
          }}
        >
          Reset demo
        </Button>
      </Panel>
    </div>
  );
}
