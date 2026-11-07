import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Spinner } from './Spinner';

export type ButtonVariant =
  'primary' | 'soft' | 'secondary' | 'outline' | 'ghost' | 'violet' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-fg-on-accent hover:bg-accent-hover shadow-[0_0_20px_-8px_var(--accent)] border border-transparent',
  soft: 'border border-border-accent bg-accent-soft text-brand hover:bg-accent/25',
  secondary: 'border border-border-strong bg-surface-raised text-fg hover:bg-surface-hover',
  outline: 'border border-border-strong text-fg hover:border-border-accent hover:bg-surface-hover',
  ghost: 'border border-transparent text-fg-muted hover:bg-surface-hover hover:text-fg',
  violet:
    'border border-[var(--violet-border)] bg-linear-to-r from-[#3b0f9e] to-[#7c3aed] text-white shadow-glow-violet hover:brightness-110',
  danger: 'border border-transparent bg-danger-fill text-white hover:brightness-110',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 gap-1 px-2 text-xs [&_svg]:size-3.5',
  sm: 'h-8 gap-1.5 px-3 text-sm [&_svg]:size-4',
  md: 'h-9 gap-2 px-4 text-base [&_svg]:size-4',
};

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
}

function buttonClasses(variant: ButtonVariant = 'secondary', size: ButtonSize = 'sm') {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-[background-color,border-color,color,filter] duration-150 select-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0',
    VARIANTS[variant],
    SIZES[size],
  );
}

export function Button({
  variant = 'secondary',
  size = 'sm',
  leadingIcon,
  trailingIcon,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses(variant, size), className)}
      {...props}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
