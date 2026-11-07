import { useRewindSession } from '@/api/hooks/mutations';
import { useConversation } from '@/api/hooks/queries';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { formatTime, pluralize } from '@/lib/format';
import { toast } from '@/stores/toastStore';
import { useUiStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

import { useTimeTravel } from './useTimeTravel';

/** Confirmation for the destructive rewind, offering a non-destructive fork instead. */
export function RewindDialog() {
  const target = useUiStore((s) => s.rewindTarget);
  const setTarget = useUiStore((s) => s.setRewindTarget);
  const setPlayhead = useWorkspaceStore((s) => s.setPlayhead);
  const { data: conversation } = useConversation(target?.sessionId ?? null);
  const rewind = useRewindSession(target?.sessionId ?? '');
  const { forkHere } = useTimeTravel();

  const messages = conversation?.messages ?? [];
  const index = messages.findIndex((m) => m.id === target?.messageId);
  const message = messages[index];
  const removed = index === -1 ? 0 : messages.length - index - 1;

  const close = () => setTarget(null);

  return (
    <ConfirmDialog
      open={Boolean(target && message)}
      title={message ? `Rewind to ${formatTime(message.createdAt)}?` : 'Rewind'}
      description={
        removed > 0
          ? `${pluralize(removed, 'later message')} will be removed from this session. Fork instead to keep them.`
          : 'The agent run in progress will be stopped.'
      }
      confirmLabel="Rewind"
      loading={rewind.isPending}
      onCancel={close}
      extraAction={
        removed > 0 ? (
          <Button
            variant="outline"
            className="mr-auto"
            onClick={() => {
              close();
              forkHere();
            }}
          >
            Fork instead
          </Button>
        ) : undefined
      }
      onConfirm={() => {
        if (!target || !message) return;
        rewind.mutate(target.messageId, {
          onSuccess: () => {
            setPlayhead(target.sessionId, null);
            toast.success('Session rewound', {
              description: `Back to ${formatTime(message.createdAt)}`,
            });
            close();
          },
        });
      }}
    />
  );
}
