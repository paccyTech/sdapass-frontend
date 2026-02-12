'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import { IconAlertTriangle, IconBuildingChurch, IconUsers, IconCheck, IconClipboard } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  fetchAttendance,
  fetchChurchAdmins,
  fetchChurches,
  fetchDistrictDetail,
  type AttendanceRecordSummary,
  type ChurchAdminSummary,
  type ChurchSummary,
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

const PieChart = ({
  data,
  title,
}: {
  data: { label: string; value: number; color: string }[];
  title: string;
}) => {
  const size = 320;
  const radius = 110;
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const segments = total
    ? data
        .filter((item) => item.value > 0)
        .map((item) => ({ ...item, percent: item.value / total }))
    : [];

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y, 'L', x, y, 'Z'].join(' ');
  };

  let cursor = 0;

  return (
    <div
      style={{
        ...cardStyle,
        padding: '2rem',
        background: 'linear-gradient(135deg, var(--surface-primary) 0%, var(--surface-soft) 100%)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeInUp 0.8s ease-out',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #0ea5e9, #10b981, #f59e0b)',
        }}
      />
      <h3
        style={{
          margin: '0 0 1.5rem',
          fontSize: '1.4rem',
          textAlign: 'center',
          fontWeight: 600,
          color: 'var(--shell-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </h3>

      <div style={{ display: 'grid', gap: '1.25rem', justifyItems: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.length ? (
            segments.map((segment) => {
              const startAngle = cursor * 360;
              const endAngle = (cursor + segment.percent) * 360;
              cursor += segment.percent;

              return (
                <path
                  key={segment.label}
                  d={describeArc(cx, cy, radius, startAngle, endAngle)}
                  fill={segment.color}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2}
                />
              );
            })
          ) : (
            <circle cx={cx} cy={cy} r={radius} fill="rgba(24,76,140,0.12)" />
          )}
          <circle cx={cx} cy={cy} r={62} fill="white" />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={22} fontWeight={700} fill="#0b1f33">
            {total}
          </text>
          <text x={cx} y={cy + 18} textAnchor="middle" fontSize={12} fontWeight={600} fill="#64748b">
            Approved
          </text>
        </svg>

        <div style={{ display: 'grid', gap: '0.6rem', width: '100%' }}>
          {(segments.length ? segments : data).slice(0, 6).map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.75rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(12, 34, 56, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '999px', background: item.color }} />
                <span style={{ fontWeight: 600, color: '#0b1f33', fontSize: '0.9rem' }}>{item.label}</span>
              </div>
              <span style={{ fontWeight: 700, color: '#0b1f33' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BarChart = ({ data, title }: { data: { label: string; value: number; color?: string }[]; title: string }) => {
  const width = 400;
  const height = 300;
  const padding = 60;
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div style={{ 
      ...cardStyle, 
      padding: '2rem', 
      background: 'linear-gradient(135deg, var(--surface-primary) 0%, var(--surface-soft) 100%)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fadeInUp 0.8s ease-out'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #3b82f6, #10b981, #f59e0b)'
      }} />
      <h3 style={{ 
        margin: '0 0 1.5rem', 
        fontSize: '1.4rem', 
        textAlign: 'center',
        fontWeight: 600,
        color: 'var(--shell-foreground)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>{title}</h3>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(perc => {
          const y = height - padding - (perc / 100) * (height - 2 * padding);
          return (
            <g key={perc}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
              <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">{perc}%</text>
            </g>
          );
        })}
        
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * (height - 2 * padding);
          const x = padding + i * ((width - 2 * padding) / data.length);
          const y = height - padding - barHeight;
          const barWidth = (width - 2 * padding) / data.length - 15;
          return (
            <g key={d.label}>
              <defs>
                <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: d.color || '#3b82f6', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: d.color || '#3b82f6', stopOpacity: 0.4 }} />
                </linearGradient>
              </defs>
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                fill={`url(#grad-${i})`} 
                stroke={d.color || '#3b82f6'} 
                strokeWidth="1" 
                rx="4"
                style={{ 
                  transition: 'all 0.3s ease',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  animation: `barGrow 0.6s ease-out ${i * 0.1}s forwards`,
                  transformOrigin: 'bottom'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))';
                }}
              />
              <text x={x + barWidth / 2} y={height - 20} textAnchor="middle" fontSize="11" fill="#374151" fontWeight="500">{d.label}</text>
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="12" fill={d.color || '#3b82f6'} fontWeight="600">{d.value}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const DistrictDashboardPage = () => {
  const { token, user } = useAuthSession();
  const [district, setDistrict] = useState<DistrictPayload | null>(null);
  const [churches, setChurches] = useState<ChurchSummary[]>([]);
  const [churchAdmins, setChurchAdmins] = useState<ChurchAdminSummary[]>([]);
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
        if (!user?.districtId) {
          setError('No district ID found');
          setStatus('error');
          return;
        }

        const [districtDetail, districtChurches, admins, attendance] = await Promise.all([
          fetchDistrictDetail(token, user.districtId),
          fetchChurches(token, { districtId: user.districtId }),
          fetchChurchAdmins(token, { districtId: user.districtId }),
          fetchAttendance(token, { districtId: user.districtId }),
        ]);

        if (!mounted) {
          return;
        }

        setDistrict(districtDetail ?? null);
        setChurches(districtChurches ?? []);
        setChurchAdmins(admins ?? []);
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
        owner: 'You',
        due: 'Next Sabbath',
      });
    }

    if (!tasks.length) {
      tasks.push({
        title: 'Celebrate wins',
        detail: 'Share district highlights with the union leadership to reinforce strong performance.',
        owner: 'You',
        due: 'Friday morning',
      });
    }

    return tasks;
  }, [churchesWithStats]);

  const churchCoverage = useMemo(() => {
    return churchesWithStats.map((church) => ({
      name: church.name,
      coverage: church.passesIssued && church.memberCount ? Math.min(100, Math.round((church.passesIssued / church.memberCount) * 100)) : 0,
      change: church.admins.length === 0 ? '- admin missing' : `${church.passesIssued} passes`,
      color: church.admins.length === 0 ? 'var(--danger)' : 'var(--accent)',
    }));
  }, [churchesWithStats]);

  const approvedPassesPie = useMemo(() => {
    const palette = ['#2563eb', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#0ea5e9', '#f97316'];

    return churchesWithStats
      .map((church, index) => ({
        label: church.name,
        value: attendanceRecords.filter(
          (record) => record.status === 'APPROVED' && record.session?.church?.id === church.id,
        ).length,
        color: palette[index % palette.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [attendanceRecords, churchesWithStats]);

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
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes barGrow {
            from { transform: scaleY(0); transform-origin: bottom; }
            to { transform: scaleY(1); transform-origin: bottom; }
          }
        `}</style>
        {status === 'loading' || status === 'idle' ? (
          loadingCard
        ) : status === 'error' ? (
          errorCard
        ) : (
          <>
            {/* Stats Overview */}
            <section style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
                  <IconBuildingChurch size={24} style={{ color: '#3b82f6' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e40af' }}>{activeChurchCount}</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Active Churches</div>
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
                  <IconUsers size={24} style={{ color: '#f59e0b' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#92400e' }}>{activeAdminCount}</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Active Admins</div>
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
                  <IconCheck size={24} style={{ color: '#10b981' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#166534' }}>{approvedAttendanceCount}</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Approved Passes</div>
                </div>
              </div>
            </section>

            {/* Charts */}
            <section style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
              <BarChart data={churches.map(c => ({ label: c.name, value: c._count?.members ?? 0 }))} title="Church Members" />
              <PieChart data={approvedPassesPie} title="Approved Passes (by church)" />
              <BarChart data={churchCoverage.map(c => ({ label: c.name, value: c.coverage, color: c.color }))} title="Church Coverage %" />
            </section>

            {/* Risk Alerts */}
            <section style={cardStyle}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.4rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Risk Alerts</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {riskItems.map((risk) => (
                  <div key={risk.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: risk.level === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: `1px solid ${risk.level === 'critical' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}` }}>
                    <IconAlertTriangle size={20} stroke={1.6} style={{ color: risk.level === 'critical' ? '#dc2626' : '#d97706', flexShrink: 0, marginTop: '0.1rem' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--shell-foreground)' }}>{risk.title}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{risk.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Task Suggestions */}
            <section style={cardStyle}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.4rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Suggested Tasks</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {taskSuggestions.map((task, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--surface-border)' }}>
                    <IconClipboard size={20} style={{ color: '#3b82f6' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--shell-foreground)' }}>{task.title}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{task.detail}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Owner: {task.owner} • Due: {task.due}</div>
                    </div>
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
