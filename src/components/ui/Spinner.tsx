import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/cn';

interface SpinnerProps {
  className?: string;
  /** Accessible label; omit when a nearby text already explains the busy state. */
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <LoaderCircle
      className={cn('size-4 animate-spin motion-reduce:animate-none', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  );
}
