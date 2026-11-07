import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** tailwind-merge needs to know about the custom design-token scales to resolve conflicts. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      shadow: ['glow', 'glow-violet', 'popover'],
      animate: ['pulse-dot', 'shimmer', 'fade-in', 'pop-in', 'toast-in'],
    },
  },
});

/** Compose class names; later Tailwind classes override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
