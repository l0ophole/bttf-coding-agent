import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import type { Message } from '@/api/types';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import {
  CATEGORY_LABELS,
  nearestEvent,
  positionOf,
  spacedMarkers,
  spanOf,
  type Timeline,
  type TimelineEvent,
} from '@/lib/timeline';

import { CATEGORY_STYLE } from './categories';

interface TimelineTrackProps {
  timeline: Timeline;
  messages: Message[];
  selectedIndex: number;
  onSelectMessage: (messageId: string) => void;
  variant?: 'full' | 'mini';
  label?: string;
  className?: string;
}

const pct = (value: number) => `${(value * 100).toFixed(3)}%`;

/**
 * Scrubbable timeline. For assistive tech it is a slider over the session's
 * messages (arrows, Home/End, Page Up/Down); pointer users can click or drag
 * anywhere and the nearest event's message is selected.
 */
export function TimelineTrack({
  timeline,
  messages,
  selectedIndex,
  onSelectMessage,
  variant = 'full',
  label = 'Timeline playhead',
  className,
}: TimelineTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ position: number; event: TimelineEvent } | null>(null);
  const dragging = useRef(false);
  const mini = variant === 'mini';

  const selected = messages[selectedIndex];
  const playheadTime = selected ? Date.parse(selected.createdAt) : null;
  const playhead = playheadTime === null ? null : positionOf(playheadTime, timeline);
  const markers = useMemo(() => spacedMarkers(timeline, mini ? 0.06 : 0.035), [timeline, mini]);
  const spans = timeline.events;
  const messagePositions = useMemo(
    () =>
      messages
        .filter((m) => m.role === 'user')
        .map((m) => ({ id: m.id, position: positionOf(Date.parse(m.createdAt), timeline) })),
    [messages, timeline],
  );

  const eventAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const position = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const event = nearestEvent(timeline, position);
    return event ? { position, event } : null;
  };

  const selectAt = (clientX: number) => {
    const hit = eventAt(clientX);
    if (hit) onSelectMessage(hit.event.messageId);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    selectAt(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const hit = eventAt(event.clientX);
    setHover(hit);
    if (dragging.current) selectAt(event.clientX);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const go = (index: number) => {
    const message = messages[Math.min(messages.length - 1, Math.max(0, index))];
    if (message) onSelectMessage(message.id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowLeft: selectedIndex - 1,
      ArrowDown: selectedIndex - 1,
      ArrowRight: selectedIndex + 1,
      ArrowUp: selectedIndex + 1,
      PageDown: selectedIndex - 5,
      PageUp: selectedIndex + 5,
      Home: 0,
      End: messages.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    go(next);
  };

  const valueText = selected
    ? `Message ${selectedIndex + 1} of ${messages.length}, ${selected.role === 'user' ? 'user' : 'agent'}, ${formatTime(selected.createdAt)}`
    : 'No messages';

  return (
    <div className={cn('flex flex-col', className)}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={messages.length ? 0 : -1}
        aria-label={label}
        aria-valuemin={messages.length ? 1 : 0}
        aria-valuemax={messages.length}
        aria-valuenow={messages.length ? selectedIndex + 1 : 0}
        aria-valuetext={valueText}
        aria-disabled={messages.length === 0 || undefined}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setHover(null)}
        className={cn(
          'relative cursor-pointer touch-none rounded-md select-none focus-visible:outline-offset-4',
          mini ? 'h-[76px]' : 'h-[58px]',
        )}
      >
        {/* Event icons */}
        {!mini && (
          <div aria-hidden className="absolute inset-x-0 top-0 h-6">
            {markers.map((event) => {
              const style = CATEGORY_STYLE[event.category];
              const Icon = style.icon;
              return (
                <span
                  key={event.id}
                  className={cn(
                    'absolute top-0 flex size-6 -translate-x-1/2 items-center justify-center rounded-md bg-current/12',
                    style.text,
                  )}
                  style={{ left: pct(positionOf(event.start, timeline)) }}
                >
                  <Icon className="size-4" strokeWidth={2.2} />
                </span>
              );
            })}
          </div>
        )}

        {/* Track */}
        <div
          aria-hidden
          className={cn(
            'absolute inset-x-0 rounded-full bg-surface-hover ring-1 ring-border',
            mini ? 'top-[30px] h-3.5' : 'top-[30px] h-3',
          )}
        >
          {spans.map((event) => {
            const { left, width } = spanOf(event, timeline);
            return (
              <span
                key={event.id}
                className={cn(
                  'absolute rounded-full',
                  CATEGORY_STYLE[event.category].bar,
                  event.category === 'reasoning'
                    ? 'inset-y-[3px] opacity-40'
                    : 'inset-y-0 opacity-90',
                )}
                style={{ left: pct(left), width: pct(width) }}
              />
            );
          })}
          {messagePositions.map(({ id, position }) => (
            <span
              key={id}
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-evt-message ring-2 ring-surface"
              style={{ left: pct(position) }}
            />
          ))}
        </div>

        {/* Axis */}
        {!mini && (
          <div aria-hidden className="absolute inset-x-0 top-[52px] h-px bg-border-strong" />
        )}
        {mini && (
          <div aria-hidden className="absolute inset-x-0 top-[56px] flex justify-between">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="h-2.5 w-px bg-border-strong" />
            ))}
          </div>
        )}

        {/* Playhead */}
        {playhead !== null && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-0"
            style={{ left: pct(playhead) }}
          >
            <span className="absolute inset-y-1 -left-px w-0.5 rounded bg-brand shadow-[0_0_8px_var(--brand)]" />
            <span
              className={cn(
                'absolute -left-[5px] size-2.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]',
                mini ? 'top-0' : 'bottom-0',
              )}
            />
            {mini && selected && (
              <span
                className={cn(
                  'absolute top-0 rounded-md border border-border-strong bg-surface-overlay px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-fg',
                  playhead > 0.6 ? 'right-2' : 'left-2',
                )}
              >
                {formatTime(selected.createdAt)}
              </span>
            )}
          </div>
        )}

        {/* Hover hint */}
        {hover && (
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute z-10 max-w-64 truncate rounded-md border border-border-strong bg-surface-overlay px-2 py-1 text-xs text-fg shadow-popover',
              mini ? 'bottom-full mb-1' : '-top-8',
            )}
            style={{
              left: pct(hover.position),
              transform: `translateX(${hover.position > 0.7 ? '-100%' : hover.position < 0.3 ? '0' : '-50%'})`,
            }}
          >
            <span className={cn('font-medium', CATEGORY_STYLE[hover.event.category].text)}>
              {CATEGORY_LABELS[hover.event.category]}
            </span>{' '}
            · {formatTime(hover.event.start)} · {hover.event.label}
          </div>
        )}
      </div>

      {!mini && (
        <div aria-hidden className="mt-0.5 flex justify-between text-sm text-fg-muted">
          <span>{formatTime(timeline.start)}</span>
          <span>{formatTime(timeline.end)}</span>
        </div>
      )}
    </div>
  );
}
