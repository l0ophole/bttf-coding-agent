import type { Conversation, ID, ToolCall } from '@/api/types';

import { getActiveVersion } from './conversation';
import { stripMarkdown, truncate } from './format';

export type TimelineCategory =
  'message' | 'reasoning' | 'read' | 'edit' | 'command' | 'test' | 'git' | 'error';

export interface TimelineEvent {
  id: string;
  category: TimelineCategory;
  label: string;
  start: number;
  end: number;
  messageId: ID;
  toolCallId?: ID;
  /** Draw an icon above the track for this event. */
  prominent: boolean;
}

export interface Timeline {
  events: TimelineEvent[];
  start: number;
  end: number;
}

export const CATEGORY_LABELS: Record<TimelineCategory, string> = {
  message: 'Message',
  reasoning: 'Agent working',
  read: 'Read',
  edit: 'Edit',
  command: 'Command',
  test: 'Tests',
  git: 'Git',
  error: 'Error',
};

/** Smallest visible width of a span, as a fraction of the track. */
const MIN_SPAN = 0.012;

function toolCategory(call: ToolCall): TimelineCategory {
  if (call.status === 'error') return 'error';
  switch (call.kind) {
    case 'read_file':
    case 'search':
      return 'read';
    case 'edit_file':
      return 'edit';
    case 'run_command':
      return 'command';
    case 'run_tests':
      return call.output?.kind === 'tests' && call.output.results.some((r) => r.status === 'failed')
        ? 'error'
        : 'test';
    case 'git':
      return 'git';
  }
}

/**
 * Turn a conversation into time-ordered events. User messages are instants,
 * agent turns span from start to completion (or `now` while running), and each
 * tool call spans its own duration.
 */
export function buildTimeline(conversation: Conversation | undefined, now: number): Timeline {
  const events: TimelineEvent[] = [];
  if (!conversation || conversation.messages.length === 0) {
    return { events, start: now, end: now };
  }

  for (const message of conversation.messages) {
    const start = Date.parse(message.createdAt);
    if (message.role === 'user') {
      events.push({
        id: `message:${message.id}`,
        category: 'message',
        label: `User: ${truncate(stripMarkdown(getActiveVersion(message).content), 60)}`,
        start,
        end: start,
        messageId: message.id,
        prominent: true,
      });
    } else {
      const end = message.completedAt ? Date.parse(message.completedAt) : now;
      events.push({
        id: `reasoning:${message.id}`,
        category: 'reasoning',
        label: message.status === 'thinking' ? 'Agent thinking' : 'Agent turn',
        start,
        end: Math.max(end, start),
        messageId: message.id,
        prominent: false,
      });
    }
  }

  for (const call of conversation.toolCalls) {
    const start = Date.parse(call.startedAt);
    const end = call.durationMs === null ? now : start + call.durationMs;
    events.push({
      id: `tool:${call.id}`,
      category: toolCategory(call),
      label: `${call.title}: ${call.target}`,
      start,
      end: Math.max(end, start),
      messageId: call.messageId,
      toolCallId: call.id,
      prominent: true,
    });
  }

  events.sort((a, b) => a.start - b.start || a.end - b.end);
  const start = events[0]!.start;
  const end = Math.max(now, ...events.map((e) => e.end));
  return { events, start, end: end > start ? end : start + 60_000 };
}

/** Position of a timestamp on the track, 0..1. */
export function positionOf(time: number, timeline: Pick<Timeline, 'start' | 'end'>): number {
  const span = timeline.end - timeline.start;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (time - timeline.start) / span));
}

/** Left offset and width (0..1) of an event, with a minimum visible width. */
export function spanOf(event: TimelineEvent, timeline: Timeline): { left: number; width: number } {
  const left = positionOf(event.start, timeline);
  const width = Math.max(MIN_SPAN, positionOf(event.end, timeline) - left);
  return { left: Math.min(left, 1 - MIN_SPAN), width };
}

/** Keep prominent markers at least `minGap` (0..1) apart so icons do not overlap. */
export function spacedMarkers(timeline: Timeline, minGap = 0.045): TimelineEvent[] {
  const markers: TimelineEvent[] = [];
  let last = -Infinity;
  for (const event of timeline.events) {
    if (!event.prominent) continue;
    const position = positionOf(event.start, timeline);
    if (position - last >= minGap) {
      markers.push(event);
      last = position;
    }
  }
  return markers;
}

/** The event whose start is closest to a track position (0..1). */
export function nearestEvent(timeline: Timeline, position: number): TimelineEvent | undefined {
  const target = timeline.start + position * (timeline.end - timeline.start);
  let best: TimelineEvent | undefined;
  let bestDistance = Infinity;
  for (const event of timeline.events) {
    const distance = Math.abs(event.start - target);
    if (distance < bestDistance) {
      best = event;
      bestDistance = distance;
    }
  }
  return best;
}
