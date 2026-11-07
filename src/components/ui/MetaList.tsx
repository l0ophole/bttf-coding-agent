import { Fragment, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Inline metadata separated by dots, e.g. "Paused • 1h 12m • 8,921 tokens".
 * Dots are hidden from screen readers, which hear commas instead. Renders as
 * inline text so callers can truncate it with an ellipsis.
 */
export function MetaList({ items, className }: { items: ReactNode[]; className?: string }) {
  const visible = items.filter((item) => item !== null && item !== undefined && item !== false);
  return (
    <span className={cn('block min-w-0 truncate', className)}>
      {visible.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <>
              <span aria-hidden className="mx-1 opacity-70">
                •
              </span>
              <span className="sr-only">, </span>
            </>
          )}
          {item}
        </Fragment>
      ))}
    </span>
  );
}
