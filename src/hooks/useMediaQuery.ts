import { useCallback, useSyncExternalStore } from 'react';

/** Subscribe to a CSS media query. Returns false during SSR and in environments without matchMedia. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = () =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false;
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Breakpoints shared with Tailwind (see the implementation plan, section 5). */
export const BREAKPOINTS = {
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
} as const;

export function useBreakpoints() {
  const md = useMediaQuery(BREAKPOINTS.md);
  const lg = useMediaQuery(BREAKPOINTS.lg);
  const xl = useMediaQuery(BREAKPOINTS.xl);
  return {
    /** Sidebar is docked (otherwise it lives in a sheet). */
    sidebarDocked: lg,
    /** Inspector is docked (otherwise it lives in a sheet). */
    inspectorDocked: xl,
    /** Icon rail and desktop top bar are visible. */
    showRail: md,
    isMobile: !md,
  };
}
