"use client";

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiMail,
  FiMessageSquare,
  FiRefreshCcw,
  FiTrendingUp,
} from 'react-icons/fi';

import RequireRole from '@/components/RequireRole';
import { useAuthSession } from '@/hooks/useAuthSession';

interface ChannelStats {
  totalSent: number;
  delivered: number;
  failed: number;
  queued: number;
  lastSentAt: string | null;
}

interface TimelinePoint {
  date: string; // ISO date string
  smsSent: number;
  emailSent: number;
}

interface CommunicationEvent {
  id: string;
  channel: 'SMS' | 'Email';
  recipient: string;
  status: 'DELIVERED' | 'FAILED' | 'QUEUED';
  sentAt: string;
  subject?: string | null;
  snippet?: string | null;
}

interface CommunicationAnalyticsPayload {
  sms: ChannelStats;
  email: ChannelStats;
  timeline: TimelinePoint[];
  recent: CommunicationEvent[];
}

const fetchCommunicationAnalytics = async (): Promise<CommunicationAnalyticsPayload> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/communication/analytics', {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch communication analytics');
  }

  return response.json();
};

const containerStyle: CSSProperties = {
  display: 'grid',
  gap: '2.25rem',
  color: 'var(--shell-foreground)',
  fontFamily: 'var(--font-sans)',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1.5rem',
  flexWrap: 'wrap',
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.8rem',
  fontWeight: 600,
  color: '#1a365d',
  letterSpacing: '-0.02em',
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  gap: '0.85rem',
  alignItems: 'center',
};

const toolbarButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.45rem',
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  border: '1px solid #1a365d',
  background: 'white',
  color: '#1a365d',
  fontWeight: 500,
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: '#f7fafc',
    borderColor: '#2c5282',
  },
  '&:active': {
    background: '#ebf8ff',
    transform: 'translateY(1px)',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.35rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const statCard = (accent: string): CSSProperties => ({
  borderRadius: '12px',
  background: 'white',
  padding: '1.5rem',
  display: 'grid',
  gap: '0.75rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderColor: '#1a365d',
  },
});

const statIcon = (accent: string): CSSProperties => ({
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  borderRadius: '12px',
  background: 'rgba(26, 54, 93, 0.1)',
  color: '#1a365d',
});

const timelineShellStyle: CSSProperties = {
  borderRadius: '12px',
  background: 'white',
  border: '1px solid #e2e8f0',
  padding: '1.5rem',
  display: 'grid',
  gap: '1.25rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const miniChartStyle: CSSProperties = {
  display: 'flex',
  gap: '0.35rem',
  alignItems: 'flex-end',
  height: 144,
};

const legendStyle: CSSProperties = {
  display: 'flex',
  gap: '1.25rem',
  flexWrap: 'wrap',
  alignItems: 'center',
  fontSize: '0.85rem',
  color: 'var(--muted)',
};

const legendSwatch = (color: string): CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: color,
  boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 20%, transparent)`,
});

const eventsCardStyle: CSSProperties = {
  borderRadius: '12px',
  background: 'white',
  border: '1px solid #e2e8f0',
  padding: '1.5rem',
  display: 'grid',
  gap: '1.25rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const eventsTableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
};

const eventsHeaderCell: CSSProperties = {
  textAlign: 'left',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#4a5568',
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid #e2e8f0',
  fontWeight: 600,
  backgroundColor: '#f8fafc',
};

const eventsCell: CSSProperties = {
  padding: '0.75rem',
  fontSize: '0.9rem',
  borderBottom: '1px solid #edf2f7',
  verticalAlign: 'middle',
  '&:first-of-type': {
    paddingLeft: '1rem',
  },
  '&:last-of-type': {
    paddingRight: '1rem',
  },
};

const badgeStyle = (tone: 'success' | 'warning' | 'danger' | 'pending'): CSSProperties => {
  const palette: Record<typeof tone, { bg: string; color: string; border: string }> = {
    success: { bg: 'rgba(72, 187, 120, 0.1)', color: '#2f855a', border: 'rgba(72, 187, 120, 0.3)' },
    warning: { bg: 'rgba(237, 137, 54, 0.1)', color: '#c05621', border: 'rgba(237, 137, 54, 0.3)' },
    danger: { bg: 'rgba(245, 101, 101, 0.1)', color: '#c53030', border: 'rgba(245, 101, 101, 0.3)' },
    pending: { bg: 'rgba(66, 153, 225, 0.1)', color: '#2b6cb0', border: 'rgba(66, 153, 225, 0.3)' },
  } as const;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    borderRadius: '999px',
    padding: '0.25rem 0.65rem',
    background: palette[tone].bg,
    color: palette[tone].color,
    border: `1px solid ${palette[tone].border}`,
    lineHeight: 1.2,
  } satisfies CSSProperties;
};

const formatNumber = (value: number) => value.toLocaleString('en-US');

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    console.error('Failed to format date', error);
    return value;
  }
};

const CommunicationDashboard = () => {
  const { user } = useAuthSession();
  const role = user?.role;
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CommunicationAnalyticsPayload | null>(null);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await fetchCommunicationAnalytics();
      setAnalytics(payload);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching communication analytics:', err);
      setError(err instanceof Error ? err.message : 'Unable to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAnalytics();
  }, []);

  const deliveryRate = useMemo(() => {
    if (!analytics) {
      return { sms: 0, email: 0 };
    }
    return {
      sms: analytics.sms.totalSent ? Math.round((analytics.sms.delivered / analytics.sms.totalSent) * 100) : 0,
      email: analytics.email.totalSent ? Math.round((analytics.email.delivered / analytics.email.totalSent) * 100) : 0,
    };
  }, [analytics]);

  const volumeTrend = useMemo(() => {
    if (!analytics || analytics.timeline.length < 2) {
      return { sms: '0%', email: '0%' };
    }
    
    // Calculate trend based on the last two data points
    const last = analytics.timeline[analytics.timeline.length - 1];
    const prev = analytics.timeline[analytics.timeline.length - 2];
    
    const smsGrowth = prev.smsSent ? ((last.smsSent - prev.smsSent) / prev.smsSent) * 100 : 0;
    const emailGrowth = prev.emailSent ? ((last.emailSent - prev.emailSent) / prev.emailSent) * 100 : 0;

    return {
      sms: `${smsGrowth >= 0 ? '+' : ''}${Math.abs(smsGrowth).toFixed(1)}%`,
      email: `${emailGrowth >= 0 ? '+' : ''}${Math.abs(emailGrowth).toFixed(1)}%`,
    };
  }, [analytics]);

  const maxVolume = useMemo(() => {
    if (!analytics) return 1;
    return Math.max(...analytics.timeline.map((point) => Math.max(point.smsSent, point.emailSent)), 1);
  }, [analytics]);

  return (
    <RequireRole allowed={role ?? 'CHURCH_ADMIN'}>
      <div style={{ padding: '1.75rem', paddingBottom: '4rem' }}>
        <div style={containerStyle}>
          <header style={headerStyle}>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <h1 style={heroTitleStyle}>SMS &amp; Email Analytics</h1>
              <p style={{ margin: 0, color: 'var(--muted)', maxWidth: 540 }}>
                Track how the system is communicating with members and administrators. Monitor delivery success for onboarding SMS,
                credential emails, and automated reminders in one place.
              </p>
            </div>
            <div style={toolbarStyle}>
              <button
                type="button"
                onClick={refreshAnalytics}
                disabled={loading}
                style={{
                  ...toolbarButtonStyle,
                  opacity: loading ? 0.65 : 1,
                  cursor: loading ? 'progress' : 'pointer',
                }}
              >
                <FiRefreshCcw size={16} />
                {loading ? 'Refreshing…' : `Last updated: ${lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}`}
              </button>
            </div>
          </header>

          {error && (
            <div
              style={{
                padding: '1rem 1.2rem',
                borderRadius: 18,
                border: '1px solid rgba(220,53,69,0.35)',
                background: 'rgba(220,53,69,0.12)',
                color: '#B91C1C',
              }}
            >
              <strong>Unable to load analytics.</strong>
              <p style={{ margin: '0.3rem 0 0' }}>{error}</p>
            </div>
          )}

          <section style={gridStyle}>
            <article style={statCard('#1D4ED8')}>
              <div style={statIcon('#1D4ED8')}>
                <FiMessageSquare size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 700 }}>
                  {formatNumber(analytics?.sms.totalSent ?? 0)}
                </h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>SMS sent this period</p>
              </div>
              <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
                <span>{formatNumber(analytics?.sms.delivered ?? 0)} delivered</span>
                <span>{volumeTrend.sms} vs. prior</span>
              </footer>
            </article>

            <article style={statCard('#9333EA')}>
              <div style={statIcon('#9333EA')}>
                <FiMail size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 700 }}>
                  {formatNumber(analytics?.email.totalSent ?? 0)}
                </h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Emails dispatched</p>
              </div>
              <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
                <span>{formatNumber(analytics?.email.delivered ?? 0)} delivered</span>
                <span>{volumeTrend.email} vs. prior</span>
              </footer>
            </article>

            <article style={statCard('#059669')}>
              <div style={statIcon('#059669')}>
                <FiTrendingUp size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 700 }}>
                  {deliveryRate.sms.toFixed(1)}%
                </h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>SMS delivery rate</p>
              </div>
              <footer style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                Last SMS: {formatDateTime(analytics?.sms.lastSentAt ?? null)}
              </footer>
            </article>

            <article style={statCard('#DB2777')}>
              <div style={statIcon('#DB2777')}>
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 700 }}>
                  {formatNumber((analytics?.sms.failed ?? 0) + (analytics?.email.failed ?? 0))}
                </h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Messages requiring follow-up</p>
              </div>
              <footer style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                {formatNumber(analytics?.sms.failed ?? 0)} SMS · {formatNumber(analytics?.email.failed ?? 0)} emails
              </footer>
            </article>
          </section>

          <section style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', alignItems: 'stretch' }}>
            <article style={timelineShellStyle}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>14-day delivery trend</h2>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                    Monitor daily throughput to anticipate capacity needs before peak Umuganda weekends.
                  </p>
                </div>
              </header>

              <div style={miniChartStyle}>
                {analytics?.timeline.map((point) => {
                  const smsHeight = Math.max((point.smsSent / maxVolume) * 100, 6);
                  const emailHeight = Math.max((point.emailSent / maxVolume) * 100, 4);

                  return (
                    <div key={point.date} style={{ display: 'grid', gap: '0.25rem', justifyItems: 'center', minWidth: 20 }}>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end' }}>
                        <div
                          style={{
                            width: 8,
                            height: `${smsHeight}%`,
                            borderRadius: 999,
                            background: 'linear-gradient(180deg, rgba(29,78,216,0.95), rgba(29,78,216,0.35))',
                          }}
                        />
                        <div
                          style={{
                            width: 8,
                            height: `${emailHeight}%`,
                            borderRadius: 999,
                            background: 'linear-gradient(180deg, rgba(147,51,234,0.95), rgba(147,51,234,0.35))',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{point.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>

              <footer style={legendStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={legendSwatch('#1D4ED8')} /> SMS sent
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={legendSwatch('#9333EA')} /> Emails sent
                </span>
              </footer>
            </article>

            <article
              style={{
                borderRadius: 20,
                background: 'var(--surface-primary)',
                border: '1px solid var(--surface-border)',
                padding: '1.6rem',
                display: 'grid',
                gap: '1rem',
              }}
            >
              <header style={{ display: 'grid', gap: '0.35rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Channel health</h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
                  Gauge how each communication channel is performing right now.
                </p>
              </header>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>SMS Delivery</span>
                    <span>{deliveryRate.sms.toFixed(1)}%</span>
                  </div>
                  <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(29,78,216,0.12)' }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${Math.min(deliveryRate.sms, 100)}%`,
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, rgba(29,78,216,1), rgba(37,99,235,0.75))',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    <span>{formatNumber(analytics?.sms.delivered ?? 0)} delivered</span>
                    <span>{formatNumber(analytics?.sms.failed ?? 0)} failed</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>Email Delivery</span>
                    <span>{deliveryRate.email.toFixed(1)}%</span>
                  </div>
                  <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(147,51,234,0.12)' }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${Math.min(deliveryRate.email, 100)}%`,
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, rgba(147,51,234,1), rgba(192,38,211,0.75))',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    <span>{formatNumber(analytics?.email.delivered ?? 0)} delivered</span>
                    <span>{formatNumber(analytics?.email.failed ?? 0)} failed</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <p style={{ margin: 0 }}>
                  Queued messages are automatically retried. If failure counts climb consecutively, confirm Twilio and SMTP credentials in the
                  integration settings.
                </p>
              </div>
            </article>
          </section>

          <section style={eventsCardStyle}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Most recent activity</h2>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Inspect the latest messages the platform attempted to deliver across SMS and email.
                </p>
              </div>
            </header>

            <div style={{ overflowX: 'auto' }}>
              <table style={eventsTableStyle}>
                <thead>
                  <tr>
                    <th style={eventsHeaderCell}>Channel</th>
                    <th style={eventsHeaderCell}>Recipient</th>
                    <th style={eventsHeaderCell}>Status</th>
                    <th style={eventsHeaderCell}>Sent at</th>
                    <th style={eventsHeaderCell}>Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.recent.map((event) => {
                    const tone =
                      event.status === 'DELIVERED'
                        ? 'success'
                        : event.status === 'FAILED'
                        ? 'danger'
                        : 'pending';

                    return (
                      <tr key={event.id}>
                        <td style={eventsCell}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600 }}>
                            {event.channel === 'SMS' ? <FiMessageSquare size={16} /> : <FiMail size={16} />}
                            {event.channel}
                          </span>
                        </td>
                        <td style={eventsCell}>{event.recipient}</td>
                        <td style={eventsCell}>
                          <span style={badgeStyle(tone)}>
                            {event.status === 'DELIVERED' && <FiCheckCircle size={13} />}
                            {event.status === 'FAILED' && <FiAlertTriangle size={13} />}
                            {event.status === 'QUEUED' && <FiTrendingUp size={13} />}
                            {event.status.toLowerCase()}
                          </span>
                        </td>
                        <td style={eventsCell}>{formatDateTime(event.sentAt)}</td>
                        <td style={{ ...eventsCell, maxWidth: 320 }}>
                          <div style={{ display: 'grid', gap: '0.2rem' }}>
                            {event.subject && (
                              <strong style={{ fontSize: '0.85rem', color: 'var(--shell-foreground)' }}>{event.subject}</strong>
                            )}
                            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{event.snippet ?? '—'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!analytics?.recent.length && (
                    <tr>
                      <td style={{ ...eventsCell, textAlign: 'center' }} colSpan={5}>
                        No communication events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </RequireRole>
  );
};

export default CommunicationDashboard;
