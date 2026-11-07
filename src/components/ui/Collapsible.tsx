import { ChevronDown } from 'lucide-react';
import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface CollapsibleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Content of the toggle button. */
  title: ReactNode;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  /** Extra controls next to the toggle (outside the button). */
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
}

/** Disclosure: a heading-wrapped button with aria-expanded controlling a region. */
export function Collapsible({
  open,
  onOpenChange,
  title,
  children,
  className,
  triggerClassName,
  contentClassName,
  actions,
  headingLevel = 3,
}: CollapsibleProps) {
  const contentId = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Heading className="min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={contentId}
            onClick={() => onOpenChange(!open)}
            className={cn('flex w-full items-center gap-1.5 text-left', triggerClassName)}
          >
            <ChevronDown
              aria-hidden
              className={cn(
                'size-4 shrink-0 transition-transform duration-150',
                !open && '-rotate-90',
              )}
            />
            {title}
          </button>
        </Heading>
        {actions}
      </div>
      <div id={contentId} hidden={!open} className={contentClassName}>
        {children}
      </div>
    </div>
  );
}
