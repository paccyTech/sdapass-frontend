'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  gap: '1rem',
  textAlign: 'center',
  background: 'rgba(255,255,255,0.85)',
  padding: '2.5rem',
  borderRadius: '24px',
  boxShadow: '0 20px 45px rgba(12,34,56,0.15)',
  maxWidth: '420px',
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
          <Pulse />
          <div>
            <h2 style={{ margin: '1rem 0 0.35rem', fontFamily: 'var(--font-display)' }}>
              Verifying your access
            </h2>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              We are confirming that your role is allowed to view this dashboard.
            </p>
            {user && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9em', color: 'var(--muted)' }}>
                Logged in as: {user.role}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
