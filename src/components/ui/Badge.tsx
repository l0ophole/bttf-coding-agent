import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export type BadgeTone =
  'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'violet';

const SOFT: Record<BadgeTone, string> = {
  neutral: 'bg-surface-hover text-fg-muted border-border-strong',
  brand: 'bg-brand-soft text-brand border-brand/40',
  accent: 'bg-accent-soft text-link border-accent/40',
  success: 'bg-success-soft text-success border-success/40',
  warning: 'bg-warning-soft text-warning border-warning/40',
  danger: 'bg-danger-soft text-danger border-danger/40',
  violet: 'bg-violet-soft text-violet border-violet/40',
};

interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

export function Badge({ tone = 'neutral', size = 'sm', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium whitespace-nowrap [&_svg]:size-3',
        size === 'sm' ? 'h-5 px-1.5 text-2xs' : 'h-6 px-2 text-xs',
        SOFT[tone],
        className,
      )}
      {...props}
    />
  );
}
