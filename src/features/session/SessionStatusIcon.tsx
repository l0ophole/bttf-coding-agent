import { CircleCheck, CirclePause, CircleAlert } from 'lucide-react';

import type { SessionStatus } from '@/api/types';
import { cn } from '@/lib/cn';

/** Status glyph; colour is never the only signal because labels sit next to it. */
export function SessionStatusIcon({
  status,
  className,
}: {
  status: SessionStatus;
  className?: string;
}) {
  switch (status) {
    case 'working':
      return (
        <span
          aria-hidden
          className={cn(
            'size-2.5 shrink-0 animate-pulse-dot rounded-full bg-success text-success',
            className,
          )}
        />
      );
    case 'idle':
      return (
        <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full bg-brand', className)} />
      );
    case 'paused':
      return <CirclePause aria-hidden className={cn('size-3.5 shrink-0 text-danger', className)} />;
    case 'completed':
      return (
        <CircleCheck aria-hidden className={cn('size-3.5 shrink-0 text-success', className)} />
      );
    case 'error':
      return <CircleAlert aria-hidden className={cn('size-3.5 shrink-0 text-danger', className)} />;
  }
}
