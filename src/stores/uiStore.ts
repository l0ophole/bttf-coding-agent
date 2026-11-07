import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ID } from '@/api/types';

export type ThemePreference = 'light' | 'dark' | 'system';
export type InspectorTab = 'conversation' | 'tools' | 'files' | 'settings';
export type DockTab = 'timeline' | 'files' | 'tools' | 'tests' | 'git';

interface UiState {
  theme: ThemePreference;
  inspectorTab: InspectorTab;
  dockTab: DockTab;
  dockCollapsed: boolean;
  /** Off-canvas panels used below the desktop breakpoints. */
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  helpOpen: boolean;
  /** A rewind waiting for confirmation. */
  rewindTarget: { sessionId: ID; messageId: ID } | null;
  /** Incremented to ask the timeline search box to take focus. */
  searchFocusRequest: number;

  setTheme: (theme: ThemePreference) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setDockTab: (tab: DockTab) => void;
  setDockCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  setRewindTarget: (target: { sessionId: ID; messageId: ID } | null) => void;
  requestSearchFocus: () => void;
}

/** Storage key read by the inline theme script in index.html — keep them in sync. */
export const UI_STORAGE_KEY = 'picode:ui';

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      inspectorTab: 'conversation',
      dockTab: 'timeline',
      dockCollapsed: false,
      sidebarOpen: false,
      inspectorOpen: false,
      helpOpen: false,
      rewindTarget: null,
      searchFocusRequest: 0,

      setTheme: (theme) => set({ theme }),
      setInspectorTab: (inspectorTab) => set({ inspectorTab }),
      setDockTab: (dockTab) => set({ dockTab, dockCollapsed: false }),
      setDockCollapsed: (dockCollapsed) => set({ dockCollapsed }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
      setHelpOpen: (helpOpen) => set({ helpOpen }),
      setRewindTarget: (rewindTarget) => set({ rewindTarget }),
      requestSearchFocus: () => set((s) => ({ searchFocusRequest: s.searchFocusRequest + 1 })),
    }),
    {
      name: UI_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        inspectorTab: state.inspectorTab,
        dockTab: state.dockTab,
        dockCollapsed: state.dockCollapsed,
      }),
    },
  ),
);
