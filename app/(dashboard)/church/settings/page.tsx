'use client';

import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { toast } from '@/components/ui/use-toast';
import { useAuthSession } from '@/hooks/useAuthSession';
import { storeAuthSession } from '@/lib/auth';
import { changePasswordRequest, fetchMe, updateMe } from '@/lib/api';

export default function ChurchSettingsPage() {
  const session = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const shellConfig = useMemo(
    () => ({
      hero: (
        <RoleHero
          role="CHURCH_ADMIN"
          headline="Church Settings"
          subheadline="Manage your profile information and secure your account."
        />
      ),
    }),
    [],
  );

  useDashboardShellConfig(shellConfig);

  useEffect(() => {
    if (!session.token) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetchMe(session.token)
      .then((user) => {
        if (!active) {
          return;
        }
        setFirstName(user.firstName ?? '');
        setLastName(user.lastName ?? '');
        setEmail(user.email ?? '');
        setPhoneNumber(user.phoneNumber ?? '');
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load settings.';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [session.token]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session.token || !session.user) {
      toast({ title: 'Error', description: 'Session expired. Please sign in again.', variant: 'destructive' });
      return;
    }

    const nextFirstName = firstName.trim();
    const nextLastName = lastName.trim();
    const nextEmail = email.trim();
    const nextPhone = phoneNumber.trim();

    if (!nextFirstName || !nextLastName || !nextPhone) {
      toast({ title: 'Missing fields', description: 'First name, last name, and phone number are required.', variant: 'destructive' });
      return;
    }

    try {
      setSavingProfile(true);

      const updated = await updateMe(session.token, {
        firstName: nextFirstName,
        lastName: nextLastName,
        phoneNumber: nextPhone,
        email: nextEmail ? nextEmail : null,
      });

      storeAuthSession(session.token, {
        ...session.user,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phoneNumber: updated.phoneNumber,
        email: updated.email ?? undefined,
      });

      toast({
        title: 'Profile updated',
        description: 'Your account details have been saved.',
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session.token) {
      toast({ title: 'Error', description: 'Session expired. Please sign in again.', variant: 'destructive' });
      return;
    }

    if (!currentPassword || !newPassword) {
      toast({ title: 'Missing fields', description: 'Enter your current password and a new password.', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: 'Weak password', description: 'New password must be at least 8 characters.', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Passwords do not match', description: 'Please re-type the new password.', variant: 'destructive' });
      return;
    }

    try {
      setSavingPassword(true);
      await changePasswordRequest(session.token, {
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <RequireRole allowed="CHURCH_ADMIN">
      <div style={pageStyle}>
        {loading ? (
          <div style={panelStyle}>
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem 0' }}>Loading settings…</div>
          </div>
        ) : (
          <>
            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <h3 style={panelTitleStyle}>My profile</h3>
                <p style={panelSubtitleStyle}>Update your personal information used across the church dashboard.</p>
              </div>

              <form onSubmit={handleProfileSubmit} style={formStyle}>
                <label style={labelStyle}>
                  First name
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} disabled={savingProfile} />
                </label>

                <label style={labelStyle}>
                  Last name
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} disabled={savingProfile} />
                </label>

                <label style={labelStyle}>
                  Phone number
                  <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={inputStyle} disabled={savingProfile} />
                </label>

                <label style={labelStyle}>
                  Email (optional)
                  <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} disabled={savingProfile} />
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={savingProfile} style={primaryButtonStyle}>
                    {savingProfile ? 'Saving…' : 'Save profile'}
                  </button>
                </div>
              </form>
            </section>

            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <h3 style={panelTitleStyle}>Security</h3>
                <p style={panelSubtitleStyle}>Change your password regularly to keep your account secure.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} style={formStyle}>
                <div style={labelStyle}>
                  <PasswordInput
                    name="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    style={inputStyle}
                    disabled={savingPassword}
                    autoComplete="current-password"
                  />
                </div>

                <div style={labelStyle}>
                  <PasswordInput
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 characters)"
                    style={inputStyle}
                    disabled={savingPassword}
                    autoComplete="new-password"
                  />
                </div>

                <div style={labelStyle}>
                  <PasswordInput
                    name="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={inputStyle}
                    disabled={savingPassword}
                    autoComplete="new-password"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={savingPassword} style={primaryButtonStyle}>
                    {savingPassword ? 'Updating…' : 'Update password'}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </div>
    </RequireRole>
  );
}

const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  maxWidth: '900px',
  margin: '0 auto',
  width: '100%',
};

const panelStyle: CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '18px',
  border: '1px solid var(--surface-border)',
  padding: '1.5rem',
  display: 'grid',
  gap: '1.25rem',
};

const panelHeaderStyle: CSSProperties = {
  display: 'grid',
  gap: '0.25rem',
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: 700,
  color: 'var(--shell-foreground)',
};

const panelSubtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.95rem',
  color: 'var(--muted)',
  lineHeight: 1.55,
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
  fontWeight: 600,
  color: '#0b1f33',
};

const inputStyle: CSSProperties = {
  borderRadius: '12px',
  border: '1px solid rgba(12, 34, 56, 0.18)',
  padding: '0.85rem 1rem',
  fontSize: '0.95rem',
  background: 'rgba(255,255,255,0.92)',
  outline: 'none',
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: '14px',
  border: 'none',
  padding: '0.85rem 1.1rem',
  fontWeight: 700,
  fontSize: '0.95rem',
  color: 'white',
  cursor: 'pointer',
  background: '#0a1a2e',
  boxShadow: '0 12px 22px rgba(10, 26, 46, 0.28)',
};
