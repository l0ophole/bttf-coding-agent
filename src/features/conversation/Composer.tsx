import {
  CodeXml,
  FolderOpen,
  Paperclip,
  Plus,
  SendHorizontal,
  SquareTerminal,
  X,
} from 'lucide-react';
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';

import { useSendMessage } from '@/api/hooks/mutations';
import type { Conversation, Session } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Menu } from '@/components/ui/Menu';
import { RichText } from '@/components/ui/RichText';
import { cn } from '@/lib/cn';
import { deriveActivity } from '@/lib/conversation';
import { insertText, wrapSelection, type TextEdit } from '@/lib/textEditing';
import { toast } from '@/stores/toastStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

import { useTimeTravel } from '../timeline/useTimeTravel';
import { SLASH_COMMANDS, type SlashCommand } from './commands';

function MarkdownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M6.5 15V9l2.5 3 2.5-3v6M15.5 9v6m0 0-2-2m2 2 2-2" />
    </svg>
  );
}

const MAX_TEXTAREA_HEIGHT = 168;

interface ComposerProps {
  session: Session;
  conversation: Conversation | undefined;
}

/** Message box with slash commands, formatting helpers, attachments and preview. */
export function Composer({ session, conversation }: ComposerProps) {
  const draft = useWorkspaceStore((s) => s.drafts[session.id] ?? '');
  const setDraft = useWorkspaceStore((s) => s.setDraft);
  const send = useSendMessage(session.id);
  const timeTravel = useTimeTravel();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [activeCommand, setActiveCommand] = useState(0);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const id = useId();
  const listId = `${id}-commands`;
  const inputId = `${id}-input`;
  const hintId = `${id}-hint`;

  const slashQuery = /^\/(\w*)$/.exec(draft)?.[1];
  const commands = useMemo(
    () =>
      slashQuery === undefined
        ? []
        : SLASH_COMMANDS.filter((c) => c.name.startsWith(slashQuery.toLowerCase())),
    [slashQuery],
  );
  const showCommands = commands.length > 0 && dismissedFor !== draft;
  const activeIndex = Math.min(activeCommand, Math.max(0, commands.length - 1));

  const files = useMemo(() => {
    const activity = deriveActivity(conversation);
    const paths = new Set<string>(activity.files.map((f) => f.path));
    conversation?.toolCalls
      .filter((c) => c.kind === 'read_file')
      .forEach((c) => paths.add(c.target.replace(/^~\/projects\/[^/]+\//, '')));
    return [...paths].slice(0, 8);
  }, [conversation]);

  // Grow the textarea with its content, up to a limit.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [draft, preview]);

  // Looked up by id (not ref) because these helpers also run from menu callbacks.
  const getTextarea = () => document.getElementById(inputId) as HTMLTextAreaElement | null;

  const applyEdit = (edit: TextEdit) => {
    setDraft(session.id, edit.value);
    requestAnimationFrame(() => {
      const textarea = getTextarea();
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  };

  const selection = (): [number, number] => {
    const textarea = getTextarea();
    return textarea
      ? [textarea.selectionStart, textarea.selectionEnd]
      : [draft.length, draft.length];
  };

  const runCommand = (command: SlashCommand) => {
    if (command.action === 'fork') {
      setDraft(session.id, '');
      timeTravel.forkHere();
      return;
    }
    if (command.action === 'rewind') {
      setDraft(session.id, '');
      timeTravel.rewindHere();
      return;
    }
    applyEdit(insertText('', 0, 0, command.text ?? ''));
  };

  const submit = () => {
    const text = [draft.trim(), attachments.length ? `Attached: ${attachments.join(', ')}` : '']
      .filter(Boolean)
      .join('\n\n');
    if (!text || send.isPending) return;
    const previousDraft = draft;
    const previousAttachments = attachments;
    setDraft(session.id, '');
    setAttachments([]);
    setPreview(false);
    send.mutate(text, {
      onError: () => {
        setDraft(session.id, previousDraft);
        setAttachments(previousAttachments);
      },
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (showCommands) {
      const command = commands[activeIndex];
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveCommand((activeIndex + 1) % commands.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveCommand((activeIndex - 1 + commands.length) % commands.length);
        return;
      }
      if ((event.key === 'Enter' || event.key === 'Tab') && command) {
        event.preventDefault();
        runCommand(command);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setDismissedFor(draft);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(event.target.files ?? []).map((file) => file.name);
    if (names.length) {
      setAttachments((current) => [...new Set([...current, ...names])]);
      toast.info(names.length === 1 ? `Attached ${names[0]}` : `Attached ${names.length} files`);
    }
    event.target.value = '';
  };

  const canSend = Boolean(draft.trim() || attachments.length) && !send.isPending;

  return (
    <form
      aria-label="Message the agent"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="relative shrink-0 rounded-xl border border-border-accent/60 bg-surface-raised/60 px-3 pt-2 pb-1.5 shadow-[0_0_24px_-14px_var(--glow)] focus-within:border-border-accent"
    >
      {showCommands && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Commands"
          className="absolute right-3 bottom-full left-3 z-30 mb-2 rounded-lg border border-border-strong bg-surface-overlay p-1 shadow-popover"
        >
          {commands.map((command, index) => (
            // Options are driven from the textarea via aria-activedescendant; clicks are a mouse shortcut.
            // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events
            <li
              key={command.name}
              id={`${id}-cmd-${command.name}`}
              role="option"
              aria-selected={index === activeIndex}
              onPointerMove={() => setActiveCommand(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => runCommand(command)}
              className={cn(
                'flex items-baseline gap-3 rounded-md px-2 py-1.5',
                index === activeIndex ? 'bg-surface-hover' : '',
              )}
            >
              <span className="font-mono text-sm text-brand">/{command.name}</span>
              <span className="text-sm text-fg-muted">{command.description}</span>
            </li>
          ))}
        </ul>
      )}

      {attachments.length > 0 && (
        <ul aria-label="Attachments" className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((name) => (
            <li
              key={name}
              className="flex items-center gap-1 rounded-md border border-border-strong bg-surface-sunken py-0.5 pr-0.5 pl-2 text-sm text-fg"
            >
              <Paperclip aria-hidden className="size-3.5 text-fg-muted" />
              {name}
              <button
                type="button"
                aria-label={`Remove ${name}`}
                onClick={() => setAttachments((current) => current.filter((n) => n !== name))}
                className="rounded p-0.5 text-fg-subtle hover:text-fg"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {preview ? (
        <div
          role="region"
          aria-label="Message preview"
          className="min-h-7 rounded-md px-1 py-0.5 text-md text-fg"
        >
          {draft.trim() ? (
            <RichText text={draft} />
          ) : (
            <p className="text-fg-subtle">Nothing to preview.</p>
          )}
        </div>
      ) : (
        <>
          <label htmlFor={inputId} className="sr-only">
            Message
          </label>
          <textarea
            ref={textareaRef}
            id={inputId}
            rows={1}
            value={draft}
            placeholder="Type a message, or use / for commands..."
            aria-describedby={hintId}
            aria-autocomplete="list"
            aria-controls={showCommands ? listId : undefined}
            aria-activedescendant={
              showCommands && commands[activeIndex]
                ? `${id}-cmd-${commands[activeIndex].name}`
                : undefined
            }
            onChange={(event) => {
              setDraft(session.id, event.target.value);
              setActiveCommand(0);
            }}
            onKeyDown={onKeyDown}
            className="block min-h-7 w-full resize-none bg-transparent px-1 py-0.5 text-md text-fg placeholder:text-fg-subtle focus-visible:outline-none"
          />
        </>
      )}
      <p id={hintId} className="sr-only">
        Press Enter to send and Shift+Enter for a new line. Type / for commands.
      </p>

      <div className="mt-1 flex items-center gap-1">
        <input ref={fileInputRef} type="file" multiple hidden onChange={onFiles} tabIndex={-1} />
        <IconButton
          label="Attach files"
          icon={<Plus />}
          size="md"
          onClick={() => fileInputRef.current?.click()}
        />
        <IconButton
          label="Insert code block"
          icon={<CodeXml />}
          size="md"
          disabled={preview}
          onClick={() => {
            const [start, end] = selection();
            applyEdit(wrapSelection(draft, start, end, '```\n', '\n```', 'code'));
          }}
        />
        <Menu
          label="Reference a file"
          entries={
            files.length
              ? files.map((path) => ({
                  id: path,
                  label: path,
                  onSelect: () => {
                    const [start, end] = selection();
                    applyEdit(insertText(draft, start, end, `\`${path}\` `));
                  },
                }))
              : [
                  {
                    id: 'none',
                    label: 'No files in this session yet',
                    disabled: true,
                    onSelect: () => {},
                  },
                ]
          }
          renderTrigger={(props) => (
            <IconButton
              {...props}
              label="Reference a file"
              icon={<FolderOpen />}
              size="md"
              disabled={preview}
            />
          )}
        />
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        <IconButton
          label="Ask the agent to run a command"
          icon={<SquareTerminal />}
          size="md"
          disabled={preview}
          onClick={() => {
            const [start, end] = selection();
            const text = 'Run `command`';
            applyEdit(insertText(draft, start, end, text, [5, 12]));
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <IconButton
            label={preview ? 'Edit message' : 'Preview formatting'}
            icon={<MarkdownIcon />}
            size="md"
            variant="outline"
            pressed={preview}
            onClick={() => setPreview(!preview)}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!canSend}
            loading={send.isPending}
            leadingIcon={<SendHorizontal />}
            className="min-w-24"
          >
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}
