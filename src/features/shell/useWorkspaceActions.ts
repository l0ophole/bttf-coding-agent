import { useCallback } from 'react';

import { useCreateSession } from '@/api/hooks/mutations';
import type { ID } from '@/api/types';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { useResolvedTheme } from '@/hooks/useTheme';
import { toast } from '@/stores/toastStore';
import { useUiStore, type DockTab, type InspectorTab } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const ui = () => useUiStore.getState();

/**
 * Navigation actions shared by the icon rail, sidebar, keyboard shortcuts and
 * mobile menus, so each destination behaves the same everywhere.
 */
export function useWorkspaceActions() {
  const { inspectorDocked, sidebarDocked } = useBreakpoints();
  const theme = useResolvedTheme();
  const openSessionInStore = useWorkspaceStore((s) => s.openSession);
  const createSession = useCreateSession();

  const closeSidebarSheet = useCallback(() => {
    if (!sidebarDocked) ui().setSidebarOpen(false);
  }, [sidebarDocked]);

  const showInspector = useCallback(
    (tab: InspectorTab) => {
      ui().setInspectorTab(tab);
      closeSidebarSheet();
      if (!inspectorDocked) ui().setInspectorOpen(true);
    },
    [inspectorDocked, closeSidebarSheet],
  );

  const showDock = useCallback(
    (tab: DockTab) => {
      ui().setDockTab(tab);
      closeSidebarSheet();
    },
    [closeSidebarSheet],
  );

  const openSession = useCallback(
    (id: ID) => {
      openSessionInStore(id);
      closeSidebarSheet();
    },
    [openSessionInStore, closeSidebarSheet],
  );

  const newSession = useCallback(
    (input: { title?: string; goalId?: ID | null } = {}) => {
      createSession.mutate(input, {
        onSuccess: (session) => {
          openSession(session.id);
          toast.success('Session created', { description: session.title });
        },
      });
    },
    [createSession, openSession],
  );

  const focusSearch = useCallback(() => {
    closeSidebarSheet();
    ui().setInspectorTab('conversation');
    if (!inspectorDocked) ui().setInspectorOpen(true);
    ui().requestSearchFocus();
  }, [inspectorDocked, closeSidebarSheet]);

  return {
    openSession,
    newSession,
    creatingSession: createSession.isPending,
    showInspector,
    showDock,
    focusSearch,
    toggleTheme: () => ui().setTheme(theme === 'dark' ? 'light' : 'dark'),
    theme,
  };
}
