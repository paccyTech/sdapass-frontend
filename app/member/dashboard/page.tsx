'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import { ActionMatrix } from '@/components/dashboard/ActionMatrix';
import type { HeroStat } from '@/components/dashboard/RoleHero';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchMemberPass } from '@/lib/api';
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

const MemberDashboardPage = () => {
  const router = useRouter();
  const { token, user } = useAuthSession();
  const pathname = usePathname() ?? '/member/dashboard';
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Set mounted state when component mounts on client
  useEffect(() => {
    setMounted(true);
    
    // Only run auth checks on client side
    if (mounted) {
      console.log('Auth state changed:', { user, hasToken: !!token });
      if (!token) {
        console.log('No auth token found, redirecting to login');
        router.push('/login');
      } else if (user?.role !== 'MEMBER') {
        console.log(`User role is ${user?.role}, redirecting to appropriate dashboard`);
        const rolePath = user?.role ? `/${user.role.toLowerCase()}/dashboard` : '/login';
        router.push(rolePath);
      }
    }
  }, [token, user, router, mounted]);

  const [memberPass, setMemberPass] = useState<{
    token: string;
    qrPayload: string;
    smsSentAt: string | null;
    expiresAt: string | null;
  } | null>(null);

  const [participationHistory] = useState<Array<{
    status: 'Present' | 'Absent' | 'Excused';
    date: string;
    theme: string;
    hours: string;
  }>>([]);

  const [upcomingSessions] = useState<Array<{
    date: string;
    theme: string;
    callTime: string;
    location: string;
  }>>([]);

  const [baseStats, setBaseStats] = useState<HeroStat[]>([
    { label: 'Attendance streak', value: '0 weeks', trend: 'Start attending to build your streak' },
    { label: 'Verified passes', value: '0', trend: 'No scans yet' },
    { label: 'Community service hours', value: '0h', trend: 'Attend sessions to log hours' },
    { label: 'SMS alerts received', value: '0', trend: 'You will receive updates here' },
  ]);

  // Fetch member pass data
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user?.id) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const passData = await fetchMemberPass(token, user.id).catch(() => ({ pass: null }));
        
        if (passData?.pass) {
          setMemberPass(passData.pass);
          setBaseStats(prevStats => {
            const updated = [...prevStats];
            updated[1] = {
              ...updated[1],
              value: '1',
              trend: 'Active pass available'
            };
            return updated;
          });
        }
      } catch (err) {
        console.error('Error fetching member data:', err);
        setError('Failed to load member data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user?.id]);

  // Get navigation and sidebar sections
  const navSections = useMemo(() => getRoleNavSections('MEMBER', pathname), [pathname]);
  const sidebarSections = useMemo(() => getRoleSidebarSections('MEMBER'), []);

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
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading your dashboard...</p>
            {user && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}> 
                Logged in as {user.firstName} {user.lastName}
              </p>
            )}
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
        <div className="p-8 max-w-2xl mx-auto">
          <div className="border-l-4 p-4" style={{ backgroundColor: 'var(--surface-soft)', borderColor: 'var(--danger)' }}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--danger)' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium" style={{ color: 'var(--shell-foreground)' }}>Error loading dashboard</h3>
                <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ 
                      backgroundColor: 'var(--surface-soft)', 
                      color: 'var(--danger)',
                      borderColor: 'var(--danger)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = 'var(--primary)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = 'var(--danger)';
                    }}
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const formattedExpiry = formatExpiryDate(memberPass?.expiresAt);
  const heroHeadline = memberPass
    ? 'Your Umuganda pass is active'
    : user?.firstName
      ? `Welcome back, ${user.firstName}`
      : 'Welcome to your Umuganda dashboard';
  const heroSubheadline = memberPass
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
          stats={baseStats}
        />
      }
      navSections={navSections}
      sidebarSections={sidebarSections}
      currentUser={user}
    >
      <RequireRole allowed={['MEMBER']}>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border p-6 shadow-sm" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--surface-border)' }}>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--shell-foreground)' }}>Recent Participation</h2>
            <div className="space-y-4">
              {participationHistory.length > 0 ? (
                participationHistory.map((session, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: 'var(--surface-border)' }}>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--shell-foreground)' }}>{session.theme}</div>
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>{session.date} • {session.hours}</div>
                    </div>
                    <span 
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        session.status === 'Present' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--muted)' }}>No participation history found</p>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <article className="rounded-lg border p-6 shadow-sm" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--surface-border)' }}>
              <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--shell-foreground)' }}>Upcoming Session</h2>
              {upcomingSessions.length > 0 ? (
                <>
                  <div className="mb-4">
                    <div className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Theme</div>
                    <div style={{ color: 'var(--shell-foreground)' }}>{upcomingSessions[0].theme}</div>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Date</div>
                      <div style={{ color: 'var(--shell-foreground)' }}>{upcomingSessions[0].date}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Call Time</div>
                      <div style={{ color: 'var(--shell-foreground)' }}>{upcomingSessions[0].callTime}</div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Location</div>
                    <div style={{ color: 'var(--shell-foreground)' }}>
                      {user?.churchId ? (
                        <span>Your registered church</span>
                      ) : (
                        <span style={{ color: 'var(--accent)' }}>Please update your profile with a church</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--muted)' }}>No upcoming sessions scheduled. Check back later for updates.</p>
              )}
              <button
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 w-full"
                style={{ 
                  backgroundColor: 'var(--primary)', 
                  color: '#ffffff',
                  borderColor: 'var(--primary)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                }}
                onClick={() => {
                  alert('Calendar integration coming soon');
                }}
                disabled={upcomingSessions.length === 0}
              >
                Add to Calendar
              </button>
            </article>

            <ActionMatrix emphasisRole="MEMBER" />
          </section>
        </div>
      </RequireRole>
    </DashboardShell>
  );
};

export default MemberDashboardPage;