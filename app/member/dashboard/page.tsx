'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import type { HeroStat } from '@/components/dashboard/RoleHero';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchMemberPass, type MemberPassDetails, type MemberPassViewer } from '@/lib/api';
import { getRoleNavSections, getRoleSidebarSections } from '@/components/dashboard/roleNavigation';

const formatExpiryDate = (iso: string | null | undefined) => {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const contentWrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '1.25rem',
  width: '100%',
  maxWidth: '720px',
  margin: '0 auto',
  padding: '1.5rem',
};

const cardStyle: CSSProperties = {
  background: 'var(--surface-primary)',
  border: '1px solid var(--surface-border)',
  borderRadius: '18px',
  padding: '1.5rem',
  boxShadow: '0 16px 30px rgba(12, 34, 56, 0.08)',
  display: 'grid',
  gap: '1rem',
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.1rem',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const mutedTextStyle: CSSProperties = {
  margin: 0,
  color: 'var(--muted)',
  lineHeight: 1.6,
};

const detailRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(140px, 1fr) minmax(0, 2fr)',
  gap: '0.75rem',
};

const detailLabelStyle: CSSProperties = {
  fontSize: '0.85rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};

const detailValueStyle: CSSProperties = {
  color: 'var(--shell-foreground)',
  fontWeight: 600,
};

const primaryButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  borderRadius: '999px',
  padding: '0.6rem 1.4rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
  color: 'var(--on-primary)',
  boxShadow: '0 16px 32px rgba(24, 76, 140, 0.25)',
};

const secondaryButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  padding: '0.55rem 1.2rem',
  fontWeight: 600,
  border: '1px solid var(--surface-border)',
  background: 'transparent',
  color: 'var(--shell-foreground)',
  cursor: 'pointer',
};

const loadingContainerStyle: CSSProperties = {
  minHeight: '50vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const loadingSpinnerStyle: CSSProperties = {
  width: '3rem',
  height: '3rem',
  borderRadius: '50%',
  border: '4px solid color-mix(in srgb, var(--primary) 25%, transparent)',
  borderTopColor: 'var(--primary)',
  animation: 'dashboard-spin 0.8s linear infinite',
  margin: '0 auto 1.25rem',
};

const loadingTextStyle: CSSProperties = {
  margin: 0,
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const loadingSubtextStyle: CSSProperties = {
  margin: '0.35rem 0 0',
  color: 'var(--muted)',
  fontSize: '0.95rem',
};

const MemberDashboardPage = () => {
  const router = useRouter();
  const pathname = usePathname() ?? '/member/dashboard';
  const { token, user } = useAuthSession();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passDetails, setPassDetails] = useState<MemberPassDetails | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberPassViewer | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!token) {
      router.replace('/login');
      return;
    }

    if (user?.role !== 'MEMBER') {
      const destination = user?.role ? `/${user.role.toLowerCase()}/dashboard` : '/login';
      router.replace(destination);
      return;
    }

    const loadPass = async () => {
      if (!user?.id) {
        setError('User session missing identifier. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetchMemberPass(token, user.id);

        setPassDetails(response.pass ?? null);
        setMemberProfile(response.member ?? null);
      } catch (err) {
        console.error('Failed to fetch member pass', err);
        const message = err instanceof Error ? err.message : 'Unable to load your data right now. Please try again later.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadPass();
  }, [mounted, router, token, user]);

  const navSections = useMemo(() => getRoleNavSections('MEMBER', pathname), [pathname]);
  const sidebarSections = useMemo(() => getRoleSidebarSections('MEMBER'), []);

  const stats: HeroStat[] = passDetails
    ? [
        {
          label: 'Digital pass status',
          value: 'Active',
          trend: passDetails.expiresAt ? `Expires ${formatExpiryDate(passDetails.expiresAt)}` : 'Share this QR code at check-in',
        },
        {
          label: 'Most recent SMS',
          value: passDetails.smsSentAt ? formatExpiryDate(passDetails.smsSentAt) ?? 'Sent' : 'Not sent yet',
          trend: 'Keep your phone handy for alerts',
        },
      ]
    : [
        {
          label: 'Digital pass status',
          value: 'Not issued',
          trend: 'Ask your church administrator to generate a pass',
        },
        {
          label: 'Most recent SMS',
          value: 'No alerts',
          trend: 'You will receive SMS once your pass is active',
        },
      ];

  // Don't render anything until we're on the client side
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <DashboardShell
        role="MEMBER"
        navSections={navSections}
        sidebarSections={sidebarSections}
        currentUser={user}
      >
        <div style={loadingContainerStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={loadingSpinnerStyle} />
            <p style={loadingTextStyle}>Loading your dashboard…</p>
            <p style={loadingSubtextStyle}>Fetching your latest Umuganda status.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell
        role="MEMBER"
        navSections={navSections}
        sidebarSections={sidebarSections}
        currentUser={user}
      >
        <div style={contentWrapperStyle}>
          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>Unable to load your data</h2>
            <p style={mutedTextStyle}>{error}</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" style={primaryButtonStyle} onClick={() => window.location.reload()}>
                Try again
              </button>
              <button type="button" style={secondaryButtonStyle} onClick={() => router.push('/member/pass')}>
                View digital pass
              </button>
            </div>
          </article>
        </div>
      </DashboardShell>
    );
  }

  const formattedExpiry = formatExpiryDate(passDetails?.expiresAt);
  const heroHeadline = passDetails
    ? 'Your Umuganda pass is active'
    : user?.firstName
      ? `Welcome back, ${user.firstName}`
      : 'Welcome to your Umuganda dashboard';
  const heroSubheadline = passDetails
    ? formattedExpiry
      ? `Share your QR code at check-in. This pass expires ${formattedExpiry}.`
      : 'Share your QR code at check-in to verify your attendance quickly.'
    : 'Track your participation, receive SMS alerts, and access your digital pass once it is issued.';

  return (
    <DashboardShell
      role="MEMBER"
      hero={
        <RoleHero 
          role="MEMBER"
          headline={heroHeadline}
          subheadline={heroSubheadline}
          stats={stats}
        />
      }
      navSections={navSections}
      sidebarSections={sidebarSections}
      currentUser={user}
    >
      <RequireRole allowed={['MEMBER']}>
        <div style={contentWrapperStyle}>
          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>Pass summary</h2>
            <p style={mutedTextStyle}>
              {passDetails
                ? 'Your digital pass is ready. Share the QR code at Umuganda check-in and keep your profile up to date.'
                : 'Your pass has not been issued yet. Contact your church administrator if you believe this is an error.'}
            </p>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Status</span>
                <span style={detailValueStyle}>{passDetails ? 'Active' : 'Not issued'}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Member</span>
                <span style={detailValueStyle}>
                  {memberProfile
                    ? `${memberProfile.firstName ?? ''} ${memberProfile.lastName ?? ''}`.trim() || 'Member profile'
                    : user?.firstName
                      ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                      : 'Member profile not available'}
                </span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>National ID</span>
                <span style={detailValueStyle}>{memberProfile?.nationalId ?? 'Not provided'}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Pass token</span>
                <span style={detailValueStyle}>{passDetails?.token ?? 'Unavailable'}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Pass expires</span>
                <span style={detailValueStyle}>{formatExpiryDate(passDetails?.expiresAt) ?? 'Not scheduled'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" style={primaryButtonStyle} onClick={() => router.push('/member/pass')}>
                View digital pass
              </button>
              <button type="button" style={secondaryButtonStyle} onClick={() => router.push('/member/profile')}>
                Update profile
              </button>
            </div>
          </article>

          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>What to do next</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.75rem' }}>
              <li style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={detailLabelStyle}>Bring your ID</span>
                <p style={mutedTextStyle}>Carry your national ID and this digital pass for police verification on Umuganda day.</p>
              </li>
              <li style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={detailLabelStyle}>Keep contact details current</span>
                <p style={mutedTextStyle}>Update your phone number or email under profile so SMS alerts reach you.</p>
              </li>
              <li style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={detailLabelStyle}>Need help?</span>
                <p style={mutedTextStyle}>If your pass is missing or incorrect, contact your church administrator for assistance.</p>
              </li>
            </ul>
          </article>
        </div>
      </RequireRole>
    </DashboardShell>
  );
};

export default MemberDashboardPage;