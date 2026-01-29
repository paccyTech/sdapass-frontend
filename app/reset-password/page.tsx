'use client';

import type { CSSProperties, FormEvent } from 'react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { requestPasswordReset } from '@/lib/api';

export default function PasswordResetRequestPage() {
  const [nationalId, setNationalId] = useState('');
  const [nationalIdError, setNationalIdError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);

  const handleNationalIdChange = (value: string) => {
    setNationalId(value);

    if (!value.trim()) {
      setNationalIdError(null);
      return;
    }

    setNationalIdError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedNationalId = nationalId.trim();
    const trimmedEmail = email.trim();

    if (!normalizedNationalId && !trimmedEmail) {
      setStatus({ variant: 'error', message: 'Provide either a national ID or email address to continue.' });
      return;
    }

    setNationalIdError(null);

    try {
      setIsSubmitting(true);
      setStatus(null);

      await requestPasswordReset({
        nationalId: normalizedNationalId || undefined,
        email: trimmedEmail || undefined,
      });

      setStatus({
        variant: 'success',
        message:
          'If we find a matching account, a reset link has been sent to the registered phone number. The link expires in 60 minutes.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start password reset. Please try again.';
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
            <h1 style={titleStyle}>Secure access, simplified</h1>
            <p style={subtitleStyle}>
              Reset your SDA pass with the same trusted experience. We keep your access safe and seamless.
            </p>
          </div>
        </div>
        <div style={leftFooterStyle}>
          <Link href="/" style={leftFooterLinkStyle}>
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="fade-up delay-1" style={rightPanelStyle}>
        <div style={formHeaderStyle}>
          <h2 style={formTitleStyle}>Forgot your password?</h2>
          <p style={formSubtitleStyle}>Enter your details and we will send you a secure reset link.</p>
        </div>

        {status && <div style={statusStyle(status.variant)}>{status.message}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            National ID
            <input
              name="nationalId"
              value={nationalId}
              onChange={(event) => handleNationalIdChange(event.target.value)}
              placeholder="e.g. 1000000000000001"
              style={inputStyle}
              disabled={isSubmitting}
              autoComplete="off"
              inputMode="numeric"
              pattern="1\d{15}"
              maxLength={16}
              aria-invalid={Boolean(nationalIdError)}
            />
            {nationalIdError && <span style={fieldErrorStyle}>{nationalIdError}</span>}
          </label>

          <div style={dividerStyle}>
            <span style={dividerLineStyle} />
            <span style={dividerTextStyle}>or</span>
            <span style={dividerLineStyle} />
          </div>

          <label style={labelStyle}>
            Email address
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="e.g. union.admin@umuganda.rw"
              style={inputStyle}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </label>

          <p style={helperTextStyle}>Provide at least one identifier. Using your national ID is the fastest option.</p>

          <button type="submit" style={submitStyle} disabled={isSubmitting}>
            {isSubmitting ? 'Sending reset link…' : 'Send reset link'}
          </button>
        </form>

        <div style={formFooterStyle}>
          <p style={helpTextStyle}>
            Already have access?{' '}
            <Link href="/login" style={helpLinkStyle}>
              Back to sign in
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
  margin: '0.75rem 0 1.5rem',
  color: '#475569',
  fontSize: '0.95rem',
};

const fieldErrorStyle: CSSProperties = {
  display: 'block',
  marginTop: '0.25rem',
  color: '#b42318',
  fontSize: '0.8rem',
  fontWeight: 500,
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

const dividerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  color: '#a0aec0',
  fontSize: '0.85rem',
  justifyContent: 'center',
};

const dividerLineStyle: CSSProperties = {
  flex: 1,
  height: '1px',
  background: 'rgba(160, 174, 192, 0.35)',
};

const dividerTextStyle: CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
