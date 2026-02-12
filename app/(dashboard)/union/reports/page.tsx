'use client';

import { jsPDF } from 'jspdf';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import type { HeroStat } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  fetchChurches,
  fetchDistrictPastors,
  fetchDistricts,
  fetchUnionStats,
  type ChurchSummary,
  type DistrictPastorSummary,
  type DistrictSummary,
  type UnionStats,
} from '@/lib/api';

type ReportRow = Record<string, string | number | null | undefined>;

type ColumnDef = {
  key: string;
  label: string;
};

type ReportDefinition = {
  key: string;
  title: string;
  description: string;
  columns: ColumnDef[];
  rows: ReportRow[];
  footnote?: string;
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.9rem',
};

const cardStyle: CSSProperties = {
  background: 'var(--surface-primary)',
  borderRadius: '28px',
  padding: '2.2rem',
  boxShadow: '0 24px 52px rgba(24, 76, 140, 0.08)',
  display: 'grid',
  gap: '1.4rem',
};

const cardHeaderStyle: CSSProperties = {
  display: 'grid',
  gap: '0.45rem',
};

const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(24,76,140,0.6)',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: '1.5rem',
  color: 'var(--primary)',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: 'var(--muted)',
  lineHeight: 1.65,
  fontSize: '0.98rem',
};

const previewShellStyle: CSSProperties = {
  borderRadius: '18px',
  border: '1px solid var(--surface-border)',
  overflow: 'hidden',
  background: 'var(--surface-secondary)',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
  color: 'var(--shell-foreground)',
};

const tableHeaderCell: CSSProperties = {
  background: 'rgba(24,76,140,0.08)',
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontWeight: 600,
};

const tableCell: CSSProperties = {
  padding: '0.7rem 1rem',
  borderTop: '1px solid var(--surface-border)',
};

const actionBarStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const buttonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '16px',
  padding: '0.65rem 1.2rem',
  background: 'var(--primary)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 18px 32px rgba(24, 76, 140, 0.18)',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'var(--surface-secondary)',
  color: 'var(--primary)',
  boxShadow: 'inset 0 0 0 1px rgba(24,76,140,0.2)',
};

const emptyStateStyle: CSSProperties = {
  margin: 0,
  fontStyle: 'italic',
  color: 'var(--muted)',
  padding: '1rem',
};

const footnoteStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.8rem',
  color: 'var(--text-soft-accent)',
};

const errorBannerStyle: CSSProperties = {
  padding: '1rem 1.2rem',
  borderRadius: '18px',
  background: 'rgba(220, 38, 38, 0.12)',
  color: 'rgba(153, 27, 27, 0.92)',
  border: '1px solid rgba(220, 38, 38, 0.24)',
  fontSize: '0.95rem',
};

const statusBadgeBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.2rem 0.65rem',
  borderRadius: '999px',
  fontSize: '0.82rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const statusActiveStyle: CSSProperties = {
  ...statusBadgeBase,
  background: 'var(--status-success-bg)',
  color: 'var(--status-success-foreground)',
  boxShadow: 'inset 0 0 0 1px var(--status-success-border)',
};

const statusInactiveStyle: CSSProperties = {
  ...statusBadgeBase,
  background: 'var(--status-inactive-bg)',
  color: 'var(--status-inactive-foreground)',
  boxShadow: 'inset 0 0 0 1px var(--status-inactive-border)',
};

const DISTRICT_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'District' },
  { key: 'location', label: 'Location' },
  { key: 'churchCount', label: 'Churches' },
];

const CHURCH_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Church' },
  { key: 'district', label: 'District' },
  { key: 'location', label: 'Location' },
  { key: 'members', label: 'Registered members' },
];

const PASTOR_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Pastor' },
  { key: 'district', label: 'District assignment' },
  { key: 'contact', label: 'Contact' },
  { key: 'status', label: 'Status' },
];

const MEMBER_GROWTH_COLUMNS: ColumnDef[] = [
  { key: 'month', label: 'Month' },
  { key: 'members', label: 'Active members' },
  { key: 'delta', label: 'Change vs prev.' },
];

const ATTENDANCE_COLUMNS: ColumnDef[] = [
  { key: 'month', label: 'Month' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'percent', label: 'Attendance vs cap' },
];

const formatCell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toLocaleString() : String(value);
  }
  return String(value);
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 120) || 'export';

const formatMonthLabel = (input: string): string => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const buildCsv = (columns: ColumnDef[], rows: ReportRow[]) => {
  const escape = (text: string) =>
    text.includes(',') || text.includes('"') || text.includes('\n')
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  const headers = columns.map((col) => escape(col.label));
  const data = rows.map((row) => columns.map((col) => escape(formatCell(row[col.key]))));
  return [headers.join(','), ...data.map((line) => line.join(','))].join('\n');
};

const downloadCsv = (title: string, columns: ColumnDef[], rows: ReportRow[]) => {
  if (!rows.length) {
    return;
  }
  const csv = buildCsv(columns, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${slugify(title)}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadPdf = (title: string, columns: ColumnDef[], rows: ReportRow[]) => {
  if (!rows.length) {
    return;
  }

  const orientation = columns.length > 4 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation });
  const marginX = 16;
  const marginY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const availableWidth = pageWidth - marginX * 2;
  const colWidth = availableWidth / columns.length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, marginX, marginY);

  doc.setFontSize(10);
  doc.setDrawColor(210, 218, 232);
  let cursorY = marginY + 8;

  const ensureSpace = (heightNeeded: number) => {
    if (cursorY + heightNeeded > pageHeight - marginY) {
      doc.addPage();
      cursorY = marginY;
    }
  };

  const drawRow = (values: string[], bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    let rowHeight = 6;
    const cellTop = cursorY;
    values.forEach((value, index) => {
      const x = marginX + index * colWidth;
      const lines = doc.splitTextToSize(value, colWidth - 4);
      rowHeight = Math.max(rowHeight, lines.length * 5 + 2);
      doc.text(lines, x + 2, cursorY + 4, { baseline: 'top' });
    });
    ensureSpace(rowHeight + 2);
    doc.line(marginX, cellTop, pageWidth - marginX, cellTop);
    cursorY += rowHeight;
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  };

  drawRow(columns.map((col) => col.label), true);
  rows.forEach((row) => {
    const values = columns.map((col) => formatCell(row[col.key]));
    drawRow(values);
  });

  doc.save(`${slugify(title)}-${new Date().toISOString().slice(0, 10)}.pdf`);
};

type ReportCardProps = {
  report: ReportDefinition;
  loading: boolean;
  onDownloadCsv: (report: ReportDefinition) => void;
  onDownloadPdf: (report: ReportDefinition) => void;
};

const ReportCard = ({ report, loading, onDownloadCsv, onDownloadPdf }: ReportCardProps) => {
  const { title, description, columns, rows, footnote } = report;
  const previewRows = rows.slice(0, 6);

  return (
    <article style={cardStyle}>
      <header style={cardHeaderStyle}>
        <span style={labelStyle}>Report</span>
        <h3 style={titleStyle}>{title}</h3>
        <p style={descriptionStyle}>{description}</p>
      </header>

      <div style={previewShellStyle}>
        {loading ? (
          <p style={emptyStateStyle}>Loading data…</p>
        ) : previewRows.length ? (
          <table style={tableStyle}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={tableHeaderCell}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, index) => (
                <tr key={`${title}-preview-${index}`}>
                  {columns.map((column) => (
                    <td key={column.key} style={tableCell}>
                      {column.key === 'status' ? (
                        <span
                          style={
                            String(row[column.key]).toLowerCase() === 'active'
                              ? statusActiveStyle
                              : statusInactiveStyle
                          }
                        >
                          {formatCell(row[column.key])}
                        </span>
                      ) : (
                        formatCell(row[column.key])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={emptyStateStyle}>No records available yet.</p>
        )}
      </div>

      <div style={actionBarStyle}>
        <button
          style={{ ...buttonStyle, opacity: rows.length ? 1 : 0.6, pointerEvents: rows.length ? 'auto' : 'none' }}
          type="button"
          onClick={() => onDownloadCsv(report)}
          disabled={!rows.length}
        >
          Download CSV
        </button>
        <button
          style={{
            ...secondaryButtonStyle,
            opacity: rows.length ? 1 : 0.6,
            pointerEvents: rows.length ? 'auto' : 'none',
          }}
          type="button"
          onClick={() => onDownloadPdf(report)}
          disabled={!rows.length}
        >
          Export PDF
        </button>
      </div>

      {footnote && <p style={footnoteStyle}>{footnote}</p>}
    </article>
  );
};

const ReportsPage = () => {
  const { token, user } = useAuthSession();

  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [churches, setChurches] = useState<ChurchSummary[]>([]);
  const [pastors, setPastors] = useState<DistrictPastorSummary[]>([]);
  const [unionStats, setUnionStats] = useState<UnionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      fetchDistricts(token, user?.unionId ? { unionId: user.unionId } : undefined),
      fetchChurches(token),
      fetchDistrictPastors(token),
      fetchUnionStats(token),
    ])
      .then((results) => {
        if (cancelled) {
          return;
        }

        const [districtResult, churchResult, pastorResult, statsResult] = results;

        if (districtResult.status === 'fulfilled') {
          setDistricts(districtResult.value);
        }
        if (churchResult.status === 'fulfilled') {
          setChurches(churchResult.value);
        }
        if (pastorResult.status === 'fulfilled') {
          setPastors(pastorResult.value);
        }
        if (statsResult.status === 'fulfilled') {
          setUnionStats(statsResult.value);
        }

        const failures = results
          .map((result, index) => {
            if (result.status === 'fulfilled') {
              return null;
            }
            switch (index) {
              case 0:
                return 'district directory';
              case 1:
                return 'church roster';
              case 2:
                return 'pastor assignments';
              case 3:
                return 'union statistics';
              default:
                return 'report';
            }
          })
          .filter(Boolean);

        setError(failures.length ? `Some reports could not be loaded: ${failures.join(', ')}.` : null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load reports.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, user?.unionId]);

  const districtMap = useMemo(() => {
    const next: Record<string, string> = {};
    districts.forEach((district) => {
      next[district.id] = district.name;
    });
    return next;
  }, [districts]);

  const churchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    churches.forEach((church) => {
      const key = church.districtId ?? 'unassigned';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [churches]);

  const districtRows = useMemo<ReportRow[]>(
    () =>
      districts.map((district) => ({
        name: district.name,
        location: district.location ?? '—',
        churchCount: churchCounts[district.id] ?? 0,
      })),
    [districts, churchCounts],
  );

  const churchRows = useMemo<ReportRow[]>(
    () =>
      churches.map((church) => ({
        name: church.name,
        district: church.districtId ? districtMap[church.districtId] ?? '—' : 'Unassigned',
        location: church.location ?? '—',
        members: church._count?.members ?? 0,
      })),
    [churches, districtMap],
  );

  const pastorRows = useMemo<ReportRow[]>(
    () =>
      pastors.map((pastor) => ({
        name: `${pastor.firstName} ${pastor.lastName}`.trim(),
        district: pastor.district?.name ?? 'Unassigned',
        contact: pastor.phoneNumber || pastor.email || '—',
        status: pastor.isActive ? 'Active' : 'Inactive',
      })),
    [pastors],
  );

  const memberGrowthRows = useMemo<ReportRow[]>(() => {
    if (!unionStats?.memberGrowth?.length) {
      return [];
    }
    return unionStats.memberGrowth.map((point, index, array) => {
      const previous = index > 0 ? array[index - 1].count : null;
      const delta = previous !== null ? point.count - previous : null;
      return {
        month: formatMonthLabel(point.date),
        members: point.count,
        delta: delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toLocaleString()}`,
      };
    });
  }, [unionStats]);

  const attendanceRows = useMemo<ReportRow[]>(() => {
    if (!unionStats?.attendanceTrends?.length) {
      return [];
    }
    return unionStats.attendanceTrends.map((trend) => ({
      month: formatMonthLabel(trend.month),
      attendance: trend.attendance,
      percent: unionStats.totalMembers
        ? `${Math.round((trend.attendance / unionStats.totalMembers) * 100)}%`
        : '—',
    }));
  }, [unionStats]);

  const heroStats: HeroStat[] = useMemo(() => {
    const totalMembers = unionStats?.totalMembers ?? null;
    const lastGrowthPoint = unionStats?.memberGrowth?.at(-1)?.count ?? null;
    const previousGrowthPoint = unionStats?.memberGrowth?.at(-2)?.count ?? null;
    const memberTrend =
      lastGrowthPoint !== null && previousGrowthPoint !== null
        ? `${lastGrowthPoint - previousGrowthPoint >= 0 ? '+' : ''}${(lastGrowthPoint - previousGrowthPoint).toLocaleString()} vs last month`
        : '—';

    return [
      {
        label: 'Districts tracked',
        value: loading ? '—' : districts.length.toLocaleString(),
        trend: churchRows.length ? `${churchRows.length.toLocaleString()} churches covered` : undefined,
      },
      {
        label: 'Pastors assigned',
        value: loading ? '—' : pastors.length.toLocaleString(),
        trend: pastors.length ? `${pastorRows.filter((row) => row.status === 'Active').length.toLocaleString()} active` : undefined,
      },
      {
        label: 'Membership footprint',
        value: totalMembers !== null ? totalMembers.toLocaleString() : '—',
        trend: memberTrend,
      },
    ];
  }, [loading, districts.length, churchRows.length, pastors.length, pastorRows, unionStats]);

  const shellConfig = useMemo(
    () => ({
      hero: (
        <RoleHero
          role="UNION_ADMIN"
          headline="Union-wide reports & analytics"
          subheadline="Download operational intelligence across districts, churches, and attendance in CSV or PDF formats."
          stats={heroStats}
        />
      ),
    }),
    [heroStats],
  );

  useDashboardShellConfig(shellConfig);

  const reports = useMemo<ReportDefinition[]>(
    () => [
      {
        key: 'districts',
        title: 'District directory',
        description: 'Union-wide index of districts, their locations, and covered churches.',
        columns: DISTRICT_COLUMNS,
        rows: districtRows,
        footnote: districtRows.length ? `Total districts: ${districtRows.length.toLocaleString()}` : undefined,
      },
      {
        key: 'churches',
        title: 'Church roster',
        description: 'Church-level roster with geographic placement and membership counts.',
        columns: CHURCH_COLUMNS,
        rows: churchRows,
        footnote: churchRows.length ? `Total churches: ${churchRows.length.toLocaleString()}` : undefined,
      },
      {
        key: 'pastors',
        title: 'District pastor assignments',
        description: 'Active and historical district pastor appointments with contact channels.',
        columns: PASTOR_COLUMNS,
        rows: pastorRows,
        footnote: pastorRows.length ? `Total pastors: ${pastorRows.length.toLocaleString()}` : undefined,
      },
      {
        key: 'memberGrowth',
        title: 'Membership growth timeline',
        description: 'Month-over-month membership growth across the Union.',
        columns: MEMBER_GROWTH_COLUMNS,
        rows: memberGrowthRows,
        footnote: memberGrowthRows.length
          ? `Latest period: ${memberGrowthRows.at(-1)?.month ?? '—'} (${memberGrowthRows.at(-1)?.members ?? '—'} members)`
          : undefined,
      },
      {
        key: 'attendance',
        title: 'Union attendance trend',
        description: 'Attendance performance for the most recent six sessions reported.',
        columns: ATTENDANCE_COLUMNS,
        rows: attendanceRows,
        footnote: attendanceRows.length
          ? `Latest attendance: ${attendanceRows.at(-1)?.attendance ?? '—'} (${attendanceRows.at(-1)?.percent ?? '—'})`
          : undefined,
      },
    ],
    [districtRows, churchRows, pastorRows, memberGrowthRows, attendanceRows],
  );

  const handleDownloadCsv = useCallback((report: ReportDefinition) => {
    downloadCsv(report.title, report.columns, report.rows);
  }, []);

  const handleDownloadPdf = useCallback((report: ReportDefinition) => {
    downloadPdf(report.title, report.columns, report.rows);
  }, []);

  return (
    <RequireRole allowed="UNION_ADMIN">
      <section style={gridStyle}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        {reports.map((report) => (
          <ReportCard
            key={report.key}
            report={report}
            loading={loading}
            onDownloadCsv={handleDownloadCsv}
            onDownloadPdf={handleDownloadPdf}
          />
        ))}
      </section>
    </RequireRole>
  );
};

export default ReportsPage;
