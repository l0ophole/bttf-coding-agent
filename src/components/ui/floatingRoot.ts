import { createContext, use } from 'react';

/**
 * Where floating UI (popovers, tooltips) should mount. Inside an open modal
 * <dialog> everything outside the dialog is inert, so `Dialog` provides its own
 * element here and floating UI renders inside it.
 */
export const FloatingRootContext = createContext<HTMLElement | null>(null);

export function useFloatingRoot(): HTMLElement {
  return use(FloatingRootContext) ?? document.body;
}
