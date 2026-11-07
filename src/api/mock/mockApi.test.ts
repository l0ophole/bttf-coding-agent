import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clock } from '@/lib/clock';

import { FIXTURE_NOW, SESSION_IDS } from './fixtures';
import { createMockApi, type MockApi } from './mockApi';

const sessionId = SESSION_IDS.fixApi;
let api: MockApi;

beforeEach(() => {
  vi.useFakeTimers();
  clock.setNow(FIXTURE_NOW());
  api = createMockApi({ latencyMs: 0, autoplay: false, agentStepMs: 100 });
});

afterEach(() => {
  api.dispose();
  vi.useRealTimers();
});

describe('mock agent', () => {
  it('replies to a message: thinking first, complete later', async () => {
    await api.sendMessage(sessionId, { content: 'Please run the tests' });
    let conversation = await api.getConversation(sessionId);
    const reply = conversation.messages.at(-1)!;
    expect(conversation.messages.at(-2)?.role).toBe('user');
    expect(reply.status).toBe('thinking');
    expect((await api.listSessions()).find((s) => s.id === sessionId)?.status).toBe('working');

    await vi.runAllTimersAsync();
    conversation = await api.getConversation(sessionId);
    const done = conversation.messages.find((m) => m.id === reply.id)!;
    expect(done.status).toBe('complete');
    expect(done.versions[0]!.content).toMatch(/8 tests pass/);
    expect(conversation.toolCalls.filter((c) => c.messageId === reply.id)).toHaveLength(1);
    expect((await api.listSessions()).find((s) => s.id === sessionId)?.status).toBe('idle');
  });

  it('interrupts the running turn when a new message arrives', async () => {
    await api.sendMessage(sessionId, { content: 'Explain the bug' });
    const conversation = await api.getConversation(sessionId);
    expect(conversation.messages.find((m) => m.id === 'm12')?.status).toBe('stopped');
    expect(conversation.toolCalls.find((c) => c.id === 't13')?.status).toBe('cancelled');
  });

  it('stops the agent on request', async () => {
    const session = await api.stopAgent(sessionId);
    expect(session.status).toBe('paused');
    expect(session.activeSince).toBeNull();
  });
});

describe('time travel', () => {
  it('rewinds by dropping later messages and their tool calls', async () => {
    await api.rewindSession(sessionId, 'm6');
    const conversation = await api.getConversation(sessionId);
    expect(conversation.messages.at(-1)?.id).toBe('m6');
    expect(conversation.toolCalls.every((c) => ['m2', 'm4', 'm6'].includes(c.messageId))).toBe(
      true,
    );
  });

  it('forks into a new session with remapped tool calls', async () => {
    const fork = await api.forkSession(sessionId, 'm4');
    expect(fork.forkedFrom).toEqual({ sessionId, messageId: 'm4' });
    const conversation = await api.getConversation(fork.id);
    expect(conversation.messages).toHaveLength(4);
    const toolIds = new Set(conversation.toolCalls.map((c) => c.id));
    for (const message of conversation.messages) {
      for (const segment of message.versions[0]!.segments) {
        if (segment.type === 'tool') expect(toolIds.has(segment.toolCallId)).toBe(true);
      }
    }
    // The source session is untouched.
    expect((await api.getConversation(sessionId)).messages).toHaveLength(12);
  });
});

describe('message versions', () => {
  it('saves an edit as a new active version and can switch back', async () => {
    const edited = await api.saveMessageVersion('m10', { content: 'Edited text' });
    expect(edited.versions).toHaveLength(2);
    expect(edited.activeVersionId).toBe(edited.versions[1]!.id);
    expect(edited.versions[1]!.content).toBe('Edited text');

    const restored = await api.setActiveVersion('m10', edited.versions[0]!.id);
    expect(restored.activeVersionId).toBe(edited.versions[0]!.id);
  });

  it('rejects unknown ids', async () => {
    await expect(api.setActiveVersion('nope', 'v')).rejects.toThrow(/not found/);
  });
});

describe('demo continuation', () => {
  it('finishes the in-progress run without duplicating tool calls', async () => {
    const demo = createMockApi({ latencyMs: 0, autoplay: true, autoplayDelayMs: 100, agentStepMs: 100 });
    await vi.runAllTimersAsync();
    const conversation = await demo.getConversation(sessionId);
    const m12 = conversation.messages.find((m) => m.id === 'm12')!;
    for (const version of m12.versions) {
      const ids = version.segments.flatMap((s) => (s.type === 'tool' ? [s.toolCallId] : []));
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(m12.status).toBe('complete');
    expect(conversation.messages.at(-1)?.versions[0]?.content).toMatch(/8 tests pass/);
    expect((await demo.listGoals()).find((g) => g.id === 'goal-fix-api')?.status).toBe('completed');
    demo.dispose();
  });
});
