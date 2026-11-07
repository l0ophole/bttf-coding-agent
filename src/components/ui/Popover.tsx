import { useEffect, useLayoutEffect, useRef, type ComponentProps, type RefObject } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

import { useFloatingRoot } from './floatingRoot';

export type PopoverAlign = 'start' | 'end';

interface PopoverSurfaceProps extends ComponentProps<'div'> {
  anchorRef: RefObject<HTMLElement | null>;
  align?: PopoverAlign;
  /** Match the anchor's width (useful for field-style selects). */
  matchWidth?: boolean;
  /** Called when the anchor scrolls away or the window resizes. */
  onDismiss: () => void;
}

const GAP = 4;
const MARGIN = 8;

/**
 * Floating surface anchored to a trigger. It renders in a portal with fixed
 * positioning, so scroll containers never clip it, and flips above the trigger
 * when there is not enough room below.
 */
export function PopoverSurface({
  anchorRef,
  align = 'start',
  matchWidth = false,
  onDismiss,
  className,
  style,
  ref,
  ...props
}: PopoverSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const root = useFloatingRoot();

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const surface = surfaceRef.current;
    if (!anchor || !surface) return;
    const a = anchor.getBoundingClientRect();
    if (matchWidth) surface.style.minWidth = `${a.width}px`;
    const s = surface.getBoundingClientRect();
    let left = align === 'end' ? a.right - s.width : a.left;
    left = Math.min(Math.max(MARGIN, left), window.innerWidth - s.width - MARGIN);
    const below = a.bottom + GAP;
    const fitsBelow = below + s.height <= window.innerHeight - MARGIN;
    const top = fitsBelow ? below : Math.max(MARGIN, a.top - GAP - s.height);
    surface.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    surface.style.visibility = 'visible';
  });

  useEffect(() => {
    const onScroll = (event: Event) => {
      if (surfaceRef.current?.contains(event.target as Node)) return;
      onDismiss();
    };
    window.addEventListener('resize', onDismiss);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onDismiss);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [onDismiss]);

  return createPortal(
    <div
      ref={(node) => {
        surfaceRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      style={{ visibility: 'hidden', ...style }}
      className={cn(
        'fixed top-0 left-0 z-40 max-h-80 min-w-44 animate-pop-in overflow-auto rounded-lg border border-border-strong bg-surface-overlay p-1 shadow-popover',
        className,
      )}
      {...props}
    />,
    root,
  );
}
