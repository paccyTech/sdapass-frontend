'use client';

import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { confirmPasswordReset } from '@/lib/api';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function PasswordResetConfirmPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token.trim()) {
      setStatus({ variant: 'error', message: 'A valid reset token is required.' });
      return;
    }

    if (password.length < 8) {
      setStatus({ variant: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ variant: 'error', message: 'Passwords do not match. Please re-enter them.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus(null);

      await confirmPasswordReset({ token: token.trim(), newPassword: password });

      setStatus({
        variant: 'success',
        message: 'Your password has been reset. You can now sign in with the new password.',
      });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update password. Request a fresh link and try again.';
      setStatus({ variant: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={wrapperStyle}>
      <div style={leftPanelStyle}>
        <div className="fade-up" style={contentContainerStyle}>
          <div style={logoContainerStyle}>
            <Image
              src="/sda-white-logo.png"
              alt="SDA Logo"
              width={200}
              height={200}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div style={contentStyle}>
            <h1 style={titleStyle}>Reset and return safely</h1>
            <p style={subtitleStyle}>
              Choose a new password to unlock your SDA account. Security and continuity, all in one step.
            </p>
          </div>
        </div>
        <div style={leftFooterStyle}>
          <Link href="/" style={leftFooterLinkStyle}>
            ← Home
          </Link>
        </div>
      </div>

      <div className="fade-up delay-1" style={rightPanelStyle}>
        <div style={formHeaderStyle}>
          <h2 style={formTitleStyle}>Choose a new password</h2>
          <p style={formSubtitleStyle}>Paste your secure token and create a strong new password.</p>
        </div>

        {status && <div style={statusStyle(status.variant)}>{status.message}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Reset token
            <input
              name="token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste the secure token here"
              style={inputStyle}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </label>

          <div style={labelStyle}>
            <PasswordInput
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter new password"
              style={inputStyle}
              disabled={isSubmitting}
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div style={labelStyle}>
            <PasswordInput
              name="confirmPassword"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter new password"
              style={inputStyle}
              disabled={isSubmitting}
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <p style={helperTextStyle}>
            The token auto-fills when you open the SMS link. If it is missing, copy it from the message and paste it
            above. Passwords must be at least 8 characters.
          </p>

          <button type="submit" style={submitStyle} disabled={isSubmitting}>
            {isSubmitting ? 'Updating password…' : 'Update password'}
          </button>
        </form>

        <div style={formFooterStyle}>
          <p style={helpTextStyle}>
            Need help?{' '}
            <Link href="/reset-password" style={helpLinkStyle}>
              Request a new link
            </Link>
          </p>
          <p style={helpTextStyle}>
            Ready to sign in?{' '}
            <Link href="/login" style={helpLinkStyle}>
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const wrapperStyle: CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
  overflow: 'hidden',
};

const leftPanelStyle: CSSProperties = {
  width: '50%',
  backgroundColor: '#0a1a2e',
  color: 'white',
  padding: '3rem',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  minHeight: '100vh',
  backgroundImage: 'linear-gradient(135deg, #0a1a2e 0%, #1a365d 100%)',
};

const rightPanelStyle: CSSProperties = {
  width: '50%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '3rem',
  backgroundColor: '#ffffff',
  overflowY: 'auto',
};

const contentContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  width: '100%',
  padding: '4rem 2rem 2rem',
};

const logoContainerStyle: CSSProperties = {
  marginBottom: '2.5rem',
  textAlign: 'center',
  width: '100%',
  maxWidth: '220px',
};

const contentStyle: CSSProperties = {
  maxWidth: '100%',
  margin: '0.5rem auto 0',
  textAlign: 'center',
  padding: 0,
};

const titleStyle: CSSProperties = {
  fontSize: '2.4rem',
  fontWeight: 700,
  margin: '0 0 1rem',
  lineHeight: 1.2,
};

const subtitleStyle: CSSProperties = {
  fontSize: '1.1rem',
  opacity: 0.88,
  lineHeight: 1.6,
  margin: 0,
};

const leftFooterStyle: CSSProperties = {
  marginTop: 'auto',
  textAlign: 'center',
  paddingTop: '2rem',
};

const leftFooterLinkStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.8)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'opacity 0.2s',
};

const formHeaderStyle: CSSProperties = {
  textAlign: 'center',
  marginBottom: '2.5rem',
  maxWidth: '420px',
  marginLeft: 'auto',
  marginRight: 'auto',
};

const formTitleStyle: CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#1a202c',
  margin: '0 0 0.5rem',
};

const formSubtitleStyle: CSSProperties = {
  color: '#4a5568',
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.6,
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '1.4rem',
  maxWidth: '420px',
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
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
  background: 'rgba(255,255,255,0.92)',
  outline: 'none',
  transition: 'border 0.2s ease, box-shadow 0.2s ease',
};

const helperTextStyle: CSSProperties = {
  fontSize: '0.9rem',
  color: '#4a5568',
  lineHeight: 1.5,
  textAlign: 'center',
};

const submitStyle: CSSProperties = {
  borderRadius: '18px',
  border: 'none',
  padding: '1rem 1.25rem',
  fontWeight: 600,
  fontSize: '1rem',
  color: 'white',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #184c8c, #1f9d77)',
  boxShadow: '0 15px 25px rgba(24, 76, 140, 0.28)',
  transition: 'transform 0.15s ease, box-shadow 0.2s ease',
};

const statusStyle = (variant: 'success' | 'error'): CSSProperties => ({
  padding: '0.95rem 1.1rem',
  borderRadius: '16px',
  fontSize: '0.96rem',
  fontWeight: 500,
  backgroundColor: variant === 'success' ? 'rgba(25, 135, 84, 0.12)' : 'rgba(200, 45, 80, 0.15)',
  color: variant === 'success' ? 'rgb(19, 110, 70)' : 'rgb(166, 33, 62)',
  border: `1px solid ${variant === 'success' ? 'rgba(25, 135, 84, 0.3)' : 'rgba(200, 45, 80, 0.3)'}`,
  margin: '0 auto 1.5rem',
  maxWidth: '420px',
});

const formFooterStyle: CSSProperties = {
  marginTop: '2rem',
  textAlign: 'center',
  maxWidth: '420px',
  marginLeft: 'auto',
  marginRight: 'auto',
  display: 'grid',
  gap: '0.75rem',
};

const helpTextStyle: CSSProperties = {
  color: '#718096',
  fontSize: '0.9rem',
  margin: 0,
};

const helpLinkStyle: CSSProperties = {
  color: '#3b82f6',
  textDecoration: 'none',
  fontWeight: 600,
};
