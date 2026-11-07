import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

import { useFloatingRoot } from './floatingRoot';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  side?: TooltipSide;
  delay?: number;
  children: ReactNode;
  className?: string;
}

const GAP = 6;
const MARGIN = 8;

/**
 * Visual hint for a control. It never replaces an accessible name: icon buttons
 * set `aria-label` themselves, so the tooltip is hidden from assistive tech.
 * Shown on hover and keyboard focus; dismissed with Escape.
 */
export function Tooltip({ content, side = 'top', delay = 350, children, className }: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const root = useFloatingRoot();

  const show = (immediate = false) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(true), immediate ? 0 : delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setVisible(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
    };
  }, [visible]);

  // Position against the anchor and keep the tip inside the viewport.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!visible || !anchor || !tip) return;
    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    let top: number;
    let left: number;
    switch (side) {
      case 'bottom':
        top = a.bottom + GAP;
        left = a.left + a.width / 2 - t.width / 2;
        break;
      case 'left':
        top = a.top + a.height / 2 - t.height / 2;
        left = a.left - GAP - t.width;
        break;
      case 'right':
        top = a.top + a.height / 2 - t.height / 2;
        left = a.right + GAP;
        break;
      default:
        top = a.top - GAP - t.height;
        left = a.left + a.width / 2 - t.width / 2;
    }
    left = Math.min(Math.max(MARGIN, left), window.innerWidth - t.width - MARGIN);
    top = Math.min(Math.max(MARGIN, top), window.innerHeight - t.height - MARGIN);
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    tip.style.opacity = '1';
  }, [visible, side]);

  return (
    <span
      ref={anchorRef}
      className={cn('inline-flex', className)}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') show();
      }}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={(event) => {
        if (event.target.matches(':focus-visible')) show(true);
      }}
      onBlur={hide}
    >
      {children}
      {visible &&
        createPortal(
          <div
            ref={tipRef}
            aria-hidden
            className="pointer-events-none fixed top-0 left-0 z-[70] max-w-64 rounded-md border border-border-strong bg-surface-overlay px-2 py-1 text-xs whitespace-nowrap text-fg opacity-0 shadow-popover"
          >
            {content}
          </div>,
          root,
        )}
    </span>
  );
}
