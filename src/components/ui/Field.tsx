import { Search } from 'lucide-react';
import { useId, type ComponentProps } from 'react';

import { cn } from '@/lib/cn';

const fieldClasses =
  'w-full rounded-lg border border-border-strong bg-surface-sunken text-base text-fg placeholder:text-fg-subtle transition-colors hover:border-border-accent focus-visible:border-border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  hideLabel?: boolean;
}

export function TextField({ label, hideLabel = false, className, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={inputId}
        className={hideLabel ? 'sr-only' : 'text-sm font-medium text-fg-muted'}
      >
        {label}
      </label>
      <input id={inputId} className={cn(fieldClasses, 'h-9 px-3')} {...props} />
    </div>
  );
}

interface SearchFieldProps extends ComponentProps<'input'> {
  label: string;
}

/** Search input with a leading icon; the label is visually hidden but announced. */
export function SearchField({ label, className, id, ...props }: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={cn('relative', className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted"
      />
      <input id={inputId} type="search" className={cn(fieldClasses, 'h-9 pr-3 pl-9')} {...props} />
    </div>
  );
}

export { fieldClasses };
