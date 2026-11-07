import { useEffect, useRef, type RefObject } from 'react';

/**
 * Call `onOutside` for pointer presses outside every given element while `enabled`.
 * The latest refs and callback are always used, so callers may pass inline values.
 */
export function useClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  onOutside: () => void,
  enabled = true,
): void {
  const latest = useRef({ refs, onOutside });
  useEffect(() => {
    latest.current = { refs, onOutside };
  });

  useEffect(() => {
    if (!enabled) return;
    const handle = (event: PointerEvent) => {
      const target = event.target as Node;
      if (latest.current.refs.every((ref) => !ref.current?.contains(target))) {
        latest.current.onOutside();
      }
    };
    document.addEventListener('pointerdown', handle);
    return () => document.removeEventListener('pointerdown', handle);
  }, [enabled]);
}
