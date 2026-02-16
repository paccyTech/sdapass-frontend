export type ToastVariant = 'default' | 'destructive' | 'success';

export type ToastInput = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

export type ToastItem = ToastInput & {
  id: string;
  createdAt: number;
  open: boolean;
};

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

const EXIT_ANIMATION_MS = 220;

const notify = () => {
  listeners.forEach((listener) => listener(toasts));
};

const removeToast = (id: string) => {
  const target = toasts.find((toast) => toast.id === id);
  if (!target) {
    return;
  }

  if (!target.open) {
    return;
  }

  toasts = toasts.map((toast) => (toast.id === id ? { ...toast, open: false } : toast));
  notify();

  window.setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id);
    notify();
  }, EXIT_ANIMATION_MS);
};

export function toast(input: ToastInput) {
  if (typeof window === 'undefined') {
    return;
  }

  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const item: ToastItem = {
    id,
    createdAt: Date.now(),
    open: true,
    variant: input.variant ?? 'default',
    durationMs: input.durationMs ?? 3500,
    title: input.title,
    description: input.description,
  };

  toasts = [item, ...toasts].slice(0, 5);
  notify();

  window.setTimeout(() => removeToast(id), item.durationMs);
}

export function useToast() {
  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    listener(toasts);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    subscribe,
    dismiss: removeToast,
  };
}
