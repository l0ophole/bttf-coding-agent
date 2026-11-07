import { Ban, Check, X } from 'lucide-react';

import type { ToolStatus } from '@/api/types';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';

const STATUS_LABEL: Record<ToolStatus, string> = {
  running: 'Running',
  success: 'Succeeded',
  error: 'Failed',
  cancelled: 'Cancelled',
};

export function ToolStatusIcon({ status, className }: { status: ToolStatus; className?: string }) {
  const label = <span className="sr-only">{STATUS_LABEL[status]}</span>;
  switch (status) {
    case 'running':
      return (
        <span className={cn('inline-flex text-brand', className)}>
          <Spinner className="size-4" />
          {label}
        </span>
      );
    case 'success':
      return (
        <span className={cn('inline-flex text-success', className)}>
          <Check aria-hidden className="size-4" strokeWidth={3} />
          {label}
        </span>
      );
    case 'error':
      return (
        <span className={cn('inline-flex text-danger', className)}>
          <X aria-hidden className="size-4" strokeWidth={3} />
          {label}
        </span>
      );
    case 'cancelled':
      return (
        <span className={cn('inline-flex text-fg-subtle', className)}>
          <Ban aria-hidden className="size-4" />
          {label}
        </span>
      );
  }
}
