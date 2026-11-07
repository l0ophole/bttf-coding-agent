import {
  createContext,
  use,
  useId,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/cn';

type TabsVariant = 'boxed' | 'underline' | 'segmented';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  baseId: string;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = use(TabsContext);
  if (!context) throw new Error('Tab components must be used inside <Tabs>');
  return context;
}

const tabId = (baseId: string, value: string) => `${baseId}-tab-${value}`;
const panelId = (baseId: string, value: string) => `${baseId}-panel-${value}`;

interface TabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  variant?: TabsVariant;
  children: ReactNode;
  className?: string;
}

/** WAI-ARIA tabs with automatic activation and arrow-key navigation. */
export function Tabs<T extends string>({
  value,
  onValueChange,
  variant = 'boxed',
  children,
  className,
}: TabsProps<T>) {
  const baseId = useId();
  return (
    <TabsContext
      value={{ value, onValueChange: onValueChange as (value: string) => void, baseId, variant }}
    >
      <div className={className}>{children}</div>
    </TabsContext>
  );
}

const LIST_VARIANTS: Record<TabsVariant, string> = {
  boxed: 'flex gap-1',
  underline: 'flex gap-1 border-b border-border',
  segmented: 'inline-flex gap-1 rounded-lg border border-border bg-surface-sunken p-0.5',
};

interface TabListProps extends Omit<ComponentProps<'div'>, 'role'> {
  'aria-label': string;
}

export function TabList({ className, children, onKeyDown, ...props }: TabListProps) {
  const { variant } = useTabs();
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? [],
    );
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;
    const targets: Record<string, number> = {
      ArrowRight: (current + 1) % tabs.length,
      ArrowDown: (current + 1) % tabs.length,
      ArrowLeft: (current - 1 + tabs.length) % tabs.length,
      ArrowUp: (current - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      tabIndex={-1}
      className={cn(LIST_VARIANTS[variant], className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}

const TAB_VARIANTS: Record<TabsVariant, { base: string; active: string; inactive: string }> = {
  boxed: {
    base: 'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-t-lg border border-b-2 px-3 text-base font-medium transition-colors',
    active:
      'border-border-accent/60 border-b-brand bg-linear-to-b from-accent-soft to-surface-selected/60 text-brand',
    inactive:
      'border-border bg-surface-raised/60 text-fg-muted hover:bg-surface-hover hover:text-fg',
  },
  underline: {
    base: '-mb-px flex h-9 items-center gap-1.5 border-b-2 px-3 text-base font-medium transition-colors',
    active: 'border-brand bg-brand-soft text-brand',
    inactive: 'border-transparent text-fg-muted hover:text-fg',
  },
  segmented: {
    base: 'flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
    active: 'bg-surface-selected text-brand shadow-glow',
    inactive: 'text-fg-muted hover:text-fg',
  },
};

interface TabProps extends Omit<ComponentProps<'button'>, 'value' | 'role'> {
  value: string;
}

export function Tab({ value, className, children, ...props }: TabProps) {
  const { value: selected, onValueChange, baseId, variant } = useTabs();
  const isSelected = selected === value;
  const styles = TAB_VARIANTS[variant];
  return (
    <button
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={isSelected}
      aria-controls={panelId(baseId, value)}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onValueChange(value)}
      className={cn(styles.base, isSelected ? styles.active : styles.inactive, className)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabPanelProps extends Omit<ComponentProps<'div'>, 'role'> {
  value: string;
  /** Keep the panel mounted (hidden) when inactive to preserve its state. */
  keepMounted?: boolean;
}

export function TabPanel({
  value,
  keepMounted = false,
  className,
  children,
  ...props
}: TabPanelProps) {
  const { value: selected, baseId } = useTabs();
  const isSelected = selected === value;
  // Inactive panels stay in the DOM (empty unless keepMounted) so every tab's aria-controls resolves.
  return (
    <div
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      hidden={!isSelected}
      tabIndex={isSelected ? 0 : -1}
      className={cn('focus-visible:outline-offset-[-2px]', className)}
      {...props}
    >
      {isSelected || keepMounted ? children : null}
    </div>
  );
}
