import { Dialog } from '@/components/ui/Dialog';
import { Kbd } from '@/components/ui/Kbd';
import { useUiStore } from '@/stores/uiStore';

const SHORTCUTS: Array<{ keys: string[]; action: string }> = [
  { keys: ['Ctrl', 'K'], action: 'Jump to a message or tool call' },
  { keys: ['Alt', '↑'], action: 'Previous message' },
  { keys: ['Alt', '↓'], action: 'Next message' },
  { keys: ['Enter'], action: 'Send message' },
  { keys: ['Shift', 'Enter'], action: 'New line in the message box' },
  { keys: ['/'], action: 'Commands (at the start of a message)' },
  { keys: ['?'], action: 'Show this help' },
];

export function HelpDialog() {
  const open = useUiStore((s) => s.helpOpen);
  const setOpen = useUiStore((s) => s.setHelpOpen);
  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Help"
      description="Every message and tool call lands on the timeline. Select any point to inspect it, rewind the session to it, or fork a new session from it."
    >
      <div className="p-4">
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-fg-muted uppercase">
          Keyboard shortcuts
        </h3>
        <dl className="divide-y divide-border rounded-lg border border-border">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.action}
              className="flex items-center justify-between gap-4 px-3 py-2"
            >
              <dt className="text-base text-fg">{shortcut.action}</dt>
              <dd className="flex shrink-0 gap-1">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-fg-muted">On macOS use ⌘ instead of Ctrl.</p>
      </div>
    </Dialog>
  );
}
