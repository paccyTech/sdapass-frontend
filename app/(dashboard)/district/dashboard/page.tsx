'use client';

import { useMemo, type CSSProperties } from 'react';

import { IconAlertTriangle } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';

type SparklinePoint = {
  label: string;
  value: number;
};

type CoverageInsight = {
  name: string;
  coverage: number;
  change: string;
  color: string;
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

const attendanceTrend: SparklinePoint[] = [
  { label: 'Week 1', value: 84 },
  { label: 'Week 2', value: 87 },
  { label: 'Week 3', value: 91 },
  { label: 'Week 4', value: 93 },
  { label: 'Week 5', value: 95 },
];

const coverageInsights: CoverageInsight[] = [
  { name: 'Kacyiru SDA', coverage: 96, change: '+4 pts', color: '#1f9d77' },
  { name: 'Gikondo SDA', coverage: 92, change: '+2 pts', color: '#18508d' },
  { name: 'Nyamirambo SDA', coverage: 58, change: '−5 pts', color: '#ffc13f' },
  { name: 'Remera SDA', coverage: 43, change: '−11 pts', color: '#d64541' },
];

const riskAlerts: RiskAlert[] = [
  {
    title: 'Nyamirambo needs compliance visit',
    detail: 'Pass issuance lagging 11 days behind district target. Coach the new admin on verification workflow.',
    level: 'critical',
  },
  {
    title: 'Remera attendance anomalies pending',
    detail: '3 services flagged for review. Confirm attendance corrections before Friday rollout.',
    level: 'warning',
  },
];

const weeklyTasks: TaskItem[] = [
  {
    title: 'Approve attendance anomalies',
    detail: 'Validate flagged submissions from last Sabbath before SMS summaries go out.',
    owner: 'You',
    due: 'Today, 17:00',
  },
  {
    title: 'Coach Nyamirambo admin',
    detail: 'Walk through the QR pass resend flow and escalation steps.',
    owner: 'You & Sarah (Union)',
    due: 'Tomorrow, 09:00',
  },
  {
    title: 'Assign backup to Kigali South',
    detail: 'Roster support pastor for two weeks while existing lead is on leave.',
    owner: 'District leadership',
    due: 'Fri, 14:00',
  },
];

const DistrictDashboardPage = () => {
  const shellConfig = useMemo(
    () => ({}),
    [],
  );

  useDashboardShellConfig(shellConfig);

  return (
    <RequireRole allowed="DISTRICT_ADMIN">
      <div style={containerStyle}>
        <section style={chartGridStyle}>
          <article style={cardStyle}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 500 }}>
                  Attendance trend
                </span>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Past 5 Sabbaths</h3>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>District average 95%</span>
            </header>
            <Sparkline data={attendanceTrend} accentColor="#18508d" />
          </article>

          <article style={cardStyle}>
            <header style={{ display: 'grid', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 500 }}>
                Church coverage status
              </span>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Where to focus next</h3>
            </header>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {coverageInsights.map((insight) => (
                <div key={insight.name} style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--shell-foreground)', fontWeight: 600 }}>{insight.name}</strong>
                    <span style={{ fontSize: '0.85rem', color: insight.change.startsWith('-') ? 'var(--danger)' : 'var(--accent)', fontWeight: 600 }}>{insight.change}</span>
                  </div>
                  <ProgressBar value={insight.coverage} color={insight.color} />
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Coverage {insight.coverage}%</div>
                </div>
              ))}
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
              {riskAlerts.map((alert) => (
                <div
                  key={alert.title}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '16px',
                    background: alert.level === 'critical' ? 'var(--surface-soft)' : 'var(--surface-soft)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--shell-foreground)',
                    display: 'grid',
                    gap: '0.3rem',
                  }}
                >
                  <strong style={{ fontSize: '0.95rem', fontWeight: 600 }}>{alert.title}</strong>
                  <span style={{ fontSize: '0.88rem' }}>{alert.detail}</span>
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
            >
              Export district brief
            </button>
          </header>
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {weeklyTasks.map((task) => (
              <div
                key={task.title}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '18px',
                  background: 'rgba(26,95,99,0.08)',
                  border: '1px solid rgba(26,95,99,0.14)',
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
      </div>
    </RequireRole>
  );
};

export default DistrictDashboardPage;
