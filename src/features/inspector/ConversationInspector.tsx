import {
  Bold,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Italic,
  Link,
  List,
  ListOrdered,
  ScanSearch,
} from 'lucide-react';
import { useId, useRef, useState, type ReactNode } from 'react';

import { useSaveMessageVersion, useSetActiveVersion } from '@/api/hooks/mutations';
import type { Conversation, Message, ToolCall } from '@/api/types';
import { AgentAvatar, UserAvatar } from '@/components/brand/Avatars';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/cn';
import { getActiveVersion, toolCallsForMessage } from '@/lib/conversation';
import { formatDuration, formatNumber, formatTime } from '@/lib/format';
import { applyFormat, type FormatKind } from '@/lib/textEditing';
import { toast } from '@/stores/toastStore';

import { TOOL_META } from '../conversation/toolMeta';
import { ToolStatusIcon } from '../conversation/ToolStatusIcon';
import { ToolOutput } from '../conversation/ToolOutput';
import { useTimeTravel } from '../timeline/useTimeTravel';

function InspectorSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const contentId = useId();
  return (
    <section className="rounded-lg border border-border bg-surface/60">
      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
        <h3 className="flex-1 text-md font-semibold text-brand">{title}</h3>
        <IconButton
          label={`${open ? 'Collapse' : 'Expand'} ${title}`}
          icon={<ChevronDown className={cn('transition-transform', !open && '-rotate-90')} />}
          size="xs"
          variant="subtle"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen(!open)}
        />
      </div>
      <div id={contentId} hidden={!open} className="px-3 pb-3">
        {children}
      </div>
    </section>
  );
}

function MessageDetails({ message }: { message: Message }) {
  const thinking = message.status === 'thinking';
  const now = useNow(thinking);
  const start = Date.parse(message.createdAt);
  const end = message.completedAt ? Date.parse(message.completedAt) : now;
  const isAgent = message.role === 'assistant';
  return (
    <dl className="grid grid-cols-[76px_1fr] items-center gap-y-1.5 text-base">
      <dt className="text-fg-muted">Role:</dt>
      <dd className="flex items-center gap-2 text-fg">
        {isAgent ? (
          <AgentAvatar size="sm" className="rounded-md" />
        ) : (
          <UserAvatar size="sm" className="rounded-md" />
        )}
        {isAgent ? 'assistant' : 'user'}
      </dd>
      <dt className="text-fg-muted">Time:</dt>
      <dd className="text-fg">
        {formatTime(message.createdAt)}
        {isAgent && <span className="text-fg-muted"> ({formatDuration(end - start)})</span>}
      </dd>
      <dt className="text-fg-muted">Tokens:</dt>
      <dd className="text-fg">
        {message.tokens === null ? '—' : formatNumber(message.tokens)}{' '}
        <span className="text-fg-muted">(total)</span>
      </dd>
    </dl>
  );
}

const FORMAT_BUTTONS: Array<{
  kind: FormatKind;
  label: string;
  icon: ReactNode;
  divider?: boolean;
}> = [
  { kind: 'bold', label: 'Bold', icon: <Bold /> },
  { kind: 'italic', label: 'Italic', icon: <Italic />, divider: true },
  { kind: 'link', label: 'Link', icon: <Link /> },
  { kind: 'bullets', label: 'Bulleted list', icon: <List /> },
  { kind: 'numbers', label: 'Numbered list', icon: <ListOrdered /> },
];

function MessageEditor({
  message,
  field,
  initial,
}: {
  message: Message;
  field: 'content' | 'reasoning';
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  const save = useSaveMessageVersion();
  const id = useId();
  const dirty = value !== initial;

  // The agent may still be writing this message. Follow its text until the user edits.
  if (initial !== baseline) {
    setBaseline(initial);
    if (value === baseline) setValue(initial);
  }

  const format = (kind: FormatKind) => {
    const textarea = ref.current;
    if (!textarea) return;
    const edit = applyFormat(value, textarea.selectionStart, textarea.selectionEnd, kind);
    setValue(edit.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  };

  return (
    <div className="overflow-hidden rounded-b-lg border border-t-0 border-border-strong bg-surface-sunken">
      <label htmlFor={id} className="sr-only">
        {field === 'content' ? 'Message content' : 'Message reasoning'} (Markdown)
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={5}
        spellCheck
        className="block w-full resize-y bg-transparent px-3 py-2.5 font-mono text-[12px] leading-[18px] text-fg focus-visible:outline-offset-[-2px]"
      />
      <div className="flex items-center gap-0.5 border-t border-border px-2 py-1.5">
        <div role="group" aria-label="Formatting" className="flex items-center gap-0.5">
          {FORMAT_BUTTONS.map((button) => (
            <span key={button.kind} className="flex items-center">
              <IconButton
                label={button.label}
                icon={button.icon}
                size="sm"
                onClick={() => format(button.kind)}
              />
              {button.divider && <span aria-hidden className="mx-1 h-4 w-px bg-border" />}
            </span>
          ))}
        </div>
        <Button
          variant="soft"
          size="sm"
          className="ml-auto"
          disabled={!dirty || !value.trim()}
          loading={save.isPending}
          onClick={() =>
            save.mutate(
              { messageId: message.id, input: { [field]: value } },
              { onSuccess: () => toast.success('Saved as a new version') },
            )
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function EditMessage({ message, toolCalls }: { message: Message; toolCalls: ToolCall[] }) {
  const [tab, setTab] = useState<'content' | 'reasoning' | 'tools'>('content');
  const version = getActiveVersion(message);
  return (
    <Tabs value={tab} onValueChange={setTab} variant="boxed">
      <TabList aria-label="Message fields">
        <Tab value="content">Content</Tab>
        <Tab value="reasoning">Reasoning</Tab>
        <Tab value="tools">Tools</Tab>
      </TabList>
      <TabPanel value="content">
        <MessageEditor
          key={`${version.id}-content`}
          message={message}
          field="content"
          initial={version.content}
        />
      </TabPanel>
      <TabPanel value="reasoning">
        {version.reasoning !== null ? (
          <MessageEditor
            key={`${version.id}-reasoning`}
            message={message}
            field="reasoning"
            initial={version.reasoning}
          />
        ) : (
          <p className="rounded-b-lg border border-t-0 border-border-strong bg-surface-sunken p-3 text-sm text-fg-muted">
            No reasoning recorded for this message.
          </p>
        )}
      </TabPanel>
      <TabPanel value="tools">
        <div className="rounded-b-lg border border-t-0 border-border-strong bg-surface-sunken p-3">
          {toolCalls.length ? (
            <pre className="max-h-48 overflow-auto font-mono text-xs leading-5 text-fg">
              {JSON.stringify(
                toolCalls.map((call) => ({
                  tool: call.kind,
                  target: call.target,
                  status: call.status,
                })),
                null,
                2,
              )}
            </pre>
          ) : (
            <p className="text-sm text-fg-muted">This message made no tool calls.</p>
          )}
        </div>
      </TabPanel>
    </Tabs>
  );
}

function MessageToolCall({ call }: { call: ToolCall }) {
  const [open, setOpen] = useState(false);
  const outputId = useId();
  const Icon = TOOL_META[call.kind].icon;
  return (
    <li className="rounded-lg border border-border bg-surface-raised/60 p-2.5">
      <div className="flex gap-2.5">
        <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-fg-muted" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2.5">
            <span className="text-md font-semibold text-brand">{call.title}</span>
            <time dateTime={call.startedAt} className="text-sm text-fg-subtle">
              {formatTime(call.startedAt)}
            </time>
            <ToolStatusIcon status={call.status} />
          </p>
          <p className="truncate text-sm text-fg-muted" title={call.target}>
            {TOOL_META[call.kind].targetLabel}: {call.target.replace(/^~/, '')}
          </p>
          <Button
            variant="outline"
            size="xs"
            className="mt-1.5"
            aria-expanded={open}
            aria-controls={outputId}
            trailingIcon={
              <ChevronDown className={cn('transition-transform', open && 'rotate-180')} />
            }
            onClick={() => setOpen(!open)}
          >
            {open ? 'Hide Output' : 'View Output'}
          </Button>
        </div>
      </div>
      <div id={outputId} hidden={!open} className="mt-2">
        {open && <ToolOutput call={call} maxLines={6} />}
      </div>
    </li>
  );
}

function EditHistory({ message }: { message: Message }) {
  const setActive = useSetActiveVersion();
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">Active version</legend>
      <ol className="relative flex flex-col gap-1">
        {message.versions.length > 1 && (
          <span aria-hidden className="absolute top-4 bottom-4 left-[11px] w-px bg-border-strong" />
        )}
        {message.versions.map((version) => {
          const checked = version.id === message.activeVersionId;
          const inputId = `${name}-${version.id}`;
          return (
            <li key={version.id} className="relative">
              <input
                type="radio"
                id={inputId}
                name={name}
                checked={checked}
                onChange={() =>
                  setActive.mutate(
                    { message, versionId: version.id },
                    {
                      onSuccess: () => toast.info(`Showing ${version.label.toLowerCase()} version`),
                    },
                  )
                }
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className="flex cursor-pointer items-center gap-3 rounded-md py-1 pr-1 pl-1 text-base peer-focus-visible:outline-2 peer-focus-visible:outline-ring hover:bg-surface-hover"
              >
                <span
                  aria-hidden
                  className={cn(
                    'relative z-10 flex size-4 items-center justify-center rounded-full border-2 bg-surface',
                    checked ? 'border-brand' : 'border-fg-subtle',
                  )}
                >
                  {checked && <span className="size-1.5 rounded-full bg-brand" />}
                </span>
                <span className={cn('flex-1', checked ? 'font-medium text-fg' : 'text-fg-muted')}>
                  {version.label}
                  {checked && <span className="sr-only"> (current)</span>}
                </span>
                <time dateTime={version.createdAt} className="text-sm text-link">
                  {formatTime(version.createdAt)}
                </time>
              </label>
            </li>
          );
        })}
      </ol>
    </fieldset>
  );
}

function VersionPager({ message }: { message: Message }) {
  const setActive = useSetActiveVersion();
  const index = message.versions.findIndex((v) => v.id === message.activeVersionId);
  const count = message.versions.length;
  const next = message.versions[(index + 1) % count];
  return (
    <div className="flex items-center gap-1">
      <span className="min-w-8 text-center text-base text-fg-muted tabular-nums" aria-hidden>
        {index + 1}/{count}
      </span>
      <span className="sr-only">
        Version {index + 1} of {count}
      </span>
      <IconButton
        label="Show next version"
        icon={<ChevronRight />}
        variant="outline"
        size="md"
        disabled={count < 2 || setActive.isPending}
        onClick={() => next && setActive.mutate({ message, versionId: next.id })}
      />
    </div>
  );
}

/** Details, editing, tool calls and version history of the selected message. */
export function ConversationInspector() {
  const { conversation, playhead } = useTimeTravel();
  const titleId = useId();
  const message = playhead.message;

  return (
    <Panel as="section" variant="raised" aria-labelledby={titleId}>
      <PanelHeader id={titleId} icon={<ScanSearch />} title="Conversation Inspector" />
      {!message || !conversation ? (
        <EmptyState
          title="Nothing to inspect"
          description="Messages appear here once the conversation starts."
        />
      ) : (
        <InspectorBody
          message={message}
          conversation={conversation}
          index={playhead.index}
          count={playhead.messages.length}
          step={playhead.step}
        />
      )}
    </Panel>
  );
}

function InspectorBody({
  message,
  conversation,
  index,
  count,
  step,
}: {
  message: Message;
  conversation: Conversation;
  index: number;
  count: number;
  step: (delta: number) => void;
}) {
  const toolCalls = toolCallsForMessage(conversation, message.id);
  return (
    <>
      <div className="flex items-center gap-1.5 px-3 pb-2">
        <p className="flex-1 text-md text-brand" aria-live="polite">
          Message {index + 1} of {count}
        </p>
        <IconButton
          label="Previous message"
          icon={<ChevronLeft />}
          variant="outline"
          size="md"
          disabled={index <= 0}
          onClick={() => step(-1)}
        />
        <IconButton
          label="Next message"
          icon={<ChevronRight />}
          variant="outline"
          size="md"
          disabled={index >= count - 1}
          onClick={() => step(1)}
        />
        <VersionPager message={message} />
      </div>
      <div className="flex flex-col gap-2 px-2 pb-2">
        <InspectorSection title="Message Details">
          <MessageDetails message={message} />
        </InspectorSection>
        <InspectorSection title="Edit Message">
          <EditMessage key={message.id} message={message} toolCalls={toolCalls} />
        </InspectorSection>
        <InspectorSection title="Tool Calls">
          {toolCalls.length ? (
            <ul className="flex flex-col gap-2">
              {toolCalls.map((call) => (
                <MessageToolCall key={call.id} call={call} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted">No tool calls in this message.</p>
          )}
        </InspectorSection>
        <InspectorSection title="Edit History">
          <EditHistory message={message} />
        </InspectorSection>
      </div>
    </>
  );
}
