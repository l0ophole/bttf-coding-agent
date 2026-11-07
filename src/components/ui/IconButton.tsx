import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Tooltip, type TooltipSide } from './Tooltip';

type IconButtonVariant = 'ghost' | 'outline' | 'subtle' | 'active';
type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const VARIANTS: Record<IconButtonVariant, string> = {
  ghost: 'text-fg-muted hover:bg-surface-hover hover:text-fg',
  outline:
    'border border-border-strong bg-surface-raised/60 text-fg-muted hover:border-border-accent hover:text-fg',
  subtle: 'text-fg-subtle hover:bg-surface-hover hover:text-fg',
  active: 'bg-violet-soft text-violet shadow-glow-violet',
};

const SIZES: Record<IconButtonSize, string> = {
  xs: 'size-6 rounded [&_svg]:size-3.5',
  sm: 'size-7 rounded-md [&_svg]:size-4',
  md: 'size-8 rounded-md [&_svg]:size-4',
  lg: 'size-9 rounded-lg [&_svg]:size-5',
};

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** Accessible name; also shown as the tooltip. */
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  tooltip?: TooltipSide | false;
  /** Toggle buttons expose their state through aria-pressed. */
  pressed?: boolean;
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  tooltip = 'top',
  pressed,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:shrink-0',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
  return tooltip ? (
    <Tooltip content={label} side={tooltip}>
      {button}
    </Tooltip>
  ) : (
    button
  );
}
