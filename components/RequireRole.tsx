'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

import { useAuthSession } from '@/hooks/useAuthSession';
import { RoleKey, ROLE_ROUTES } from '@/lib/rbac';

const gateStyles: CSSProperties = {
  minHeight: 'calc(100vh - 200px)',
  display: 'grid',
  placeItems: 'center',
  padding: '3rem',
};

const panelStyles: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  textAlign: 'center',
  background: '#ffffff',
  padding: '3rem',
  borderRadius: '32px',
  boxShadow: '0 32px 64px rgba(12,34,56,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
  maxWidth: '480px',
  border: '1px solid rgba(15, 51, 92, 0.1)',
};

type RequireRoleProps = {
  allowed: RoleKey | RoleKey[];
  children: ReactNode;
};

type Status = 'checking' | 'authorized' | 'redirecting';

const makeArray = (value: RoleKey | RoleKey[]): RoleKey[] =>
  Array.isArray(value) ? value : [value];

const Pulse = () => (
  <div
    style={{
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #184c8c, #1f9d77)',
      animation: 'pulse 1.6s ease-in-out infinite',
      margin: '0 auto',
    }}
  />
);

const gateKeyframes = `
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.12); opacity: 0.5; }
  100% { transform: scale(1); opacity: 0.9; }
}`;

type StyleInsertionState = { inserted: boolean };
const styleState: StyleInsertionState = { inserted: false };

const ensurePulseKeyframes = () => {
  if (typeof document === 'undefined' || styleState.inserted) {
    return;
  }
  const node = document.createElement('style');
  node.innerHTML = gateKeyframes;
  document.head.appendChild(node);
  styleState.inserted = true;
};

export default function RequireRole({ allowed, children }: RequireRoleProps) {
  const router = useRouter();
  const { token, user } = useAuthSession();
  const [status, setStatus] = useState<Status>('checking');
  const [mounted, setMounted] = useState(false);

  const roles = useMemo(() => makeArray(allowed), [allowed]);

  useEffect(() => {
    setMounted(true);
    ensurePulseKeyframes();
    
    // Only run auth checks on client side
    if (mounted) {
      console.log('Role check - User:', { role: user?.role, allowedRoles: roles });
      
      if (status === 'redirecting') {
        return;
      }

      if (!token || !user) {
        console.log('No token or user, redirecting to login');
        setStatus('redirecting');
        router.replace('/login');
        return;
      }

      if (!roles.includes(user.role)) {
        console.log(`User role ${user.role} not in allowed roles:`, roles);
        setStatus('redirecting');
        const destination = ROLE_ROUTES[user.role] ?? '/';
        console.log('Redirecting to:', destination);
        router.replace(destination);
        return;
      }

      console.log('User authorized, role check passed');
      setStatus('authorized');
    }
  }, [token, user, roles, router, status, mounted]);

  // Don't render anything until we're on the client side
  if (!mounted) {
    return null;
  }

  if (status !== 'authorized') {
    return (
      <div style={gateStyles}>
        <div style={panelStyles}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Shield size={48} color="#1f9d77" />
          </div>
          <Pulse />
          <div>
            <h2 style={{ margin: '1rem 0 0.35rem', fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#1a365d' }}>
              Verifying Access
            </h2>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6, fontSize: '1rem' }}>
              Please wait while we confirm your permissions and secure access to this area.
            </p>
            {user && (
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.9em', color: '#64748b', fontWeight: 500 }}>
                Role: {user.role.replace('_', ' ').toLowerCase()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
