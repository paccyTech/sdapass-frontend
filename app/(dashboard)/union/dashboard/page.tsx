'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useId, type CSSProperties } from 'react';

import RequireRole from '@/components/RequireRole';
import { DashboardShellProvider, useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { fetchUnionStats, type UnionStats } from '@/lib/api';
import { useAuthSession } from '@/hooks/useAuthSession';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) {
    return '0';
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toLocaleString();
};

const toChartLabel = (label?: string | null) => {
  if (!label) return '';

  const direct = new Date(label);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toLocaleDateString(undefined, { month: 'short' });
  }

  const appended = new Date(`${label}-01`);
  if (!Number.isNaN(appended.getTime())) {
    return appended.toLocaleDateString(undefined, { month: 'short' });
  }

  const segments = label.split(' ');
  if (segments.length >= 2) {
    const month = segments[0]?.slice(0, 3) ?? '';
    const year = segments[segments.length - 1];
    return `${month} ${year}`.trim();
  }

  return label;
};

const toFullLabel = (label?: string | null) => {
  if (!label) return '';

  const direct = new Date(label);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const appended = new Date(`${label}-01`);
  if (!Number.isNaN(appended.getTime())) {
    return appended.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }

  return label;
};

const pageContainer: CSSProperties = {
  display: 'grid',
  gap: '1.75rem',
};

const statsGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.5rem',
};

const chartDimensions = {
  width: 100,
  height: 60,
  horizontalPadding: 6,
  verticalPadding: 8,
};

const cardStyle: CSSProperties = {
  backgroundColor: 'var(--surface-primary)',
  borderRadius: '18px',
  border: '1px solid var(--surface-border)',
  boxShadow: '0 16px 40px rgba(8, 22, 48, 0.16)',
  padding: '1.6rem',
  display: 'grid',
  gap: '1rem',
};

const insightGrid: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
};

const chartCardStyle: CSSProperties = {
  ...cardStyle,
  padding: '1.8rem',
  overflow: 'hidden',
  position: 'relative',
};

const chartSubtitleStyle: CSSProperties = {
  margin: '0.35rem 0 0',
  color: 'var(--muted)',
  fontSize: '0.9rem',
};

const chartMetaRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginTop: '1.1rem',
  flexWrap: 'wrap',
};

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'var(--surface-soft)',
  color: 'var(--shell-foreground)',
};

const chipDotStyle: CSSProperties = {
  width: '0.45rem',
  height: '0.45rem',
  borderRadius: '999px',
  backgroundColor: 'currentColor',
  opacity: 0.65,
};

const axisLabelRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.75rem',
  color: 'var(--muted)',
  marginTop: '0.85rem',
  gap: '0.5rem',
};

const miniBarsRow: CSSProperties = {
  display: 'flex',
  gap: '0.65rem',
  alignItems: 'flex-end',
  marginTop: '1.25rem',
};

const miniBarStack: CSSProperties = {
  flex: 1,
  display: 'grid',
  gap: '0.35rem',
  justifyItems: 'center',
};

const miniBarTrack: CSSProperties = {
  width: '100%',
  height: '72px',
  borderRadius: '12px',
  background: 'color-mix(in srgb, var(--surface-soft) 70%, transparent)',
  overflow: 'hidden',
  position: 'relative',
};

const miniBarLabel: CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--muted)',
  whiteSpace: 'nowrap',
};

type ChartPoint = {
  label: string;
  fullLabel: string;
  value: number;
};

type SparklineCoordinate = ChartPoint & {
  x: number;
  y: number;
};

type SparklineGeometry = {
  coords: SparklineCoordinate[];
  linePath: string;
  areaPath: string;
  baselineY: number;
};

const formatDelta = (value: number) => {
  if (value === 0) {
    return 'No change';
  }
  const prefix = value > 0 ? '+' : '−';
  return `${prefix}${formatNumber(Math.abs(value))}`;
};

const formatPercentChange = (current: number, previous: number | null) => {
  if (previous === null || previous === 0) {
    return '—';
  }

  const diff = ((current - previous) / previous) * 100;
  if (!Number.isFinite(diff)) {
    return '—';
  }

  const prefix = diff > 0 ? '+' : diff < 0 ? '−' : '';
  return `${prefix}${Math.abs(diff).toFixed(1)}%`;
};

const createSparklineGeometry = (points: ChartPoint[]): SparklineGeometry => {
  if (points.length === 0) {
    return { coords: [], linePath: '', areaPath: '', baselineY: chartDimensions.verticalPadding }; 
  }

  const { width, height, horizontalPadding, verticalPadding } = chartDimensions;
  const innerWidth = width - horizontalPadding * 2;
  const innerHeight = height - verticalPadding * 2;

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const coords: SparklineCoordinate[] = points.map((point, index) => {
    const ratio = maxValue === 0 ? 0 : point.value / maxValue;
    const x =
      points.length === 1
        ? horizontalPadding + innerWidth / 2
        : horizontalPadding + (innerWidth / (points.length - 1)) * index;
    const y = verticalPadding + innerHeight - ratio * innerHeight;
    return { ...point, x, y };
  });

  const baselineY = verticalPadding + innerHeight;

  const linePath = coords
    .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`)
    .join(' ');

  let areaPath = '';
  if (coords.length > 0) {
    areaPath = `M ${coords[0]!.x} ${baselineY}`;
    coords.forEach((coord) => {
      areaPath += ` L ${coord.x} ${coord.y}`;
    });
    const last = coords[coords.length - 1]!;
    areaPath += ` L ${last.x} ${baselineY} Z`;
  }

  return { coords, linePath, areaPath, baselineY };
};

const AnimatedSparkline = ({ points }: { points: ChartPoint[] }) => {
  const geometry = useMemo(() => createSparklineGeometry(points), [points]);
  const baseId = useId();
  const strokeGradientId = `${baseId}-spark-stroke`;
  const areaGradientId = `${baseId}-spark-fill`;
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const element = pathRef.current;
    if (!element || !geometry.linePath) {
      setPathLength(0);
      setIsAnimated(false);
      return;
    }

    const total = element.getTotalLength();
    setPathLength(total);
    setIsAnimated(false);

    const frame = requestAnimationFrame(() => setIsAnimated(true));
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [geometry.linePath, geometry.coords.length]);

  if (!geometry.coords.length) {
    return null;
  }

  const lastPoint = geometry.coords[geometry.coords.length - 1];

  return (
    <div style={{ width: '100%', marginTop: '1.1rem' }}>
      <svg
        viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '160px' }}
        role="img"
        aria-label="Union member growth sparkline"
      >
        <defs>
          <linearGradient id={strokeGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
          <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={chartDimensions.horizontalPadding}
          y1={geometry.baselineY}
          x2={chartDimensions.width - chartDimensions.horizontalPadding}
          y2={geometry.baselineY}
          stroke="var(--surface-border)"
          strokeWidth={0.6}
          strokeDasharray="4 4"
        />

        {geometry.areaPath ? (
          <path
            d={geometry.areaPath}
            fill={`url(#${areaGradientId})`}
            style={{
              opacity: isAnimated ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out 0.2s',
            }}
          />
        ) : null}

        {geometry.linePath ? (
          <path
            ref={pathRef}
            d={geometry.linePath}
            fill="none"
            stroke={`url(#${strokeGradientId})`}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={pathLength || undefined}
            strokeDashoffset={isAnimated ? 0 : pathLength || undefined}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.15s' }}
          />
        ) : null}

        {geometry.coords.map((coord, index) => (
          <circle
            key={`${coord.label}-${index}`}
            cx={coord.x}
            cy={coord.y}
            r={index === geometry.coords.length - 1 ? 2.6 : 1.8}
            fill={index === geometry.coords.length - 1 ? 'var(--surface-primary)' : 'var(--surface-soft)'}
            stroke={index === geometry.coords.length - 1 ? 'var(--accent)' : 'color-mix(in srgb, var(--primary) 60%, transparent)'}
            strokeWidth={index === geometry.coords.length - 1 ? 1.1 : 0.9}
            style={{ opacity: index === geometry.coords.length - 1 ? 1 : 0.65 }}
          />
        ))}

        {lastPoint ? (
          <text
            x={lastPoint.x}
            y={lastPoint.y - 4}
            textAnchor="end"
            fontSize={4.2}
            fill="var(--shell-foreground)"
            style={{ fontWeight: 600 }}
          >
            {formatNumber(lastPoint.value)}
          </text>
        ) : null}
      </svg>
    </div>
  );
};

const AnimatedColumnChart = ({ points }: { points: ChartPoint[] }) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsAnimated(true));
    return () => {
      cancelAnimationFrame(frame);
      setIsAnimated(false);
    };
  }, [points]);

  if (!points.length) {
    return null;
  }

  const peak = Math.max(...points.map((point) => point.value), 1);

  return (
    <div style={miniBarsRow}>
      {points.map((point) => {
        const intensity = peak === 0 ? 0 : point.value / peak;
        const gradientStrength = Math.min(90, 45 + intensity * 45).toFixed(0);

        return (
          <div key={point.label} style={miniBarStack}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
              {formatNumber(point.value)}
            </span>
            <div style={miniBarTrack}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transformOrigin: 'bottom center',
                  transform: `scaleY(${isAnimated ? intensity : 0})`,
                  transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s',
                  background: `linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--primary) ${gradientStrength}%, transparent) 100%)`,
                  borderRadius: '12px',
                  boxShadow: '0 14px 28px rgba(8, 22, 48, 0.16)',
                }}
              />
            </div>
            <span style={miniBarLabel}>{point.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const statValueStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.5rem',
  color: 'var(--shell-foreground)',
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.2rem',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const activityItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.9rem',
};

const indicatorStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  display: 'grid',
  placeItems: 'center',
  fontSize: '1.1rem',
  fontWeight: 600,
  flexShrink: 0,
};

const loadingCardStyle: CSSProperties = {
  ...cardStyle,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '220px',
  color: 'var(--muted)',
  fontSize: '0.95rem',
};

const DashboardContent = () => {
  const { token } = useAuthSession();
  const [stats, setStats] = useState<UnionStats | null>(null);
  const [status, setStatus] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const shellConfig = useMemo(
    () => ({
      sidebarLogo: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '72px', height: '72px', display: 'grid', placeItems: 'center' }}>
            <Image src="/sda-logo.png" alt="SDA logo" width={64} height={64} priority />
          </div>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--primary)' }}>
              Umuganda Command
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'rgba(82,96,109,0.72)' }}>Leadership Console</span>
          </div>
        </div>
      ),
    }),
    [],
  );

  useDashboardShellConfig(shellConfig);

  useEffect(() => {
    let active = true;

    if (!token) {
      setStats(null);
      setStatus('idle');
      setError(null);
      return () => {
        active = false;
      };
    }

    setStatus('loading');
    setError(null);

    fetchUnionStats(token)
      .then((data) => {
        if (!active) return;
        setStats(data);
        setStatus('success');
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data.';
        setError(message);
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [token]);

  const growthSeries = useMemo(() => stats?.memberGrowth ?? [], [stats]);
  const attendanceSeries = useMemo(() => stats?.attendanceTrends ?? [], [stats]);

  const growthTrendPoints = useMemo<ChartPoint[]>(() => {
    const mapped = growthSeries.map((point) => ({
      label: toChartLabel(point.date),
      fullLabel: toFullLabel(point.date),
      value: point.count,
    }));
    if (mapped.length > 12) {
      return mapped.slice(-12);
    }
    return mapped;
  }, [growthSeries]);

  const attendanceTrendPoints = useMemo<ChartPoint[]>(() => {
    const mapped = attendanceSeries.map((point) => ({
      label: toChartLabel(point.month),
      fullLabel: toFullLabel(point.month),
      value: point.attendance,
    }));
    if (mapped.length > 6) {
      return mapped.slice(-6);
    }
    return mapped;
  }, [attendanceSeries]);

  const latestGrowthPoint = growthTrendPoints.length ? growthTrendPoints[growthTrendPoints.length - 1]! : null;
  const previousGrowthPoint = growthTrendPoints.length > 1 ? growthTrendPoints[growthTrendPoints.length - 2]! : null;
  const growthDeltaValue =
    latestGrowthPoint && previousGrowthPoint ? latestGrowthPoint.value - previousGrowthPoint.value : null;
  const growthDeltaChipText =
    growthDeltaValue === null || !latestGrowthPoint || !previousGrowthPoint
      ? 'Trend pending'
      : `${formatDelta(growthDeltaValue)} (${formatPercentChange(latestGrowthPoint.value, previousGrowthPoint.value)})`;
  const growthLatestChipText = latestGrowthPoint ? `${formatNumber(latestGrowthPoint.value)} members` : 'Awaiting data';
  const growthAverageDailyValue =
    latestGrowthPoint && growthTrendPoints.length > 1
      ? Math.max(
          0,
          Math.round((latestGrowthPoint.value - growthTrendPoints[0]!.value) / (growthTrendPoints.length - 1)),
        )
      : null;
  const growthAverageChipText =
    growthAverageDailyValue === null ? 'Average pending' : `${formatNumber(growthAverageDailyValue)} avg/day`;
  const growthAxisStartLabel = growthTrendPoints.length ? growthTrendPoints[0]!.label : '';
  const growthAxisEndLabel = latestGrowthPoint?.label ?? '';

  const attendanceTrendColumns = attendanceTrendPoints;
  const latestAttendancePoint = attendanceTrendColumns.length
    ? attendanceTrendColumns[attendanceTrendColumns.length - 1]!
    : null;
  const previousAttendancePoint = attendanceTrendColumns.length > 1
    ? attendanceTrendColumns[attendanceTrendColumns.length - 2]!
    : null;
  const attendanceDeltaValue =
    latestAttendancePoint && previousAttendancePoint
      ? latestAttendancePoint.value - previousAttendancePoint.value
      : null;
  const attendanceDeltaChipText =
    attendanceDeltaValue === null || !latestAttendancePoint || !previousAttendancePoint
      ? 'Trend pending'
      : `${formatDelta(attendanceDeltaValue)} (${formatPercentChange(
          latestAttendancePoint.value,
          previousAttendancePoint.value,
        )})`;
  const attendanceLatestChipText = latestAttendancePoint
    ? `${formatNumber(latestAttendancePoint.value)} attendees`
    : 'Awaiting data';
  const attendanceAverageValue = attendanceTrendColumns.length
    ? Math.round(attendanceTrendColumns.reduce((sum, point) => sum + point.value, 0) / attendanceTrendColumns.length)
    : null;
  const attendanceAverageChipText =
    attendanceAverageValue === null ? 'Average pending' : `${formatNumber(attendanceAverageValue)} avg/report`;
  const attendanceAxisStartLabel = attendanceTrendColumns.length ? attendanceTrendColumns[0]!.label : '';
  const attendanceAxisEndLabel = latestAttendancePoint?.label ?? '';

  const statCards = useMemo(
    () => [
      {
        label: 'Total members',
        value: stats?.totalMembers ?? 0,
        helper: 'Across all districts',
      },
      {
        label: 'Registered districts',
        value: stats?.totalDistricts ?? 0,
        helper: 'Active within your union',
      },
      {
        label: 'Active churches',
        value: stats?.totalChurches ?? 0,
        helper: 'Reporting attendance',
      },
      {
        label: 'District pastors',
        value: stats?.totalPastors ?? 0,
        helper: 'With active assignments',
      },
    ],
    [stats],
  );

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case 'member_added':
        return { icon: '👤', color: 'var(--surface-soft)', tint: 'var(--primary)' };
      case 'attendance_recorded':
        return { icon: '📝', color: 'var(--surface-soft)', tint: 'var(--accent)' };
      case 'new_church':
        return { icon: '⛪', color: 'var(--surface-soft)', tint: 'var(--primary)' };
      case 'new_district':
        return { icon: '🗺️', color: 'var(--surface-soft)', tint: 'var(--accent)' };
      default:
        return { icon: '📌', color: 'var(--surface-soft)', tint: 'var(--muted)' };
    }
  };

  if (!token) {
    return (
      <div style={loadingCardStyle}>
        You need to be signed in as a union administrator to view this dashboard.
      </div>
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <div style={pageContainer}>
        <div style={loadingCardStyle}>Loading union dashboard…</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={loadingCardStyle}>
        <p style={{ margin: 0 }}>{error ?? 'Unable to load data.'}</p>
        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Please refresh the page to try again.</p>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      <RequireRole allowed="UNION_ADMIN">
        <section style={statsGrid}>
          {statCards.map((stat) => (
            <article key={stat.label} style={cardStyle}>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                {stat.label}
              </span>
              <div style={statValueStyle}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700 }}>
                  {formatNumber(stat.value)}
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem' }}>{stat.helper}</p>
            </article>
          ))}
        </section>

        <section style={insightGrid}>
          <article style={cardStyle}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={sectionTitleStyle}>Recent union activity</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Last {stats?.recentActivity.length ?? 0} events
              </span>
            </header>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {stats?.recentActivity.length ? (
                stats.recentActivity.map((item) => {
                  const meta = renderActivityIcon(item.type);
                  return (
                    <div key={item.id} style={activityItemStyle}>
                      <div style={{ ...indicatorStyle, backgroundColor: meta.color, color: meta.tint }}>{meta.icon}</div>
                      <div style={{ display: 'grid', gap: '0.35rem' }}>
                        <strong style={{ color: 'var(--shell-foreground)', fontSize: '0.95rem' }}>{item.description}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  Activity will appear here as members join, attendance is recorded, and districts are added.
                </p>
              )}
            </div>
          </article>

          <article style={chartCardStyle}>
            <header>
              <h2 style={sectionTitleStyle}>Member growth (last 30 days)</h2>
              <p style={chartSubtitleStyle}>Running total of new member registrations.</p>
            </header>
            {growthTrendPoints.length ? (
              <>
                <div style={chartMetaRow}>
                  <span style={chipStyle}>
                    <span style={chipDotStyle} />
                    {growthLatestChipText}
                  </span>
                  <span style={chipStyle}>
                    <span style={chipDotStyle} />
                    {growthAverageChipText}
                  </span>
                  <span style={chipStyle}>
                    <span style={chipDotStyle} />
                    {growthDeltaChipText}
                  </span>
                </div>
                <AnimatedSparkline points={growthTrendPoints} />
                <div style={axisLabelRow}>
                  <span>{growthAxisStartLabel}</span>
                  <span>{growthAxisEndLabel}</span>
                </div>
              </>
            ) : (
              <p style={{ margin: '1rem 0 0', color: 'var(--muted)' }}>No recent member registrations yet.</p>
            )}
          </article>

          <article style={chartCardStyle}>
            <header>
              <h2 style={sectionTitleStyle}>Attendance trend by month</h2>
              <p style={chartSubtitleStyle}>Total attendance records captured per month.</p>
            </header>
            {attendanceTrendColumns.length ? (
              <>
                <div style={chartMetaRow}>
                  <span style={chipStyle}>
                    <span style={chipDotStyle} />
                    {attendanceLatestChipText}
                  </span>
                  <span style={chipStyle}>
                    <span style={chipDotStyle} />
                    {attendanceAverageChipText}
                  </span>
                  <span style={chipStyle}>
                    <span style={chipDotStyle} />
                    {attendanceDeltaChipText}
                  </span>
                </div>
                <AnimatedColumnChart points={attendanceTrendColumns} />
                <div style={axisLabelRow}>
                  <span>{attendanceAxisStartLabel}</span>
                  <span>{attendanceAxisEndLabel}</span>
                </div>
              </>
            ) : (
              <p style={{ margin: '1rem 0 0', color: 'var(--muted)' }}>
                Attendance logging activity will appear once sessions are recorded.
              </p>
            )}
          </article>
        </section>
      </RequireRole>
    </div>
  );
};

const DashboardPage = () => (
  <DashboardShellProvider>
    <DashboardContent />
  </DashboardShellProvider>
);

export default DashboardPage;