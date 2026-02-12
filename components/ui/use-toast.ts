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
};

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach((listener) => listener(toasts));
};

const removeToast = (id: string) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  notify();
};

export function toast(input: ToastInput) {
  if (typeof window === 'undefined') {
    return;
  }

  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const item: ToastItem = {
    id,
    createdAt: Date.now(),
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
