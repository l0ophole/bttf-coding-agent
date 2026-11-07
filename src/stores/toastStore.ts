import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

let toastCounter = 0;
const MAX_VISIBLE = 4;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }].slice(-MAX_VISIBLE) }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

type ToastOptions = Partial<Pick<Toast, 'description' | 'action'>>;

/** Imperative helpers usable from anywhere, including outside React. */
export const toast = {
  info: (title: string, options?: ToastOptions) =>
    useToastStore.getState().push({ title, tone: 'info', ...options }),
  success: (title: string, options?: ToastOptions) =>
    useToastStore.getState().push({ title, tone: 'success', ...options }),
  error: (title: string, options?: ToastOptions) =>
    useToastStore.getState().push({ title, tone: 'error', ...options }),
};
