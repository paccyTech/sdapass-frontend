'use client';

import { useEffect, useState, type CSSProperties } from 'react';

import { useToast, type ToastItem } from '@/components/ui/use-toast';

const containerStyle: CSSProperties = {
  position: 'fixed',
  right: '1.25rem',
  bottom: '1.25rem',
  zIndex: 100,
  display: 'grid',
  gap: '0.75rem',
  width: 'min(420px, calc(100vw - 2.5rem))',
};

const baseToastStyle: CSSProperties = {
  borderRadius: '16px',
  padding: '0.9rem 1rem',
  boxShadow: '0 18px 40px rgba(8, 22, 48, 0.18)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  background: 'white',
  display: 'grid',
  gap: '0.25rem',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.95rem',
  fontWeight: 700,
  color: '#0b1f33',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.9rem',
  color: '#475569',
  lineHeight: 1.45,
  whiteSpace: 'pre-wrap',
};

const dismissStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '1.1rem',
  lineHeight: 1,
  color: 'rgba(2, 6, 23, 0.55)',
  padding: 0,
};

const variants: Record<NonNullable<ToastItem['variant']>, CSSProperties> = {
  default: {
    border: '1px solid rgba(24, 76, 140, 0.18)',
  },
  destructive: {
    border: '1px solid rgba(239, 68, 68, 0.28)',
    background: 'rgba(254, 242, 242, 0.95)',
  },
  success: {
    border: '1px solid rgba(16, 185, 129, 0.32)',
    background: 'rgba(236, 253, 245, 0.95)',
  },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const variant = toast.variant ?? 'default';

  return (
    <div style={{ ...baseToastStyle, ...variants[variant] }} role="status" aria-live="polite">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          {toast.title ? <p style={titleStyle}>{toast.title}</p> : null}
          {toast.description ? <p style={descriptionStyle}>{toast.description}</p> : null}
        </div>
        <button type="button" aria-label="Dismiss notification" style={dismissStyle} onClick={() => onDismiss(toast.id)}>
          ×
        </button>
      </div>
    </div>
  );
}

export function Toaster() {
  const { subscribe, dismiss } = useToast();
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribe(setItems), [subscribe]);

  if (!items.length) {
    return null;
  }

  return (
    <div style={containerStyle}>
      {items.map((item) => (
        <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
      ))}
    </div>
  );
}
