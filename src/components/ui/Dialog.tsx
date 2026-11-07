import { X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Button } from './Button';
import { FloatingRootContext } from './floatingRoot';
import { IconButton } from './IconButton';

type DialogVariant = 'modal' | 'sheet-left' | 'sheet-right';

const VARIANTS: Record<DialogVariant, string> = {
  modal:
    'm-auto w-[min(440px,calc(100vw-32px))] rounded-xl border border-border-strong bg-surface-overlay p-0 text-fg shadow-popover animate-pop-in',
  'sheet-left':
    'sheet-left h-dvh max-h-dvh w-[min(320px,88vw)] max-w-none border-r border-border-strong bg-surface p-0 text-fg',
  'sheet-right':
    'sheet-right h-dvh max-h-dvh w-[min(360px,92vw)] max-w-none border-l border-border-strong bg-surface p-0 text-fg',
};

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Hide the visual header but keep the accessible name. */
  hideHeader?: boolean;
  variant?: DialogVariant;
  role?: 'dialog' | 'alertdialog';
  className?: string;
  children: ReactNode;
}

/**
 * Modal built on the native <dialog>: the browser provides focus trapping,
 * Escape to close, an inert background and focus restoration.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  hideHeader = false,
  variant = 'modal',
  role = 'dialog',
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const [node, setNode] = useState<HTMLDialogElement | null>(null);
  const setRefs = useCallback((element: HTMLDialogElement | null) => {
    ref.current = element;
    setNode(element);
  }, []);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Honour an explicit initial focus target (e.g. the safe action of a confirmation).
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // Backdrop clicks close the dialog; keyboard users have Escape (native cancel) and the Close button.
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions
    <dialog
      ref={setRefs}
      role={role === 'alertdialog' ? 'alertdialog' : undefined}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal="true"
      onClose={() => {
        if (open) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click whose target is the <dialog> itself landed on the backdrop.
        if (event.target !== ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (!inside) onClose();
      }}
      className={cn('fixed overflow-hidden backdrop:animate-fade-in', VARIANTS[variant], className)}
    >
      {open && (
        <FloatingRootContext value={node}>
          <div className="flex h-full max-h-[inherit] flex-col">
            <div
              className={cn(
                'flex items-start gap-3 border-b border-border px-4 py-3',
                hideHeader && 'sr-only',
              )}
            >
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-lg font-semibold text-fg">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-0.5 text-sm text-fg-muted">
                    {description}
                  </p>
                )}
              </div>
              <IconButton label="Close" icon={<X />} size="sm" tooltip={false} onClick={onClose} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>
        </FloatingRootContext>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  extraAction?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  extraAction,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      role="alertdialog"
    >
      <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
        {extraAction}
        <Button variant="ghost" onClick={onCancel} data-autofocus>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
