import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';

import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/cn';

import { PopoverSurface, type PopoverAlign } from './Popover';

export interface MenuItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  onSelect: () => void;
}

export type MenuEntry =
  MenuItem | { separator: true; id: string } | { heading: string; id: string };

export interface MenuTriggerProps {
  ref: Ref<HTMLButtonElement>;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls'?: string;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

interface MenuProps {
  /** Accessible name of the menu. */
  label: string;
  entries: MenuEntry[];
  renderTrigger: (props: MenuTriggerProps) => ReactNode;
  align?: PopoverAlign;
  className?: string;
}

const isItem = (entry: MenuEntry): entry is MenuItem => 'onSelect' in entry;

/** WAI-ARIA menu button: focus moves into the menu; arrows, Home/End, Escape, Tab. */
export function Menu({ label, entries, renderTrigger, align = 'start', className }: MenuProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const items = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ??
        [],
    );

  const focusTarget = useRef<'first' | 'last'>('first');
  const openMenu = (focus: 'first' | 'last' = 'first') => {
    focusTarget.current = focus;
    setOpen(true);
  };

  // Focus the first (or last) item once the menu is mounted.
  useLayoutEffect(() => {
    if (!open) return;
    const list = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ??
        [],
    );
    (focusTarget.current === 'first' ? list[0] : list[list.length - 1])?.focus();
  }, [open]);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);
  const dismiss = useCallback(() => setOpen(false), []);
  useClickOutside([triggerRef, menuRef], dismiss, open);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (i: number) => list[(i + list.length) % list.length]?.focus();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(list.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  return (
    <>
      {renderTrigger({
        ref: triggerRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? `${id}-menu` : undefined,
        onClick: () => (open ? close() : openMenu()),
        onKeyDown: (event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openMenu(event.key === 'ArrowDown' ? 'first' : 'last');
          }
        },
      })}
      {open && (
        <PopoverSurface
          anchorRef={triggerRef}
          align={align}
          onDismiss={dismiss}
          className={className}
        >
          <div
            ref={menuRef}
            id={`${id}-menu`}
            role="menu"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onMenuKeyDown}
            className="outline-none"
          >
            {entries.map((entry) => {
              if ('separator' in entry) {
                return <div key={entry.id} role="separator" className="my-1 h-px bg-border" />;
              }
              if (!isItem(entry)) {
                return (
                  <div
                    key={entry.id}
                    role="presentation"
                    className="px-2 pt-2 pb-1 text-2xs font-semibold tracking-wide text-fg-subtle uppercase"
                  >
                    {entry.heading}
                  </div>
                );
              }
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  disabled={entry.disabled}
                  onClick={() => {
                    close();
                    entry.onSelect();
                  }}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-base text-fg-muted outline-none',
                    'hover:bg-surface-hover hover:text-fg focus:bg-surface-hover focus:text-fg focus-visible:bg-surface-hover focus-visible:text-fg disabled:opacity-50',
                  )}
                >
                  {entry.icon && (
                    <span className="mt-0.5 shrink-0 text-fg-subtle [&_svg]:size-4">
                      {entry.icon}
                    </span>
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{entry.label}</span>
                    {entry.description && (
                      <span className="truncate text-xs text-fg-subtle">{entry.description}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </PopoverSurface>
      )}
    </>
  );
}
