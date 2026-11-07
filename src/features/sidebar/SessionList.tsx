import { useSessions } from '@/api/hooks/queries';
import type { ID } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { MetaList } from '@/components/ui/MetaList';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/cn';
import { formatDuration, formatNumber } from '@/lib/format';
import { useWorkspaceStore } from '@/stores/workspaceStore';

import { SessionStatusIcon } from '../session/SessionStatusIcon';
import { SESSION_STATUS, sessionElapsedMs } from '../session/status';

export function SessionList({ onOpen }: { onOpen: (id: ID) => void }) {
  const { data: sessions, isPending, isError, refetch } = useSessions();
  const activeId = useWorkspaceStore((s) => s.activeSessionId);
  const now = useNow(sessions?.some((s) => s.status === 'working') ?? false);

  if (isPending) {
    return (
      <div className="flex flex-col gap-2 p-1" aria-busy="true" aria-label="Loading sessions">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex items-center justify-between gap-2 px-2 py-1 text-sm text-danger"
        role="alert"
      >
        Couldn't load sessions.
        <Button size="xs" variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {sessions.map((session) => {
        const active = session.id === activeId;
        const status = SESSION_STATUS[session.status];
        return (
          <li key={session.id}>
            <button
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onOpen(session.id)}
              className={cn(
                'relative flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-[5px] text-left transition-colors',
                active
                  ? 'border-border-accent/70 bg-linear-to-r from-surface-selected to-surface-selected/50 shadow-glow'
                  : 'border-transparent hover:bg-surface-hover',
              )}
            >
              <span className="mt-1.5 flex size-3.5 items-center justify-center">
                <SessionStatusIcon status={session.status} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-md font-medium text-fg">{session.title}</span>
                <MetaList
                  className={cn('text-xs', active ? 'text-link' : 'text-fg-muted')}
                  items={[
                    status.label,
                    formatDuration(sessionElapsedMs(session, now)),
                    `${formatNumber(session.tokenCount)} tokens`,
                  ]}
                />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
