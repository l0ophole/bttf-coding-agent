import { useEffect, useRef } from 'react';

interface HotkeyOptions {
  /** Require Ctrl (Windows/Linux) or Cmd (macOS). */
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** Fire even when focus is inside a text field. */
  allowInInputs?: boolean;
  enabled?: boolean;
}

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Register a global keyboard shortcut, e.g. `useHotkey('k', openSearch, { mod: true })`. */
export function useHotkey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {},
) {
  const {
    mod = false,
    shift = false,
    alt = false,
    allowInInputs = false,
    enabled = true,
  } = options;
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (mod !== (event.metaKey || event.ctrlKey)) return;
      if (shift !== event.shiftKey) return;
      if (alt !== event.altKey) return;
      if (!allowInInputs && isTextInput(event.target)) return;
      event.preventDefault();
      handlerRef.current(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, mod, shift, alt, allowInInputs, enabled]);
}
