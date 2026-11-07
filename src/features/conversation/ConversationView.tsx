import { CircleAlert, MessagesSquare, SquarePlus } from 'lucide-react';

import { useSessions } from '@/api/hooks/queries';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useHotkey } from '@/hooks/useHotkey';

import { useActiveSession, usePlayhead } from '../session/useActiveSession';
import { useWorkspaceActions } from '../shell/useWorkspaceActions';
import { Composer } from './Composer';
import { GoalHeader } from './GoalHeader';
import { MessageList } from './MessageList';

function NoSession() {
  const actions = useWorkspaceActions();
  const { data: sessions = [] } = useSessions();
  return (
    <EmptyState
      className="flex-1"
      icon={<MessagesSquare />}
      title="No session open"
      description="Start a new session, or reopen one from the sidebar."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="primary"
            leadingIcon={<SquarePlus />}
            onClick={() => actions.newSession()}
          >
            New session
          </Button>
          {sessions[0] && (
            <Button variant="outline" onClick={() => actions.openSession(sessions[0]!.id)}>
              Open “{sessions[0].title}”
            </Button>
          )}
        </div>
      }
    />
  );
}

function LoadingConversation() {
  return (
    <div className="flex flex-1 flex-col gap-3" aria-busy="true" aria-label="Loading conversation">
      <Skeleton className="h-16" />
      <Skeleton className="h-24" />
      <Skeleton className="h-64" />
      <div className="flex-1" />
      <Skeleton className="h-20" />
    </div>
  );
}

/** Announces agent progress to screen readers without reading every UI update. */
function AgentAnnouncer({ thinking }: { thinking: boolean }) {
  return (
    <p role="status" className="sr-only">
      {thinking ? 'The agent is working.' : ''}
    </p>
  );
}

/** Main column: goal header, messages and composer for the active session. */
export function ConversationView() {
  const { sessionId, session, conversation, isLoading, error, refetch } = useActiveSession();
  const playhead = usePlayhead(sessionId, conversation);
  const thinking = conversation?.messages.some((m) => m.status === 'thinking') ?? false;

  useHotkey('ArrowUp', () => playhead.step(-1), { alt: true, allowInInputs: true });
  useHotkey('ArrowDown', () => playhead.step(1), { alt: true, allowInInputs: true });

  if (!sessionId) return <NoSession />;
  if (isLoading) return <LoadingConversation />;
  if (error || !session) {
    return (
      <EmptyState
        className="flex-1"
        icon={<CircleAlert className="text-danger" />}
        title="Couldn't load this session"
        description={error instanceof Error ? error.message : 'The session may have been deleted.'}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <>
      <GoalHeader session={session} />
      {conversation && conversation.messages.length > 0 ? (
        <MessageList conversation={conversation} playhead={playhead} />
      ) : (
        <EmptyState
          className="min-h-0 flex-1"
          icon={<MessagesSquare />}
          title="Start the conversation"
          description="Describe a task, ask a question, or type / to see commands."
        />
      )}
      <AgentAnnouncer thinking={thinking} />
      <Composer session={session} conversation={conversation} />
    </>
  );
}
