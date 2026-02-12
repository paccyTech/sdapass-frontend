'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import { storeAuthSession } from '@/lib/auth';
import { ROLE_ROUTES } from '@/lib/rbac';
import { PasswordInput } from '@/components/ui/PasswordInput';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'member' | 'admin'>('member');
  const router = useRouter();

  const identifierLabel = useMemo(
    () => (mode === 'member' ? 'Phone number' : 'Email'),
    [mode],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const phoneNumber = formData.get('phoneNumber')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const password = formData.get('password')?.toString();

    if (mode === 'member' && (!phoneNumber || !password)) {
      setError('Phone number and password are required.');
      setIsLoading(false);
      return;
    }

    if (mode === 'admin' && (!email || !password)) {
      setError('Email and password are required.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          mode === 'member'
            ? { phoneNumber, password }
            : { email, password },
        ),
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload?.error ?? 'Invalid credentials. Please try again.';
        throw new Error(message);
      }

      const { token, user } = payload?.data ?? {};

      if (!token || !user?.role) {
        throw new Error('Unexpected login response. Please contact support.');
      }

      storeAuthSession(token, user);

      const destination = ROLE_ROUTES[user.role as keyof typeof ROLE_ROUTES] ?? '/';
      router.push(destination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <div style={toggleGroupStyle}>
        <button
          type="button"
          onClick={() => setMode('member')}
          disabled={isLoading}
          style={mode === 'member' ? activeToggleStyle : toggleStyle}
        >
          Phone Number
        </button>
        <button
          type="button"
          onClick={() => setMode('admin')}
          disabled={isLoading}
          style={mode === 'admin' ? activeToggleStyle : toggleStyle}
        >
          Email
        </button>
      </div>

      <label style={labelStyle}>
        {identifierLabel}
        {mode === 'member' ? (
          <input
            type="tel"
            name="phoneNumber"
            placeholder="E.g. +250780000001"
            required
            disabled={isLoading}
            style={inputStyle}
            autoComplete="tel"
          />
        ) : (
          <input
            type="email"
            name="email"
            placeholder="E.g. sdaumuganda@gmail.com"
            required
            disabled={isLoading}
            style={inputStyle}
            autoComplete="username"
          />
        )}
      </label>

      <div style={labelStyle}>
        <PasswordInput 
          name="password"
          placeholder="Your password"
          required
          disabled={isLoading}
          style={inputStyle}
          autoComplete="current-password"
        />
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        style={submitStyle}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#576b7f' }}>
          <input 
            type="checkbox" 
            name="remember" 
            disabled={isLoading}
            style={checkboxStyle} 
          />
          Remember device
        </label>
        <a href="/reset-password" style={ghostLinkStyle}>
          Forgot password?
        </a>
      </div>
    </form>
  );
}

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.6rem',
  fontWeight: 600,
  color: '#0b1f33',
};

const inputStyle: CSSProperties = {
  borderRadius: '16px',
  border: '1px solid rgba(12, 34, 56, 0.15)',
  padding: '0.95rem 1.1rem',
  fontSize: '1rem',
  background: 'rgba(255,255,255,0.9)',
  outline: 'none',
  transition: 'border 0.2s ease, box-shadow 0.2s ease',
};

const submitStyle: CSSProperties = {
  borderRadius: '18px',
  border: 'none',
  padding: '1rem 1.25rem',
  fontWeight: 600,
  fontSize: '1rem',
  color: 'white',
  cursor: 'pointer',
  background: '#0c2e56',
  boxShadow: '0 4px 12px rgba(12, 46, 86, 0.3)',
  opacity: 1,
  transition: 'opacity 0.2s ease',
};

const ghostLinkStyle: CSSProperties = {
  color: '#64748b',
  fontWeight: 500,
};

const checkboxStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  accentColor: '#1f9d77',
};

const errorStyle: CSSProperties = {
  background: 'rgba(220, 38, 38, 0.1)',
  color: '#dc2626',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  fontSize: '0.9rem',
  textAlign: 'center',
};

const toggleGroupStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  background: 'rgba(24, 76, 140, 0.08)',
  borderRadius: '999px',
  padding: '0.3rem',
  gap: '0.3rem',
};

const toggleBaseStyle: CSSProperties = {
  borderRadius: '999px',
  border: 'none',
  padding: '0.55rem 0.9rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const toggleStyle: CSSProperties = {
  ...toggleBaseStyle,
  background: 'transparent',
  color: '#184c8c',
};

const activeToggleStyle: CSSProperties = {
  ...toggleBaseStyle,
  background: '#184c8c',
  color: 'white',
  boxShadow: '0 10px 20px rgba(24, 76, 140, 0.25)',
};
