import { describe, expect, it } from 'vitest';

import { createFixtures, FIXTURE_NOW, SESSION_IDS } from '@/api/mock/fixtures';
import type { Conversation } from '@/api/types';

import { buildTimeline, nearestEvent, positionOf, spacedMarkers } from './timeline';

function fixtureConversation(): Conversation {
  const db = createFixtures();
  return {
    sessionId: SESSION_IDS.fixApi,
    messages: db.messages.filter((m) => m.sessionId === SESSION_IDS.fixApi),
    toolCalls: db.toolCalls.filter((c) => c.sessionId === SESSION_IDS.fixApi),
  };
}

describe('buildTimeline', () => {
  it('orders events and spans the session up to now', () => {
    const now = FIXTURE_NOW();
    const timeline = buildTimeline(fixtureConversation(), now);
    const starts = timeline.events.map((e) => e.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(timeline.start).toBe(starts[0]);
    expect(timeline.end).toBe(now);
  });

  it('categorises tool calls, including failures', () => {
    const timeline = buildTimeline(fixtureConversation(), FIXTURE_NOW());
    const byTool = (id: string) => timeline.events.find((e) => e.toolCallId === id)?.category;
    expect(byTool('t6')).toBe('test');
    expect(byTool('t10')).toBe('error');
    expect(byTool('t11')).toBe('git');
    expect(byTool('t12')).toBe('read');
  });

  it('extends an in-progress agent turn to now', () => {
    const now = FIXTURE_NOW();
    const timeline = buildTimeline(fixtureConversation(), now);
    expect(timeline.events.find((e) => e.id === 'reasoning:m12')?.end).toBe(now);
  });

  it('returns an empty timeline for an empty conversation', () => {
    const timeline = buildTimeline({ sessionId: 's', messages: [], toolCalls: [] }, 1000);
    expect(timeline.events).toEqual([]);
  });
});

describe('timeline geometry', () => {
  it('maps times onto the track and back', () => {
    const timeline = buildTimeline(fixtureConversation(), FIXTURE_NOW());
    expect(positionOf(timeline.start, timeline)).toBe(0);
    expect(positionOf(timeline.end, timeline)).toBe(1);
    expect(nearestEvent(timeline, 0)?.messageId).toBe('m1');
    expect(nearestEvent(timeline, 1)?.messageId).toBe('m12');
  });

  it('keeps markers apart', () => {
    const timeline = buildTimeline(fixtureConversation(), FIXTURE_NOW());
    const markers = spacedMarkers(timeline, 0.05);
    for (let i = 1; i < markers.length; i++) {
      const gap =
        positionOf(markers[i]!.start, timeline) - positionOf(markers[i - 1]!.start, timeline);
      expect(gap).toBeGreaterThanOrEqual(0.05);
    }
  });
});
