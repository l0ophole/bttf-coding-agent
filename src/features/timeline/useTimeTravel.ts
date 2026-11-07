import { useForkSession } from '@/api/hooks/mutations';
import { formatTime } from '@/lib/format';
import { toast } from '@/stores/toastStore';
import { useUiStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

import { useActiveSession, usePlayhead } from '../session/useActiveSession';

/** Playhead plus the fork / rewind actions that act on it. */
export function useTimeTravel() {
  const { sessionId, session, conversation } = useActiveSession();
  const playhead = usePlayhead(sessionId, conversation);
  const fork = useForkSession(sessionId ?? '');
  const openSession = useWorkspaceStore((s) => s.openSession);
  const setRewindTarget = useUiStore((s) => s.setRewindTarget);

  const target = playhead.message;
  const isThinking = conversation?.messages.some((m) => m.status === 'thinking') ?? false;
  const atLatest = playhead.index === playhead.messages.length - 1;

  const forkHere = () => {
    if (!sessionId || !target) return;
    fork.mutate(target.id, {
      onSuccess: (forked) => {
        openSession(forked.id);
        toast.success('Forked session', {
          description: `${forked.title}, from ${formatTime(target.createdAt)}`,
        });
      },
    });
  };

  const rewindHere = () => {
    if (!sessionId || !target) return;
    if (atLatest && !isThinking) {
      toast.info('Nothing to rewind', {
        description: 'The playhead is already at the latest message.',
      });
      return;
    }
    setRewindTarget({ sessionId, messageId: target.id });
  };

  return {
    session,
    conversation,
    playhead,
    forkHere,
    forking: fork.isPending,
    rewindHere,
    canAct: Boolean(sessionId && target),
  };
}
