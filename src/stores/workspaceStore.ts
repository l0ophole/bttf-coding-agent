import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ID } from '@/api/types';

interface WorkspaceState {
  /** Session ids shown as tabs in the top bar, in order. */
  openSessionIds: ID[];
  activeSessionId: ID | null;
  /** Timeline playhead per session: the selected message id. Missing or null follows the latest message. */
  playhead: Record<ID, ID | null>;
  /** Unsent composer text per session. */
  drafts: Record<ID, string>;

  openSession: (id: ID) => void;
  closeSession: (id: ID) => void;
  setActiveSession: (id: ID | null) => void;
  setPlayhead: (sessionId: ID, messageId: ID | null) => void;
  setDraft: (sessionId: ID, text: string) => void;
  /** Drop references to sessions that no longer exist. */
  pruneSessions: (existingIds: ID[]) => void;
}

export const DEFAULT_SESSION_ID = 'session-fix-api';

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      openSessionIds: [DEFAULT_SESSION_ID],
      activeSessionId: DEFAULT_SESSION_ID,
      playhead: {},
      drafts: {},

      openSession: (id) =>
        set((state) => ({
          openSessionIds: state.openSessionIds.includes(id)
            ? state.openSessionIds
            : [...state.openSessionIds, id],
          activeSessionId: id,
        })),

      closeSession: (id) =>
        set((state) => {
          const index = state.openSessionIds.indexOf(id);
          const openSessionIds = state.openSessionIds.filter((openId) => openId !== id);
          let activeSessionId = state.activeSessionId;
          if (activeSessionId === id) {
            // Focus the neighbour, like closing a browser tab.
            activeSessionId = openSessionIds[Math.min(index, openSessionIds.length - 1)] ?? null;
          }
          return { openSessionIds, activeSessionId };
        }),

      setActiveSession: (activeSessionId) => set({ activeSessionId }),

      setPlayhead: (sessionId, messageId) =>
        set((state) => ({ playhead: { ...state.playhead, [sessionId]: messageId } })),

      setDraft: (sessionId, text) =>
        set((state) => {
          const drafts = { ...state.drafts };
          if (text) drafts[sessionId] = text;
          else delete drafts[sessionId];
          return { drafts };
        }),

      pruneSessions: (existingIds) =>
        set((state) => {
          const known = new Set(existingIds);
          const openSessionIds = state.openSessionIds.filter((id) => known.has(id));
          const activeSessionId =
            state.activeSessionId && known.has(state.activeSessionId)
              ? state.activeSessionId
              : (openSessionIds[0] ?? null);
          if (
            openSessionIds.length === state.openSessionIds.length &&
            activeSessionId === state.activeSessionId
          ) {
            return state;
          }
          return { openSessionIds, activeSessionId };
        }),
    }),
    {
      name: 'picode:workspace',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        openSessionIds: state.openSessionIds,
        activeSessionId: state.activeSessionId,
        drafts: state.drafts,
      }),
    },
  ),
);
