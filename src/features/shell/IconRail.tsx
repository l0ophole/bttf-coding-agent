import {
  Bot,
  CircleHelp,
  FileCode2,
  FlaskConical,
  GitBranch,
  GitCompareArrows,
  History,
  Moon,
  PanelLeftOpen,
  Search,
  Settings,
  SquarePlus,
  Sun,
  Wrench,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useSessions } from '@/api/hooks/queries';
import { IconButton } from '@/components/ui/IconButton';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/uiStore';

import { useWorkspaceActions } from './useWorkspaceActions';

interface RailItem {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  current?: boolean;
}

/** Narrow primary navigation. Mirrors the sidebar so it still works when the sidebar is collapsed. */
export function IconRail() {
  const actions = useWorkspaceActions();
  const { sidebarDocked } = useBreakpoints();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const setHelpOpen = useUiStore((s) => s.setHelpOpen);
  const { data: sessions } = useSessions();
  const agentWorking = sessions?.some((s) => s.status === 'working') ?? false;

  const items: RailItem[] = [
    { id: 'sessions', label: 'Sessions', icon: <Bot />, onSelect: () => {}, current: true },
    { id: 'new', label: 'New session', icon: <SquarePlus />, onSelect: () => actions.newSession() },
    {
      id: 'files',
      label: 'Files',
      icon: <FileCode2 />,
      onSelect: () => actions.showInspector('files'),
    },
    {
      id: 'diffs',
      label: 'Diffs',
      icon: <GitCompareArrows />,
      onSelect: () => actions.showDock('files'),
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <History />,
      onSelect: () => actions.showDock('timeline'),
    },
    {
      id: 'tools',
      label: 'Tool calls',
      icon: <Wrench />,
      onSelect: () => actions.showDock('tools'),
    },
    {
      id: 'tests',
      label: 'Tests',
      icon: <FlaskConical />,
      onSelect: () => actions.showDock('tests'),
    },
    { id: 'git', label: 'Git', icon: <GitBranch />, onSelect: () => actions.showDock('git') },
    { id: 'search', label: 'Search (Ctrl K)', icon: <Search />, onSelect: actions.focusSearch },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings />,
      onSelect: () => actions.showInspector('settings'),
    },
    { id: 'help', label: 'Help', icon: <CircleHelp />, onSelect: () => setHelpOpen(true) },
  ];

  return (
    <nav
      aria-label="Primary"
      className="flex min-h-0 flex-col items-center gap-1.5 border-r border-border py-3 [grid-area:rail]"
    >
      {!sidebarDocked && (
        <IconButton
          label="Open sidebar"
          icon={<PanelLeftOpen />}
          size="lg"
          tooltip="right"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
          className="mb-1"
        />
      )}
      <ul className="flex flex-col items-center gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <IconButton
              label={item.label}
              icon={item.icon}
              size="lg"
              tooltip="right"
              variant={item.current ? 'active' : 'ghost'}
              aria-current={item.current ? 'page' : undefined}
              onClick={item.onSelect}
              className={cn('rounded-xl', !item.current && 'text-link/80 hover:text-link')}
            />
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col items-center gap-3">
        <IconButton
          label={actions.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          icon={actions.theme === 'dark' ? <Sun /> : <Moon />}
          size="lg"
          tooltip="right"
          onClick={actions.toggleTheme}
          className="rounded-xl"
        />
        <span
          role="img"
          aria-label={agentWorking ? 'Agent active' : 'Agent idle'}
          className={cn(
            'size-3 rounded-full border-2',
            agentWorking ? 'border-success shadow-[0_0_8px_var(--success)]' : 'border-fg-subtle',
          )}
        />
      </div>
    </nav>
  );
}
