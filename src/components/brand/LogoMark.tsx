import { useId } from 'react';

interface LogoMarkProps {
  className?: string;
  /** Gradient stops; defaults to the cyan-to-blue product mark. */
  from?: string;
  to?: string;
  title?: string;
}

/** The PiCode arrowhead. Decorative unless `title` is given. */
export function LogoMark({ className, from = '#3ee0f5', to = '#1665e0', title }: LogoMarkProps) {
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradientId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        fillRule="evenodd"
        d="M16 2.5 29 29 16 22.6 3 29Zm0 9.2-6.1 12.6 6.1-3 6.1 3Z"
      />
    </svg>
  );
}
