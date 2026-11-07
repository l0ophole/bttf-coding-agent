import { Menu, PanelRightOpen, SquarePlus } from 'lucide-react';

import { LogoMark } from '@/components/brand/LogoMark';
import { IconButton } from '@/components/ui/IconButton';
import { useUiStore } from '@/stores/uiStore';

import { SESSION_STATUS } from '../session/status';
import { useActiveSession } from '../session/useActiveSession';
import { useWorkspaceActions } from './useWorkspaceActions';

/** Compact header for phones: menu, current session, inspector. */
export function MobileHeader() {
  const { session } = useActiveSession();
  const actions = useWorkspaceActions();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const inspectorOpen = useUiStore((s) => s.inspectorOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const setInspectorOpen = useUiStore((s) => s.setInspectorOpen);

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border px-2 [grid-area:top]">
      <IconButton
        label="Open menu"
        icon={<Menu />}
        size="lg"
        tooltip={false}
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen(true)}
      />
      <LogoMark className="size-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-md leading-5 font-semibold text-fg">
          {session?.title ?? 'PiCode'}
        </p>
        {session && (
          <p className="truncate text-xs text-fg-muted">{SESSION_STATUS[session.status].label}</p>
        )}
      </div>
      <IconButton
        label="New session"
        icon={<SquarePlus />}
        size="lg"
        tooltip={false}
        onClick={() => actions.newSession()}
      />
      <IconButton
        label="Open inspector"
        icon={<PanelRightOpen />}
        size="lg"
        tooltip={false}
        aria-expanded={inspectorOpen}
        onClick={() => setInspectorOpen(true)}
      />
    </header>
  );
}
