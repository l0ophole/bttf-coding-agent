import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/cn';
import { useToastStore, type Toast } from '@/stores/toastStore';

const ICONS = { info: Info, success: CircleCheck, error: CircleAlert } as const;
const TONES = { info: 'text-brand', success: 'text-success', error: 'text-danger' } as const;
const DURATION_MS = 5_000;

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const Icon = ICONS[toast.tone];

  const start = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => dismiss(toast.id), DURATION_MS);
  };
  const pause = () => clearTimeout(timer.current);

  useEffect(() => {
    timer.current = setTimeout(() => dismiss(toast.id), DURATION_MS);
    return () => clearTimeout(timer.current);
  }, [dismiss, toast.id]);

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onPointerEnter={pause}
      onPointerLeave={start}
      onFocus={pause}
      onBlur={start}
      className="pointer-events-auto flex w-full animate-toast-in items-start gap-3 rounded-lg border border-border-strong bg-surface-overlay p-3 shadow-popover"
    >
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', TONES[toast.tone])} />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-fg">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-fg-muted">{toast.description}</p>}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              dismiss(toast.id);
            }}
            className="mt-1.5 text-sm font-medium text-link hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismiss(toast.id)}
        className="rounded p-0.5 text-fg-subtle hover:text-fg"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

/** Notification stack. Each toast is announced through its own status/alert role. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <section
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 bottom-4 z-[60] w-[min(360px,calc(100vw-32px))]"
    >
      <div className="flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </section>
  );
}
