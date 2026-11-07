import {
  ChevronDown,
  CircleHelp,
  FileText,
  FolderGit2,
  GitBranch,
  GitCompareArrows,
  ListTree,
  MessagesSquare,
  Plus,
  Search,
  Settings,
  SquareTerminal,
  Target,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useProject, useSessions } from '@/api/hooks/queries';
import { BrandHero } from '@/components/brand/BrandHero';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/uiStore';

import { useWorkspaceActions } from '../shell/useWorkspaceActions';
import { GoalList } from './GoalList';
import { SessionList } from './SessionList';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  id: string;
  action?: ReactNode;
}

function SectionHeader({ icon, title, id, action }: SectionHeaderProps) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-lg border border-border-strong/80 bg-surface-raised/70 pr-0.5 pl-2.5">
      <span className="text-fg-muted [&_svg]:size-4">{icon}</span>
      <h2 id={id} className="flex-1 text-md font-semibold text-fg">
        {title}
      </h2>
      {action}
    </div>
  );
}

function NavButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex h-[26px] w-full items-center gap-3 rounded-md px-2.5 text-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg [&_svg]:size-4 [&_svg]:text-link"
      >
        {icon}
        {label}
      </button>
    </li>
  );
}

function ProjectSection({ onNewSession }: { onNewSession: () => void }) {
  const [open, setOpen] = useState(true);
  const { data: project } = useProject();

  return (
    <section aria-labelledby="sidebar-project" className="flex flex-col gap-1">
      <div className="flex h-8 items-center gap-1 rounded-lg border border-border-strong/80 bg-surface-raised/70 pr-0.5 pl-1.5">
        <h2 id="sidebar-project" className="flex-1">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="sidebar-project-content"
            onClick={() => setOpen(!open)}
            className="flex h-7 w-full items-center gap-1.5 rounded-md px-1 text-md font-semibold text-fg"
          >
            <ChevronDown
              aria-hidden
              className={cn('size-4 text-fg-muted transition-transform', !open && '-rotate-90')}
            />
            Project
          </button>
        </h2>
        <IconButton
          label="New session in this project"
          icon={<Plus />}
          size="sm"
          onClick={onNewSession}
        />
      </div>
      <div id="sidebar-project-content" hidden={!open} className="px-1">
        {project ? (
          <div className="flex gap-3 px-1.5 py-1">
            <FolderGit2 aria-hidden className="mt-0.5 size-5 shrink-0 text-link" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-brand">{project.name}</p>
              <p className="truncate text-sm text-fg-muted">{project.path}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-brand">
                <GitBranch aria-hidden className="size-3.5" />
                <span className="sr-only">Branch</span>
                {project.branch}
                <span className="ml-auto flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={cn(
                      'size-2.5 rounded-full border-2',
                      project.isClean ? 'border-success' : 'border-warning',
                    )}
                  />
                  <span className="sr-only">
                    {project.isClean ? 'Working tree clean' : 'Uncommitted changes'}
                  </span>
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="h-16 skeleton rounded-md" />
        )}
      </div>
    </section>
  );
}

function AgentStatus() {
  const { data: sessions } = useSessions();
  const working = sessions?.filter((s) => s.status === 'working').length ?? 0;
  return (
    <p
      role="status"
      className={cn(
        'flex items-center gap-2 px-2.5 text-base font-medium',
        working ? 'text-success' : 'text-fg-muted',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex size-4 items-center justify-center rounded border-2',
          working ? 'border-success' : 'border-fg-subtle',
        )}
      >
        <span className={cn('size-1.5 rounded-full', working ? 'bg-success' : 'bg-fg-subtle')} />
      </span>
      {working ? 'Agent is active' : 'Agent is idle'}
    </p>
  );
}

interface SidebarProps {
  className?: string;
  /** Rendered inside the mobile sheet: show the hero more compactly. */
  compact?: boolean;
}

/** Workspace sidebar: sessions, goals, project and navigation. */
export function Sidebar({ className, compact = false }: SidebarProps) {
  const actions = useWorkspaceActions();
  const [addingGoal, setAddingGoal] = useState(false);

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-2 pt-2 pb-2">
        <section aria-labelledby="sidebar-sessions" className="flex flex-col gap-1">
          <SectionHeader
            id="sidebar-sessions"
            icon={<MessagesSquare />}
            title="Sessions"
            action={
              <IconButton
                label="New session"
                icon={<Plus />}
                size="sm"
                variant="outline"
                onClick={() => actions.newSession()}
                disabled={actions.creatingSession}
              />
            }
          />
          <SessionList onOpen={actions.openSession} />
        </section>

        <section aria-labelledby="sidebar-goals" className="flex flex-col gap-1">
          <SectionHeader
            id="sidebar-goals"
            icon={<Target />}
            title="Goals"
            action={
              <IconButton
                label="Add goal"
                icon={<Plus />}
                size="sm"
                variant="outline"
                aria-expanded={addingGoal}
                onClick={() => setAddingGoal(true)}
              />
            }
          />
          <GoalList
            adding={addingGoal}
            onAddingChange={setAddingGoal}
            onOpenSession={actions.openSession}
            onStartGoal={(goal) => actions.newSession({ title: goal.title, goalId: goal.id })}
          />
        </section>

        <ProjectSection onNewSession={() => actions.newSession()} />

        <nav aria-label="Project tools" className="border-t border-border pt-1.5">
          <ul className="flex flex-col">
            <NavButton
              icon={<FileText />}
              label="Files"
              onClick={() => actions.showInspector('files')}
            />
            <NavButton
              icon={<GitCompareArrows />}
              label="Diffs"
              onClick={() => actions.showDock('files')}
            />
            <NavButton icon={<Search />} label="Search" onClick={actions.focusSearch} />
            <NavButton icon={<ListTree />} label="Git" onClick={() => actions.showDock('git')} />
            <NavButton
              icon={<SquareTerminal />}
              label="Terminal"
              onClick={() => actions.showDock('tools')}
            />
          </ul>
        </nav>

        <nav aria-label="App" className="border-t border-border pt-1.5">
          <ul className="flex flex-col">
            <NavButton
              icon={<Settings />}
              label="Settings"
              onClick={() => actions.showInspector('settings')}
            />
            <NavButton
              icon={<CircleHelp />}
              label="Help"
              onClick={() => useUiStore.getState().setHelpOpen(true)}
            />
          </ul>
        </nav>

        <div className="border-t border-border pt-2.5">
          <AgentStatus />
        </div>
      </div>
      <BrandHero className={cn('shrink-0 border-t border-border', compact ? 'h-24' : 'h-32')} />
    </div>
  );
}
