import { beforeEach, describe, expect, it } from 'vitest';

import { useWorkspaceStore } from './workspaceStore';

const store = () => useWorkspaceStore.getState();

beforeEach(() => {
  useWorkspaceStore.setState(
    {
      ...useWorkspaceStore.getInitialState(),
      openSessionIds: ['a', 'b', 'c'],
      activeSessionId: 'b',
    },
    true,
  );
});

describe('workspace store', () => {
  it('opens a session as a new active tab without duplicates', () => {
    store().openSession('d');
    store().openSession('a');
    expect(store().openSessionIds).toEqual(['a', 'b', 'c', 'd']);
    expect(store().activeSessionId).toBe('a');
  });

  it('focuses the neighbour when the active tab closes', () => {
    store().closeSession('b');
    expect(store().openSessionIds).toEqual(['a', 'c']);
    expect(store().activeSessionId).toBe('c');
    store().closeSession('c');
    expect(store().activeSessionId).toBe('a');
    store().closeSession('a');
    expect(store().activeSessionId).toBeNull();
  });

  it('prunes sessions that no longer exist', () => {
    store().pruneSessions(['a', 'c']);
    expect(store().openSessionIds).toEqual(['a', 'c']);
    expect(store().activeSessionId).toBe('a');
  });

  it('keeps drafts per session and clears empty ones', () => {
    store().setDraft('a', 'hello');
    expect(store().drafts).toEqual({ a: 'hello' });
    store().setDraft('a', '');
    expect(store().drafts).toEqual({});
  });
});
