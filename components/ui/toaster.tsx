'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

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

const toastCardStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '16px',
  padding: '0.95rem 1rem',
  border: '1px solid var(--surface-border)',
  background: 'var(--surface-primary)',
  boxShadow: '0 18px 40px rgba(8, 22, 48, 0.18)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const contentRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.85rem',
  paddingLeft: '0.5rem',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.95rem',
  fontWeight: 700,
  color: 'var(--shell-foreground)',
};

const descriptionStyle: CSSProperties = {
  margin: '0.25rem 0 0 0',
  fontSize: '0.9rem',
  color: 'var(--muted)',
  lineHeight: 1.45,
  whiteSpace: 'pre-wrap',
};

const dismissButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: 0,
  lineHeight: 0,
  color: 'rgba(2, 6, 23, 0.55)',
};

const iconWrapBaseStyle: CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--shell-bg)',
  border: '1px solid var(--surface-border)',
  flex: '0 0 auto',
};

const variantMeta: Record<NonNullable<ToastItem['variant']>, { icon: typeof Info; accent: string; iconColor: string; surface?: string; border?: string }> = {
  default: {
    icon: Info,
    accent: 'var(--primary)',
    iconColor: 'var(--primary)',
  },
  destructive: {
    icon: XCircle,
    accent: 'var(--danger)',
    iconColor: 'var(--danger)',
    surface: 'rgba(254, 242, 242, 0.92)',
    border: 'rgba(239, 68, 68, 0.26)',
  },
  success: {
    icon: CheckCircle2,
    accent: 'var(--accent)',
    iconColor: 'var(--accent)',
    surface: 'rgba(236, 253, 245, 0.92)',
    border: 'rgba(16, 185, 129, 0.24)',
  },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const variant = toast.variant ?? 'default';
  const meta = variantMeta[variant];
  const Icon = meta.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      data-state={toast.open ? 'open' : 'closed'}
      className="toast-card"
      style={{
        ...toastCardStyle,
        background: 'white',
        border: `1px solid ${meta.border ?? 'var(--surface-border)'}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: '6px',
          background: `linear-gradient(180deg, ${meta.accent}, rgba(255,255,255,0))`,
          opacity: 0.95,
        }}
      />

      <div style={contentRowStyle}>
        <div style={{ ...iconWrapBaseStyle, color: meta.iconColor }}>
          <Icon size={18} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          {toast.title ? <p style={titleStyle}>{toast.title}</p> : null}
          {toast.description ? <p style={descriptionStyle}>{toast.description}</p> : null}
        </div>

        <button type="button" aria-label="Dismiss notification" style={dismissButtonStyle} onClick={() => onDismiss(toast.id)}>
          <X size={16} />
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
