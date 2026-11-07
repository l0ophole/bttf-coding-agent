import { History, Plus, SquarePlus, X } from 'lucide-react';

import { useSessions } from '@/api/hooks/queries';
import { IconButton } from '@/components/ui/IconButton';
import { Menu, type MenuEntry } from '@/components/ui/Menu';
import { cn } from '@/lib/cn';
import { useWorkspaceStore } from '@/stores/workspaceStore';

import { SessionStatusIcon } from '../session/SessionStatusIcon';
import { SESSION_STATUS } from '../session/status';
import { useWorkspaceActions } from './useWorkspaceActions';

/** Browser-style strip of open sessions with a "new" button and an overflow menu. */
export function SessionTabs() {
  const { data: sessions = [] } = useSessions();
  const openIds = useWorkspaceStore((s) => s.openSessionIds);
  const activeId = useWorkspaceStore((s) => s.activeSessionId);
  const setActive = useWorkspaceStore((s) => s.setActiveSession);
  const closeSession = useWorkspaceStore((s) => s.closeSession);
  const actions = useWorkspaceActions();

  const openSessions = openIds
    .map((id) => sessions.find((session) => session.id === id))
    .filter((session) => session !== undefined);
  const closedSessions = sessions.filter((session) => !openIds.includes(session.id));

  const menuEntries: MenuEntry[] = [
    {
      id: 'new',
      label: 'New session',
      icon: <SquarePlus />,
      onSelect: () => actions.newSession(),
    },
    ...(closedSessions.length
      ? ([
          { id: 'sep', separator: true },
          { id: 'heading', heading: 'Reopen' },
          ...closedSessions.map((session) => ({
            id: session.id,
            label: session.title,
            description: SESSION_STATUS[session.status].label,
            icon: <History />,
            onSelect: () => actions.openSession(session.id),
          })),
        ] satisfies MenuEntry[])
      : []),
  ];

  return (
    <nav aria-label="Open sessions" className="flex min-w-0 flex-1 items-end gap-2 self-stretch">
      <button
        type="button"
        onClick={() => actions.newSession()}
        disabled={actions.creatingSession}
        className="mb-1 hidden h-9 shrink-0 items-center gap-2 rounded-lg border border-border-strong bg-surface-raised/60 px-3 text-md text-fg-muted transition-colors hover:border-border-accent hover:text-fg disabled:opacity-60 xl:flex"
      >
        <SquarePlus aria-hidden className="size-4" />
        New Session
      </button>

      <ul className="flex min-w-0 scrollbar-none items-end gap-1 overflow-x-auto pt-1.5">
        {openSessions.map((session) => {
          const active = session.id === activeId;
          return (
            <li
              key={session.id}
              className={cn(
                'group relative flex h-[38px] shrink-0 items-center rounded-t-lg border border-b-0 transition-colors',
                active
                  ? 'border-border-accent bg-surface-raised text-fg shadow-[0_-4px_16px_-6px_var(--glow)] before:absolute before:inset-x-3 before:-top-px before:h-px before:bg-brand'
                  : 'border-border bg-surface/60 text-fg-muted hover:text-fg',
              )}
            >
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setActive(session.id)}
                className="flex h-full max-w-56 items-center gap-2.5 rounded-tl-lg pr-2 pl-3.5 text-md font-medium"
              >
                <SessionStatusIcon status={session.status} />
                <span className="truncate">{session.title}</span>
                <span className="sr-only">, {SESSION_STATUS[session.status].label}</span>
              </button>
              <button
                type="button"
                aria-label={`Close ${session.title}`}
                onClick={() => closeSession(session.id)}
                className="mr-2 flex size-6 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mb-1 shrink-0">
        <Menu
          label="Sessions"
          entries={menuEntries}
          renderTrigger={(props) => (
            <IconButton
              {...props}
              label="Open or create a session"
              icon={<Plus />}
              variant="outline"
              size="lg"
            />
          )}
        />
      </div>
    </nav>
  );
}
