"use client";

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconChecklist,
  IconChevronRight,
  IconTrendingUp,
  IconUsersGroup,
  IconUserPlus,
} from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import {
  useDashboardShellConfig,
  type DashboardShellOverrides,
} from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  fetchAttendance,
  fetchChurchDetail,
  fetchChurchMembers,
  fetchUpcomingSessions,
  type AttendanceRecordSummary,
  type ChurchSummary,
  type MemberSummary,
  type UpcomingSession,
} from '@/lib/api';

type DashboardStatus = 'idle' | 'loading' | 'loaded' | 'error';

type SparklinePoint = {
  label: string;
  value: number;
};

const containerStyle: CSSProperties = {
  display: 'grid',
  gap: '2.4rem',
  fontFamily: 'var(--font-sans)',
  color: 'var(--shell-foreground)',
};

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.2rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const cardStyle: CSSProperties = {
  background: 'var(--surface-primary)',
  borderRadius: '20px',
  padding: '1.75rem',
  display: 'grid',
  gap: '1.1rem',
  boxShadow: '0 18px 36px rgba(12, 32, 62, 0.12)',
  border: '1px solid color-mix(in srgb, var(--surface-border) 60%, transparent)',
};

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.1rem',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const cardSubtitleStyle: CSSProperties = {
  marginTop: '0.35rem',
  color: 'var(--muted)',
  fontSize: '0.9rem',
  lineHeight: 1.5,
};

const statCardStyle = (accent: string): CSSProperties => ({
  ...cardStyle,
  gap: '0.6rem',
  border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
  boxShadow: `0 18px 38px color-mix(in srgb, ${accent} 22%, transparent)`,
});

const statIconStyle = (accent: string): CSSProperties => ({
  width: '42px',
  height: '42px',
  borderRadius: '14px',
  display: 'grid',
  placeItems: 'center',
  background: `color-mix(in srgb, ${accent} 25%, transparent)`,
  color: accent,
});

const statValueStyle: CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

const statMetaStyle: CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.9rem',
};

const heroStyle: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(22, 65, 145, 0.9), rgba(31, 157, 119, 0.92))',
  borderRadius: '28px',
  padding: '2.4rem',
  color: 'rgba(255,255,255,0.95)',
  display: 'grid',
  gap: '1.8rem',
  boxShadow: '0 32px 68px rgba(14, 52, 102, 0.38)',
};

const heroHeaderStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.6rem',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
};

const heroMetricsStyle: CSSProperties = {
  display: 'grid',
  gap: '1.2rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
};

const heroMetricStyle: CSSProperties = {
  display: 'grid',
  gap: '0.3rem',
};

const heroMetricLabel: CSSProperties = {
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  color: 'rgba(255,255,255,0.72)',
};

const heroMetricValue: CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

const splitGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.4rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
};

const listStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const quickActionsStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const quickActionCard = (accent: string): CSSProperties => ({
  borderRadius: '18px',
  padding: '1.4rem',
  border: '1px solid color-mix(in srgb, var(--surface-border) 60%, transparent)',
  background: 'color-mix(in srgb, var(--surface-soft) 20%, transparent)',
  display: 'grid',
  gap: '0.75rem',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  color: 'var(--shell-foreground)',
  textDecoration: 'none',
  boxShadow: '0 14px 28px rgba(10, 26, 48, 0.08)',
});

const quickActionHeader = (accent: string): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
  color: accent,
  fontWeight: 600,
  fontSize: '1rem',
});

const memberRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '0.8rem 1rem',
  borderRadius: '14px',
  background: 'color-mix(in srgb, var(--surface-soft) 35%, transparent)',
};

const emptyStateStyle: CSSProperties = {
  padding: '1.2rem 1rem',
  borderRadius: '16px',
  background: 'color-mix(in srgb, var(--surface-soft) 25%, transparent)',
  color: 'var(--muted)',
  fontSize: '0.9rem',
};

const loadingCardStyle: CSSProperties = {
  ...cardStyle,
  minHeight: '320px',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
};

const formatNumber = (value: number): string => new Intl.NumberFormat().format(value);
const formatPercent = (value: number): string => `${Math.min(100, Math.max(0, Math.round(value)))}%`;
const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatRelative = (value: Date | null | undefined): string => {
  if (!value) {
    return 'No recent activity';
  }
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const now = Date.now();
  const diff = value.getTime() - now;
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  return formatter.format(days, 'day');
};

const Sparkline = ({ data, accentColor = '#1f9d77' }: { data: SparklinePoint[]; accentColor?: string }) => {
  if (!data.length) {
    return <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>No attendance captured yet.</p>;
  }

  const width = 320;
  const height = 112;
  const paddingX = 14;
  const paddingY = 18;
  const values = data.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const coordinates = data.map((point, index) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((point.value - min) / range) * (height - 2 * paddingY);
    return { x, y };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1]?.x.toFixed(2)} ${height - paddingY} L ${
    coordinates[0]?.x.toFixed(2)
  } ${height - paddingY} Z`;

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true" style={{ overflow: 'visible' }}>
        <path d={areaPath} fill={`${accentColor}1f`} stroke="none" />
        <path d={linePath} fill="none" stroke={accentColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point, index) => (
          <circle
            key={data[index]?.label ?? index}
            cx={point.x}
            cy={point.y}
            r={3.5}
            fill="#fff"
            stroke={accentColor}
            strokeWidth={2}
          />
        ))}
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '0.75rem',
          flexWrap: 'wrap',
          color: 'rgba(28,39,51,0.65)',
          fontSize: '0.82rem',
        }}
      >
        {data.map((point) => (
          <div key={point.label} style={{ display: 'grid', gap: '0.1rem', minWidth: '44px' }}>
            <span>{point.label}</span>
            <strong style={{ color: 'var(--shell-foreground)', fontWeight: 600 }}>{Math.round(point.value)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ChurchAdminDashboard() {
  const { token, user } = useAuthSession();
  const [status, setStatus] = useState<DashboardStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [church, setChurch] = useState<ChurchSummary | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecordSummary[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);

  useEffect(() => {
    if (!token || !user?.churchId) {
      return;
    }

    let mounted = true;
    setStatus('loading');
    setError(null);

    (async () => {
      try {
        const [churchDetail, attendanceRecords, memberList, upcomingPayload] = await Promise.all([
          fetchChurchDetail(token, user.churchId),
          fetchAttendance(token, { churchId: user.churchId }),
          fetchChurchMembers(token, { churchId: user.churchId }),
          fetchUpcomingSessions(token, user.churchId).catch((err) => {
            console.warn('Failed to load upcoming sessions', err);
            return { sessions: [] as UpcomingSession[] };
          }),
        ]);

        if (!mounted) {
          return;
        }

        setChurch(churchDetail ?? null);
        setAttendance(attendanceRecords ?? []);
        setMembers(memberList ?? []);
        setUpcomingSessions(upcomingPayload?.sessions ?? []);
        setStatus('loaded');
      } catch (err) {
        if (!mounted) {
          return;
        }
        console.error('Failed to load church dashboard data', err);
        const message = err instanceof Error ? err.message : 'Unable to load church dashboard.';
        setError(message);
        setStatus('error');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, user?.churchId]);

  const totalMembers = useMemo(() => {
    if (members.length) {
      return members.length;
    }
    return church?._count?.members ?? 0;
  }, [members, church?._count?.members]);

  const passesIssued = useMemo(
    () => members.filter((member) => Boolean(member.memberPass?.token)).length,
    [members],
  );
  const membersWithoutPass = Math.max(totalMembers - passesIssued, 0);

  const attendanceInsights = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const activeMembers = new Set<string>();
    let approvedRecords = 0;
    let pendingApprovals = 0;

    attendance.forEach((record) => {
      if (record.status === 'PENDING') {
        pendingApprovals += 1;
      }

      if (record.status === 'APPROVED') {
        const sessionDate = record.session?.date ? new Date(record.session.date) : null;
        if (sessionDate && sessionDate >= startOfMonth) {
          approvedRecords += 1;
          if (record.member?.id) {
            activeMembers.add(record.member.id);
          }
        }
      }
    });

    return {
      activeMembersThisMonth: activeMembers.size,
      approvedRecordsThisMonth: approvedRecords,
      pendingApprovals,
    };
  }, [attendance]);

  const { activeMembersThisMonth, approvedRecordsThisMonth, pendingApprovals } = attendanceInsights;

  const attendanceRate = totalMembers ? (activeMembersThisMonth / totalMembers) * 100 : 0;

  const attendanceTrend = useMemo<SparklinePoint[]>(() => {
    if (!attendance.length) {
      return [];
    }
    const sessionMap = new Map<
      string,
      { date: Date; label: string; approved: number; total: number }
    >();

    attendance.forEach((record) => {
      const session = record.session;
      if (!session?.id || !session.date) {
        return;
      }
      const date = new Date(session.date);
      if (Number.isNaN(date.getTime())) {
        return;
      }
      const existing =
        sessionMap.get(session.id) ??
        {
          date,
          label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          approved: 0,
          total: 0,
        };

      if (record.status === 'APPROVED') {
        existing.approved += 1;
      }
      existing.total += 1;
      sessionMap.set(session.id, existing);
    });

    return Array.from(sessionMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6)
      .map((item) => ({
        label: item.label,
        value: item.total ? (item.approved / item.total) * 100 : 0,
      }));
  }, [attendance]);

  const engagedMembers = useMemo(() => {
    if (!attendance.length) {
      return [];
    }

    const map = new Map<
      string,
      { id: string; name: string; approvals: number; lastActive: Date | null }
    >();

    attendance.forEach((record) => {
      if (record.status !== 'APPROVED' || !record.member?.id) {
        return;
      }
      const id = record.member.id;
      const sessionDate = record.session?.date ? new Date(record.session.date) : null;
      const existing =
        map.get(id) ??
        {
          id,
          name: [record.member.firstName, record.member.lastName].filter(Boolean).join(' ') || 'Member',
          approvals: 0,
          lastActive: null,
        };

      existing.approvals += 1;
      if (sessionDate && (!existing.lastActive || sessionDate > existing.lastActive)) {
        existing.lastActive = sessionDate;
      }
      map.set(id, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => (b.lastActive?.getTime() ?? 0) - (a.lastActive?.getTime() ?? 0))
      .slice(0, 5);
  }, [attendance]);

  const riskAlerts = useMemo(() => {
    const items: Array<{ id: string; title: string; detail: string }> = [];

    if (pendingApprovals > 0) {
      items.push({
        id: 'pending-approvals',
        title: `${pendingApprovals} attendance records awaiting approval`,
        detail: 'Approve recent submissions so members receive their Umuganda passes.',
      });
    }

    if (membersWithoutPass > 0) {
      const percent = totalMembers ? Math.round((membersWithoutPass / totalMembers) * 100) : 0;
      items.push({
        id: 'pass-coverage',
        title: `${membersWithoutPass} members still need digital passes`,
        detail: `Encourage registration to reach full coverage (${percent}% outstanding).`,
      });
    }

    if (activeMembersThisMonth === 0 && approvedRecordsThisMonth === 0 && totalMembers > 0) {
      items.push({
        id: 'no-activity',
        title: 'No approved attendance this month',
        detail: 'Log the latest Umuganda session to keep your congregation on track.',
      });
    }

    return items;
  }, [pendingApprovals, membersWithoutPass, totalMembers, activeMembersThisMonth, approvedRecordsThisMonth]);

  const nextSession = useMemo(() => {
    if (!upcomingSessions.length) {
      return null;
    }
    const sorted = [...upcomingSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sorted[0] ?? null;
  }, [upcomingSessions]);

  const statCards = useMemo(
    () => [
      {
        id: 'members',
        title: 'Members enrolled',
        value: formatNumber(totalMembers),
        meta: totalMembers
          ? membersWithoutPass > 0
            ? `${membersWithoutPass} pending onboarding`
            : 'All members onboarded'
          : 'No members yet',
        icon: <IconUsersGroup size={20} stroke={1.8} />,
        accent: '#1f9d77',
      },
      {
        id: 'attendance-rate',
        title: 'Attendance rate',
        value: formatPercent(attendanceRate),
        meta: `${activeMembersThisMonth} members active this month`,
        icon: <IconTrendingUp size={20} stroke={1.8} />,
        accent: '#3366ff',
      },
      {
        id: 'pending-approvals',
        title: 'Approvals pending',
        value: formatNumber(pendingApprovals),
        meta: pendingApprovals ? 'Review attendance submissions' : 'All caught up',
        icon: <IconChecklist size={20} stroke={1.8} />,
        accent: '#ff8f3d',
      },
      {
        id: 'passes-issued',
        title: 'Digital passes',
        value: formatNumber(passesIssued),
        meta: totalMembers
          ? `${Math.round((passesIssued / totalMembers) * 100)}% coverage`
          : 'No members yet',
        icon: <IconCalendarEvent size={20} stroke={1.8} />,
        accent: '#74266F',
      },
    ],
    [
      totalMembers,
      membersWithoutPass,
      attendanceRate,
      activeMembersThisMonth,
      pendingApprovals,
      passesIssued,
    ],
  );

  const quickActions = useMemo(
    () => [
      {
        id: 'attendance',
        title: 'Record attendance',
        description: 'Log Umuganda participation and approve passes in minutes.',
        href: '/church/attendance',
        icon: <IconChecklist size={18} stroke={1.8} />,
        accent: '#3366ff',
      },
      {
        id: 'members',
        title: 'Manage members',
        description: 'Invite new congregants or update existing member profiles.',
        href: '/church/members',
        icon: <IconUserPlus size={18} stroke={1.8} />,
        accent: '#1f9d77',
      },
      {
        id: 'reports',
        title: 'View reports',
        description: 'Spot trends in attendance and share insights with leadership.',
        href: '/church/reports',
        icon: <IconTrendingUp size={18} stroke={1.8} />,
        accent: '#ff8f3d',
      },
    ],
    [],
  );

  const heroContent = useMemo(() => {
    if (!church) {
      return null;
    }

    return (
      <div style={heroStyle}>
        <div style={heroHeaderStyle}>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.68)' }}>
              {church.district?.name ? `${church.district.name} District` : 'Church admin workspace'}
            </span>
            <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {church.name}
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', maxWidth: '520px', lineHeight: 1.6 }}>
              Coordinate member engagement, attendance approvals, and Umuganda readiness from a single view.
            </p>
          </div>
          {nextSession && (
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.12)',
                display: 'grid',
                gap: '0.4rem',
                minWidth: '220px',
              }}
            >
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.72)' }}>
                Next Umuganda
              </span>
              <strong style={{ fontSize: '1.2rem', letterSpacing: '-0.01em' }}>
                {formatDate(nextSession.date)}
              </strong>
              <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.78)' }}>
                {nextSession.theme || 'Theme TBD'}
              </span>
            </div>
          )}
        </div>

        <div style={heroMetricsStyle}>
          <div style={heroMetricStyle}>
            <span style={heroMetricLabel}>Attendance approvals</span>
            <span style={heroMetricValue}>{formatNumber(approvedRecordsThisMonth)}</span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.72)' }}>
              Approved submissions this month
            </span>
          </div>
          <div style={heroMetricStyle}>
            <span style={heroMetricLabel}>Member coverage</span>
            <span style={heroMetricValue}>
              {totalMembers ? `${Math.round((passesIssued / totalMembers) * 100)}%` : '0%'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.72)' }}>
              Digital passes issued
            </span>
          </div>
          <div style={heroMetricStyle}>
            <span style={heroMetricLabel}>Pending reviews</span>
            <span style={heroMetricValue}>{formatNumber(pendingApprovals)}</span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.72)' }}>
              Attendance awaiting approval
            </span>
          </div>
        </div>
      </div>
    );
  }, [church, nextSession, approvedRecordsThisMonth, totalMembers, passesIssued, pendingApprovals]);

  const shellConfig = useMemo<DashboardShellOverrides | undefined>(() => {
    if (!heroContent) {
      return undefined;
    }
    return { hero: heroContent };
  }, [heroContent]);

  useDashboardShellConfig(shellConfig);

  const renderContent = () => {
    if (status === 'loading' || status === 'idle') {
      return (
        <section style={loadingCardStyle}>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Loading church dashboard…</p>
        </section>
      );
    }

    if (status === 'error') {
      return (
        <section style={{ ...cardStyle, border: '1px solid rgba(198, 62, 85, 0.35)', background: 'rgba(198, 62, 85, 0.08)', color: '#c63e55' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <IconAlertTriangle size={22} stroke={1.8} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>We hit a snag</h2>
              <p style={{ margin: '0.45rem 0 0', fontSize: '0.95rem' }}>{error ?? 'Unable to load the latest church insights.'}</p>
            </div>
          </div>
        </section>
      );
    }

    return (
      <div style={containerStyle}>
        <section style={statsGridStyle}>
          {statCards.map((card) => (
            <div key={card.id} style={statCardStyle(card.accent)}>
              <div style={statIconStyle(card.accent)}>{card.icon}</div>
              <div style={statValueStyle}>{card.value}</div>
              <div style={{ fontWeight: 600 }}>{card.title}</div>
              <div style={statMetaStyle}>{card.meta}</div>
            </div>
          ))}
        </section>

        <section style={splitGridStyle}>
          <article style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h2 style={cardTitleStyle}>Attendance trend</h2>
                <p style={cardSubtitleStyle}>Coverage percentage across the last six recorded sessions.</p>
              </div>
              <IconTrendingUp size={22} stroke={1.8} color="#3366ff" />
            </div>
            <Sparkline data={attendanceTrend} accentColor="#3366ff" />
          </article>

          <article style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h2 style={cardTitleStyle}>Upcoming sessions</h2>
                <p style={cardSubtitleStyle}>Your next scheduled Umuganda gatherings.</p>
              </div>
              <IconCalendarEvent size={22} stroke={1.8} color="#74266F" />
            </div>
            {upcomingSessions.length ? (
              <ul style={listStyle}>
                {upcomingSessions.slice(0, 4).map((session) => (
                  <li key={session.id} style={memberRowStyle}>
                    <div style={{ display: 'grid', gap: '0.2rem' }}>
                      <strong style={{ fontSize: '1rem' }}>{formatDate(session.date)}</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                        {session.theme || 'Theme TBD'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {session.location || church?.location || 'Location TBC'}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={emptyStateStyle}>
                Schedule your next Umuganda session to keep members notified and ready.
              </div>
            )}
          </article>
        </section>

        <section style={splitGridStyle}>
          <article style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h2 style={cardTitleStyle}>Member momentum</h2>
                <p style={cardSubtitleStyle}>The most recently engaged members based on approved attendance.</p>
              </div>
              <IconUsersGroup size={22} stroke={1.8} color="#1f9d77" />
            </div>
            {engagedMembers.length ? (
              <ul style={listStyle}>
                {engagedMembers.map((member) => (
                  <li key={member.id} style={memberRowStyle}>
                    <div style={{ display: 'grid', gap: '0.25rem' }}>
                      <strong>{member.name}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {member.approvals} approvals • {formatRelative(member.lastActive)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Active</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={emptyStateStyle}>
                Once members attend and get approvals, you’ll see their activity here.
              </div>
            )}
          </article>

          <article style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h2 style={cardTitleStyle}>Attention needed</h2>
                <p style={cardSubtitleStyle}>Resolve these items to keep your congregation on track.</p>
              </div>
              <IconAlertTriangle size={22} stroke={1.8} color="#ff8f3d" />
            </div>
            {riskAlerts.length ? (
              <ul style={listStyle}>
                {riskAlerts.map((alert) => (
                  <li key={alert.id} style={{ ...memberRowStyle, background: 'color-mix(in srgb, #ff8f3d 12%, transparent)' }}>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <strong>{alert.title}</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{alert.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={emptyStateStyle}>
                Everything looks good. Keep encouraging timely attendance approvals and pass issuance.
              </div>
            )}
          </article>
        </section>

        <section style={{ ...cardStyle, gap: '1.5rem' }}>
          <div style={cardHeaderStyle}>
            <div>
              <h2 style={cardTitleStyle}>Quick actions</h2>
              <p style={cardSubtitleStyle}>Jump into the workflows you manage most frequently.</p>
            </div>
          </div>
          <div style={quickActionsStyle}>
            {quickActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                style={quickActionCard(action.accent)}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'translateY(-3px)';
                  event.currentTarget.style.boxShadow = '0 18px 34px rgba(14, 34, 62, 0.18)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'translateY(0)';
                  event.currentTarget.style.boxShadow = '0 14px 28px rgba(10, 26, 48, 0.08)';
                }}
              >
                <div style={quickActionHeader(action.accent)}>
                  {action.icon}
                  <span>{action.title}</span>
                </div>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{action.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: action.accent }}>
                  Go to workspace
                  <IconChevronRight size={16} stroke={1.8} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  };

  return <RequireRole allowed="CHURCH_ADMIN">{renderContent()}</RequireRole>;
}
