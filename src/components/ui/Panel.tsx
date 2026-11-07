import type { ComponentProps, ElementType, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type PanelVariant = 'default' | 'raised' | 'sunken' | 'glow';

const VARIANTS: Record<PanelVariant, string> = {
  default: 'border-border bg-surface',
  raised: 'border-border bg-surface-raised',
  sunken: 'border-border bg-surface-sunken',
  glow: 'border-border-accent/70 bg-surface-raised shadow-glow',
};

interface PanelProps extends ComponentProps<'div'> {
  variant?: PanelVariant;
  as?: ElementType;
}

/** Bordered surface used for every card in the layout. */
export function Panel({
  variant = 'default',
  as: Component = 'div',
  className,
  ...props
}: PanelProps) {
  return <Component className={cn('rounded-xl border', VARIANTS[variant], className)} {...props} />;
}

interface PanelHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  /** Heading level for document outline; defaults to h2. */
  level?: 2 | 3 | 4;
  id?: string;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
}

export function PanelHeader({
  icon,
  title,
  level = 2,
  id,
  actions,
  className,
  titleClassName,
}: PanelHeaderProps) {
  const Heading = `h${level}` as const;
  return (
    <div className={cn('flex min-h-9 items-center gap-2 px-3 pt-2.5 pb-2', className)}>
      {icon && <span className="text-fg-muted [&_svg]:size-4">{icon}</span>}
      <Heading
        id={id}
        className={cn('min-w-0 flex-1 truncate text-lg font-semibold text-fg', titleClassName)}
      >
        {title}
      </Heading>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}
