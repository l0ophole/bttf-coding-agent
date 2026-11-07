import { Check, ChevronDown } from 'lucide-react';
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/cn';

import { PopoverSurface, type PopoverAlign } from './Popover';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

type SelectVariant = 'pill' | 'toolbar' | 'field';

const TRIGGER_VARIANTS: Record<SelectVariant, string> = {
  pill: 'h-[26px] rounded-md border border-border-strong bg-surface-raised/70 px-2.5 text-sm text-fg hover:border-border-accent',
  toolbar:
    'h-9 rounded-lg border border-border-strong bg-surface-raised/70 px-3 text-base text-fg hover:border-border-accent',
  field:
    'h-9 w-full justify-between rounded-md border border-border-strong bg-surface-sunken px-3 text-base text-fg hover:border-border-accent',
};

interface SelectProps<T extends string> {
  /** Accessible name of the control, e.g. "Model". */
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** Custom trigger content; defaults to the selected option's label. */
  renderValue?: (option: SelectOption<T> | undefined) => ReactNode;
  leadingIcon?: ReactNode;
  variant?: SelectVariant;
  align?: PopoverAlign;
  showChevron?: boolean;
  disabled?: boolean;
  className?: string;
  /** Visible label rendered above the trigger (field variant). */
  visibleLabel?: boolean;
}

/**
 * Select-only combobox (WAI-ARIA APG pattern): a button that opens a listbox.
 * Keys: ↑/↓/Home/End move, Enter/Space choose, Escape closes, letters jump.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  renderValue,
  leadingIcon,
  variant = 'pill',
  align = 'start',
  showChevron = true,
  disabled = false,
  className,
  visibleLabel = false,
}: SelectProps<T>) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const typeahead = useRef({ text: '', at: 0 });

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options.find((option) => option.value === value);

  const openList = (index = selectedIndex) => {
    setActiveIndex(index);
    setOpen(true);
  };

  // Move focus into the listbox as soon as it is mounted.
  useLayoutEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const dismiss = useCallback(() => setOpen(false), []);
  useClickOutside([triggerRef, listRef], dismiss, open);

  const choose = (index: number) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    close();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openList(event.key === 'ArrowUp' ? Math.max(0, selectedIndex - 1) : selectedIndex);
    }
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        return;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        return;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(activeIndex);
        return;
      case 'Escape':
        event.preventDefault();
        close();
        return;
      case 'Tab':
        close();
        return;
    }
    if (event.key.length === 1 && /\S/.test(event.key)) {
      const now = Date.now();
      const state = typeahead.current;
      state.text =
        now - state.at > 600 ? event.key.toLowerCase() : state.text + event.key.toLowerCase();
      state.at = now;
      const match = options.findIndex((o) => o.label.toLowerCase().startsWith(state.text));
      if (match !== -1) setActiveIndex(match);
    }
  };

  const optionId = (index: number) => `${id}-option-${index}`;

  return (
    <div className={cn('inline-flex flex-col gap-1.5', variant === 'field' && 'w-full', className)}>
      <span id={labelId} className={visibleLabel ? 'text-sm font-medium text-fg-muted' : 'sr-only'}>
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${labelId} ${id}-value`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'inline-flex items-center gap-2 font-medium whitespace-nowrap transition-colors disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
          TRIGGER_VARIANTS[variant],
          open && 'border-border-accent',
        )}
      >
        {leadingIcon}
        <span id={`${id}-value`} className="min-w-0 truncate">
          {renderValue ? renderValue(selected) : (selected?.label ?? 'Select…')}
        </span>
        {showChevron && (
          <ChevronDown
            aria-hidden
            className={cn('ml-auto text-fg-muted transition-transform', open && 'rotate-180')}
          />
        )}
      </button>
      {open && (
        <PopoverSurface
          anchorRef={triggerRef}
          align={align}
          matchWidth={variant === 'field'}
          onDismiss={dismiss}
        >
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={labelId}
            aria-activedescendant={optionId(activeIndex)}
            onKeyDown={onListKeyDown}
            className="outline-none"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                // Focus stays on the listbox (aria-activedescendant); clicks are a pointer shortcut.
                // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/interactive-supports-focus
                <div
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className={cn(
                    'flex items-start gap-2 rounded-md px-2 py-1.5 text-base',
                    index === activeIndex ? 'bg-surface-hover text-fg' : 'text-fg-muted',
                  )}
                >
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-brand [&_svg]:size-4">
                    {isSelected ? <Check aria-hidden /> : option.icon}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className={cn('truncate', isSelected && 'text-fg')}>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-fg-subtle">{option.description}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </PopoverSurface>
      )}
    </div>
  );
}
