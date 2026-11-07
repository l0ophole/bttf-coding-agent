import type { ComponentProps } from 'react';

/** Content for assistive technology only. */
export function VisuallyHidden({ className, ...props }: ComponentProps<'span'>) {
  return <span className={['sr-only', className].filter(Boolean).join(' ')} {...props} />;
}
