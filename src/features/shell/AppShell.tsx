import { useEffect } from 'react';

import { useRefreshWhenRunsEnd, useSessions } from '@/api/hooks/queries';
import { Dialog } from '@/components/ui/Dialog';
import { Toaster } from '@/components/ui/Toaster';
import { useHotkey } from '@/hooks/useHotkey';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { useApplyTheme } from '@/hooks/useTheme';
import { useUiStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

import { ConversationView } from '../conversation/ConversationView';
import { InspectorPanel } from '../inspector/InspectorPanel';
import { Sidebar } from '../sidebar/Sidebar';
import { ActivityDock } from '../timeline/ActivityDock';
import { RewindDialog } from '../timeline/RewindDialog';
import { JumpToCard, RewindCard } from '../timeline/TimeTravelCards';
import { HelpDialog } from './HelpDialog';
import { IconRail } from './IconRail';
import { MobileHeader } from './MobileHeader';
import { TopBar } from './TopBar';
import { useWorkspaceActions } from './useWorkspaceActions';

/**
 * Responsive application frame. Regions are placed with the `.app-shell` grid
 * (see styles/index.css); below each breakpoint the sidebar and the inspector
 * move into sheets.
 */
export function AppShell() {
  useApplyTheme();
  useRefreshWhenRunsEnd();

  const { sidebarDocked, inspectorDocked, showRail } = useBreakpoints();
  const actions = useWorkspaceActions();
  const { data: sessions } = useSessions();
  const pruneSessions = useWorkspaceStore((s) => s.pruneSessions);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const inspectorOpen = useUiStore((s) => s.inspectorOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const setInspectorOpen = useUiStore((s) => s.setInspectorOpen);
  const setHelpOpen = useUiStore((s) => s.setHelpOpen);

  // Forget tabs whose sessions no longer exist (e.g. forks from a previous visit).
  useEffect(() => {
    if (sessions) pruneSessions(sessions.map((s) => s.id));
  }, [sessions, pruneSessions]);

  // Sheets close once their panel is docked again.
  useEffect(() => {
    if (sidebarDocked) setSidebarOpen(false);
  }, [sidebarDocked, setSidebarOpen]);
  useEffect(() => {
    if (inspectorDocked) setInspectorOpen(false);
  }, [inspectorDocked, setInspectorOpen]);

  useHotkey('k', actions.focusSearch, { mod: true, allowInInputs: true });
  useHotkey('?', () => setHelpOpen(true), { shift: true });

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[80] rounded-md bg-accent px-3 py-2 text-fg-on-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to conversation
      </a>

      <div className="app-shell bg-canvas text-fg">
        {showRail ? <TopBar /> : <MobileHeader />}
        {showRail && <IconRail />}

        {sidebarDocked && (
          <aside aria-label="Workspace" className="min-h-0 border-r border-border [grid-area:side]">
            <Sidebar />
          </aside>
        )}

        <main
          id="main-content"
          tabIndex={-1}
          className="flex min-h-0 min-w-0 flex-col gap-3 px-2 pt-2 pb-1 [grid-area:main] focus:outline-none md:px-3"
        >
          <ConversationView />
        </main>

        {inspectorDocked && (
          <aside aria-label="Inspector" className="flex min-h-0 flex-col [grid-area:inspector]">
            <InspectorPanel className="flex-1" />
          </aside>
        )}

        <ActivityDock showTimeTravelCards={inspectorDocked} />
      </div>

      {!sidebarDocked && (
        <Dialog
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          title="Workspace"
          variant="sheet-left"
        >
          <Sidebar compact />
        </Dialog>
      )}

      {!inspectorDocked && (
        <Dialog
          open={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
          title="Inspector"
          variant="sheet-right"
        >
          <div className="flex flex-col gap-2 pb-3">
            <InspectorPanel />
            <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
              <RewindCard />
              <JumpToCard />
            </div>
          </div>
        </Dialog>
      )}

      <RewindDialog />
      <HelpDialog />
      <Toaster />
    </>
  );
}
