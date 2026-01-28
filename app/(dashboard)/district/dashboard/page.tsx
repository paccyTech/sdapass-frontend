'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import { IconAlertTriangle } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  fetchAttendance,
  fetchChurchAdmins,
  fetchChurches,
  fetchDistrictDetail,
  fetchDistrictPastors,
  type AttendanceRecordSummary,
  type ChurchAdminSummary,
  type ChurchSummary,
  type DistrictPastorSummary,
  type DistrictPayload,
} from '@/lib/api';

type SparklinePoint = {
  label: string;
  value: number;
};

type RiskAlert = {
  title: string;
  detail: string;
  level: 'warning' | 'critical';
};

type TaskItem = {
  title: string;
  detail: string;
  owner: string;
  due: string;
};

const containerStyle: CSSProperties = {
  display: 'grid',
  gap: '2.25rem',
  fontFamily: 'var(--font-sans)',
  color: 'var(--shell-foreground)',
};

const cardStyle: CSSProperties = {
  background: 'var(--surface-primary)',
  borderRadius: '20px',
  padding: '1.75rem',
  display: 'grid',
  gap: '1rem',
  boxShadow: '0 12px 28px rgba(13, 34, 62, 0.08)',
};

const chartGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.75rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
};

const progressTrackStyle: CSSProperties = {
  height: '10px',
  borderRadius: '999px',
  background: 'rgba(24,76,140,0.12)',
  overflow: 'hidden',
};

const ProgressBar = ({ value, color }: { value: number; color: string }) => (
  <div style={progressTrackStyle}>
    <div
      style={{
        width: `${Math.max(0, Math.min(100, value))}%`,
        height: '100%',
        borderRadius: '999px',
        background: color,
        transition: 'width 0.4s ease',
      }}
    />
  </div>
);

const sparklineMetaStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '0.75rem',
  flexWrap: 'wrap',
  color: 'rgba(28,39,51,0.65)',
  fontSize: '0.82rem',
};

const Sparkline = ({ data, accentColor = '#1f9d77' }: { data: SparklinePoint[]; accentColor?: string }) => {
  if (data.length === 0) {
    return <p style={{ margin: 0, color: 'var(--muted)' }}>Not enough data yet.</p>;
  }

  const width = 320;
  const height = 110;
  const paddingX = 12;
  const paddingY = 16;
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

  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1]?.x.toFixed(2)} ${height - paddingY} L ${coordinates[0]?.x.toFixed(2)} ${height - paddingY} Z`;

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true" style={{ overflow: 'visible' }}>
        <path d={areaPath} fill={`${accentColor}1f`} stroke="none" />
        <path d={linePath} fill="none" stroke={accentColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point, index) => (
          <circle key={data[index]?.label ?? index} cx={point.x} cy={point.y} r={3.5} fill="#fff" stroke={accentColor} strokeWidth={2} />
        ))}
      </svg>
      <div style={sparklineMetaStyle}>
        {data.map((point) => (
          <div key={point.label} style={{ display: 'grid', gap: '0.15rem', minWidth: '44px' }}>
            <span>{point.label}</span>
            <strong style={{ color: 'var(--shell-foreground)', fontWeight: 600 }}>{point.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

const DistrictDashboardPage = () => {
  const { token, user } = useAuthSession();
  const [district, setDistrict] = useState<DistrictPayload | null>(null);
  const [churches, setChurches] = useState<ChurchSummary[]>([]);
  const [churchAdmins, setChurchAdmins] = useState<ChurchAdminSummary[]>([]);
  const [pastors, setPastors] = useState<DistrictPastorSummary[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordSummary[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const shellConfig = useMemo(
    () => ({
      hero: null,
    }),
    [],
  );

  useDashboardShellConfig(shellConfig);

  useEffect(() => {
    if (!token || !user?.districtId) {
      return;
    }

    let mounted = true;
    setStatus('loading');
    setError(null);

    (async () => {
      try {
        const [districtDetail, districtChurches, admins, pastorsList, attendance] = await Promise.all([
          fetchDistrictDetail(token, user.districtId),
          fetchChurches(token, { districtId: user.districtId }),
          fetchChurchAdmins(token, { districtId: user.districtId }),
          fetchDistrictPastors(token, { districtId: user.districtId }),
          fetchAttendance(token, { districtId: user.districtId }),
        ]);

        if (!mounted) {
          return;
        }

        setDistrict(districtDetail ?? null);
        setChurches(districtChurches ?? []);
        setChurchAdmins(admins ?? []);
        setPastors(pastorsList ?? []);
        setAttendanceRecords(attendance ?? []);
        setStatus('loaded');
      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error('Failed to load district dashboard data', err);
        const message = err instanceof Error ? err.message : 'Unable to load district insights at this time.';
        setError(message);
        setStatus('error');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, user?.districtId]);

  const attendanceByWeek = useMemo(() => {
    if (!attendanceRecords.length) {
      return [];
    }

    const grouped = attendanceRecords.reduce<Record<string, number>>((acc, record) => {
      const date = record.session?.date ? new Date(record.session.date) : null;
      if (!date || Number.isNaN(date.getTime())) {
        return acc;
      }

      const weekKey = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const next = acc[weekKey] ?? 0;
      const increment = record.status === 'APPROVED' ? 1 : 0;
      acc[weekKey] = next + increment;
      return acc;
    }, {});

    return Object.entries(grouped)
      .slice(-5)
      .map(([label, value]) => ({ label, value } satisfies SparklinePoint));
  }, [attendanceRecords]);

  const churchesWithStats = useMemo(() => {
    if (!churches.length) {
      return [];
    }

    return churches
      .map((church) => {
        const adminsForChurch = churchAdmins.filter((admin) => admin.churchId === church.id && admin.isActive);
        const passesIssued = attendanceRecords.filter(
          (record) => record.session?.church?.id === church.id && record.pass?.smsSentAt,
        ).length;

        return {
          id: church.id,
          name: church.name,
          location: church.location ?? 'Location pending',
          admins: adminsForChurch,
          memberCount: church._count?.members ?? 0,
          sessionCount: church._count?.sessions ?? 0,
          passesIssued,
        };
      })
      .sort((a, b) => b.memberCount - a.memberCount);
  }, [churches, churchAdmins, attendanceRecords]);

  const riskItems = useMemo(() => {
    const items: Array<{ id: string; title: string; detail: string; level: RiskAlert['level'] }> = [];

    churchesWithStats.forEach((church) => {
      if (church.admins.length === 0) {
        items.push({
          id: `${church.id}-no-admin`,
          title: `${church.name} has no active admin`,
          detail: 'Assign or reactivate a church administrator to keep pass issuance running.',
          level: 'critical',
        });
      }

      if (church.passesIssued === 0) {
        items.push({
          id: `${church.id}-no-passes`,
          title: `${church.name} needs pass activations`,
          detail: 'No members have approved passes yet. Follow up with the congregation on attendance logging.',
          level: 'warning',
        });
      }
    });

    if (!items.length) {
      items.push({
        id: 'all-clear',
        title: 'All churches reporting',
        detail: 'Every congregation has active admins and recent pass activity. Keep reinforcing good habits.',
        level: 'warning',
      });
    }

    return items;
  }, [churchesWithStats]);

  const taskSuggestions = useMemo(() => {
    const tasks: TaskItem[] = [];

    const atRiskChurch = churchesWithStats.find((church) => church.admins.length === 0);
    if (atRiskChurch) {
      tasks.push({
        title: `Recruit admin for ${atRiskChurch.name}`,
        detail: 'Coordinate with union leadership to identify a candidate and invite them via the Church Admins page.',
        owner: 'You',
        due: 'This week',
      });
    }

    const lowPassChurch = churchesWithStats.find((church) => church.passesIssued === 0);
    if (lowPassChurch) {
      tasks.push({
        title: `Check attendance process at ${lowPassChurch.name}`,
        detail: 'Review recent Sabbath attendance entries and confirm the QR issuance flow with the local team.',
        owner: 'You & local admin',
        due: 'Next Sabbath',
      });
    }

    if (pastors.length > 1) {
      tasks.push({
        title: 'Schedule monthly check-in with pastors',
        detail: 'Share district metrics and align on coaching plans across all congregations.',
        owner: 'District leadership',
        due: '15th of month',
      });
    }

    if (!tasks.length) {
      tasks.push({
        title: 'Celebrate wins',
        detail: 'Share district highlights with the union leadership team to reinforce strong performance.',
        owner: 'You',
        due: 'Friday morning',
      });
    }

    return tasks;
  }, [churchesWithStats, pastors]);

  const churchCoverage = useMemo(() => {
    return churchesWithStats.map((church) => ({
      name: church.name,
      coverage: church.passesIssued && church.memberCount ? Math.min(100, Math.round((church.passesIssued / church.memberCount) * 100)) : 0,
      change: church.admins.length === 0 ? '- admin missing' : `${church.passesIssued} passes`,
      color: church.admins.length === 0 ? 'var(--danger)' : 'var(--accent)',
    }));
  }, [churchesWithStats]);

  const activeChurchCount = churchesWithStats.length;
  const activeAdminCount = churchAdmins.filter((admin) => admin.isActive).length;
  const approvedAttendanceCount = attendanceRecords.filter((record) => record.status === 'APPROVED').length;

  const loadingCard = (
    <section style={{ ...cardStyle, alignItems: 'center', justifyContent: 'center', minHeight: '280px' }}>
      <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Loading district dashboard…</p>
    </section>
  );

  const errorCard = (
    <section style={{ ...cardStyle, border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }}>
      <header style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <IconAlertTriangle size={26} stroke={1.6} style={{ color: 'var(--danger)' }} />
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>We could not load your data</h3>
          <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>{error ?? 'Try refreshing the page to retry.'}</span>
        </div>
      </header>
      <div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1.25rem',
            borderRadius: '999px',
            padding: '0.6rem 1.4rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            color: 'var(--on-primary)',
          }}
        >
          Retry loading
        </button>
      </div>
    </section>
  );

  return (
    <RequireRole allowed="DISTRICT_ADMIN">
      <div style={containerStyle}>
        <section style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <article style={cardStyle}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Churches
            </span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem' }}>{activeChurchCount}</strong>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Congregations reporting in {district?.name ?? 'the district'}.</p>
          </article>
          <article style={cardStyle}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Active church admins
            </span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem' }}>{activeAdminCount}</strong>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Keep at least one active administrator per congregation.</p>
          </article>
          <article style={cardStyle}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Approved passes this month
            </span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem' }}>{approvedAttendanceCount}</strong>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Track attendance approvals to keep QR passes active.</p>
          </article>
        </section>

        {status === 'loading' || status === 'idle' ? (
          loadingCard
        ) : status === 'error' ? (
          errorCard
        ) : (
          <>
            <section style={chartGridStyle}>
              <article style={cardStyle}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 500 }}>
                      Attendance approvals
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Recent Sabbath trend</h3>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                    {attendanceByWeek.length ? 'Approved attendance records' : 'Awaiting attendance submissions'}
                  </span>
                </header>
                <Sparkline data={attendanceByWeek} accentColor="#18508d" />
              </article>

              <article style={cardStyle}>
                <header style={{ display: 'grid', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 500 }}>
                    Church coverage status
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Where to focus next</h3>
                </header>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {churchCoverage.length ? (
                    churchCoverage.map((insight) => (
                      <div key={insight.name} style={{ display: 'grid', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '1rem', color: 'var(--shell-foreground)', fontWeight: 600 }}>{insight.name}</strong>
                          <span style={{ fontSize: '0.85rem', color: insight.color, fontWeight: 600 }}>{insight.change}</span>
                        </div>
                        <ProgressBar value={insight.coverage} color={insight.color} />
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Coverage {insight.coverage}%</div>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, color: 'var(--muted)' }}>No churches found in this district.</p>
                  )}
                </div>
              </article>

              <article style={{ ...cardStyle, background: 'var(--surface-soft)', border: '1px solid var(--surface-border)' }}>
                <header style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <IconAlertTriangle size={26} stroke={1.6} style={{ color: 'var(--accent)' }} />
                  <div style={{ display: 'grid', gap: '0.2rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Critical follow-ups</h3>
                    <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>Resolve these before the weekend cycle begins.</span>
                  </div>
                </header>
                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  {riskItems.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '16px',
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--surface-border)',
                        color: 'var(--shell-foreground)',
                        display: 'grid',
                        gap: '0.3rem',
                      }}
                    >
                      <strong style={{ fontSize: '0.95rem', fontWeight: 600 }}>{alert.title}</strong>
                      <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>{alert.detail}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section style={{ ...cardStyle, gap: '1.35rem' }}>
              <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(28,39,51,0.55)', fontWeight: 500 }}>
                    Weekly coordination
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600 }}>District leadership cadence</h3>
                  <p style={{ margin: 0, color: 'rgba(28,39,51,0.6)', maxWidth: '540px', lineHeight: 1.6 }}>
                    Coach local admins, validate anomalies, and ensure every congregation keeps momentum heading into the Sabbath cycle.
                  </p>
                </div>
                <button
                  type="button"
                  style={{
                    padding: '0.65rem 1.3rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #1a5f63, #f3b700)',
                    color: 'white',
                    fontWeight: 600,
                    boxShadow: '0 15px 24px rgba(26,95,99,0.28)',
                    cursor: 'pointer',
                  }}
                  onClick={() => window.print()}
                >
                  Export district brief
                </button>
              </header>
              <div style={{ display: 'grid', gap: '0.9rem' }}>
                {taskSuggestions.map((task) => (
                  <div
                    key={task.title}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '18px',
                      background: 'rgba(26,95,99,0.08)',
                      border: '1px solid rgba(26,95,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               99,0.14)',
                      display: 'grid',
                      gap: '0.45rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1rem', color: '#1c2733', fontWeight: 600 }}>{task.title}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#1a5f63', fontWeight: 600 }}>{task.due}</span>
                    </div>
                    <p style={{ margin: 0, color: 'rgba(28,39,51,0.65)', lineHeight: 1.55 }}>{task.detail}</p>
                    <span style={{ fontSize: '0.83rem', color: 'rgba(28,39,51,0.55)' }}>Owner: {task.owner}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </RequireRole>
  );
};

export default DistrictDashboardPage;
